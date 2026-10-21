import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, Pencil, Plus, RefreshCw, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { api } from './api';
import LabOperations from './LabOperations';
import { DeleteDialog, EntityForm, LinkPanel, Modal, messageOf } from './components';
import { positiveId, searchBody } from './search';
import { difficulties, difficultyLabels, emptyFilters, isLab, type Entity, type Filters, type Resource, type Page } from './types';

type View = Resource | 'bars';
const titles: Record<View, string> = { 'lab-works': 'Лабораторные работы', disciplines: 'Дисциплины', bars: 'Программа дисциплин' };
const sortLabels: Record<string, string> = { id: 'ID', name: 'Название', creationDate: 'Дата создания', minimalPoint: 'Минимальный балл', difficulty: 'Сложность', practiceHours: 'Часы практики', labsCount: 'Количество работ', 'coordinates.x': 'Координата X', 'coordinates.y': 'Координата Y', 'discipline.id': 'ID дисциплины', 'discipline.name': 'Название дисциплины', 'discipline.practiceHours': 'Часы дисциплины', 'discipline.labsCount': 'Работ в дисциплине' };

export default function App() {
  const [view, setView] = useState<View>('lab-works');
  const [revision, setRevision] = useState(0);
  async function refreshLinks() { setRevision(value => value + 1); }
  return <div className="app-shell">
    <nav className="navigation" aria-label="Основная навигация">
      {(['lab-works', 'disciplines', 'bars'] as const).map(key => <button key={key} aria-label={key === 'bars' ? 'Связи · BARS' : titles[key]} aria-current={view === key ? 'page' : undefined} className={`nav-item ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>{key === 'bars' ? 'Связи' : titles[key]}</button>)}
    </nav>
    <main className="main"><div className="page-content">
      {view === 'bars' ? <LinkPanel changed={refreshLinks} /> : <Catalog key={view} resource={view} revision={revision} />}
    </div></main>
  </div>;
}
function Catalog({ resource, revision }: { resource: Resource; revision: number }) {
  const lab = resource === 'lab-works';
  const [draft, setDraft] = useState<Filters>({ ...emptyFilters });
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const [expanded, setExpanded] = useState(false), [page, setPage] = useState(1), [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('id'), [direction, setDirection] = useState('asc');
  const [thenBy, setThenBy] = useState(''), [thenDirection, setThenDirection] = useState('asc');
  const [data, setData] = useState<Page<Entity> | null>(null);
  const [busy, setBusy] = useState(true), [lookupBusy, setLookupBusy] = useState(false);
  const [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [lookup, setLookup] = useState('');
  const [editor, setEditor] = useState<{ entity?: Entity } | null>(null);
  const [deleting, setDeleting] = useState<Entity | null>(null), [detail, setDetail] = useState<Entity | null>(null);
  const [reload, setReload] = useState(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    const controller = new AbortController(); setBusy(true); setError(''); setData(null);
    const request = api.search(resource, searchBody(resource, filters, page, size, sortBy, direction, thenBy, thenDirection), controller.signal);
    request.then(result => {
      if (controller.signal.aborted) return;
      if (!result || !Array.isArray(result.content) || !Number.isSafeInteger(result.totalElements) || !Number.isSafeInteger(result.totalPages)) throw new Error('Сервис вернул неверный формат страницы.');
      setData(result);
    }).catch(error => {
      if (controller.signal.aborted) return;
      setError(messageOf(error));
    }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [resource, reload, revision, filters, page, size, sortBy, direction, thenBy, thenDirection]);

  useEffect(() => {
    if (data && !busy && page > Math.max(1, data.totalPages)) setPage(Math.max(1, data.totalPages));
  }, [data?.totalPages, busy, page]);
  function apply(event: FormEvent) {
    event.preventDefault(); setError('');
    try { searchBody(resource, draft, 1, size, sortBy, direction); setFilters({ ...draft }); setPage(1); } catch (error) { setError(messageOf(error)); }
  }
  async function openById(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('');
    try {
      const id = positiveId(lookup); setLookupBusy(true); const entity = await api.get(resource, id);
      if (!alive.current) return;
      setDetail(entity);
    } catch (error) { if (alive.current) setError(messageOf(error)); } finally { if (alive.current) setLookupBusy(false); }
  }
  function refresh() { setReload(value => value + 1); }
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const setField = (key: keyof Filters, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const ranges = lab ? [['x', 'Координата X'], ['y', 'Координата Y'], ['minimalPoint', 'Минимальный балл'], ['creationDate', 'Дата создания · UTC'], ['disciplinePracticeHours', 'Часы дисциплины'], ['disciplineLabsCount', 'Работ в дисциплине']] : [['practiceHours', 'Часы практики'], ['labsCount', 'Количество работ']];
  const sortFields = lab ? ['id', 'name', 'creationDate', 'minimalPoint', 'difficulty', 'coordinates.x', 'coordinates.y', 'discipline.id', 'discipline.name', 'discipline.practiceHours', 'discipline.labsCount'] : ['id', 'name', 'practiceHours', 'labsCount'];
  return <>
    {lab && <LabOperations onLab={entity => { setDetail(entity); }} />}
    <section className="card catalog"><div className="catalog-heading"><div><h2>{lab ? 'Лабораторные работы' : 'Дисциплины'} <span className="count-badge">{data?.totalElements ?? '—'}</span></h2></div><button className="button primary" onClick={() => setEditor({})}><Plus size={17} />{lab ? 'Добавить работу' : 'Добавить дисциплину'}</button></div>
      <div className="toolbar"><form className="id-lookup" onSubmit={openById}><span className="input-prefix">ID</span><input aria-label="ID записи" inputMode="numeric" pattern="[0-9]+" required placeholder="Открыть по ID" value={lookup} onChange={event => setLookup(event.target.value)} /><button className="icon-button" aria-label="Открыть запись по ID" disabled={lookupBusy}>{lookupBusy ? <RefreshCw size={18} className="spin" /> : <ArrowRight size={18} />}</button></form><button className="button secondary compact" onClick={refresh} disabled={busy}><RefreshCw size={16} className={busy ? 'spin' : ''} />Обновить</button></div>
      <form onSubmit={apply} className="filter-form"><div className="filter-row"><div className="search-field"><Search size={18} /><input aria-label="Поиск по названию" placeholder="Найти по названию…" value={draft.name} onChange={event => setField('name', event.target.value)} /></div>{lab && <select aria-label="Фильтр по сложности" value={draft.difficulty} onChange={event => setField('difficulty', event.target.value)}><option value="">Любая сложность</option>{difficulties.map(value => <option key={value} value={value}>{difficultyLabels[value]}</option>)}</select>}<button type="button" className={`button secondary ${expanded ? 'filter-active' : ''}`} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><SlidersHorizontal size={16} />Фильтры{activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}</button><button className="button search-submit">Найти</button></div>
        {expanded && <div className="advanced-filters"><label>ID записей<input value={draft.ids} placeholder="1, 2, 3" onChange={event => setField('ids', event.target.value)} /></label>{lab && <label>ID дисциплин<input value={draft.disciplineIds} placeholder="1, 2, 3" onChange={event => setField('disciplineIds', event.target.value)} /></label>}{lab && <><label>Наличие дисциплины<select value={draft.hasDiscipline} onChange={event => setField('hasDiscipline', event.target.value)}><option value="">Любые</option><option value="true">С дисциплиной</option><option value="false">Без дисциплины</option></select></label><label>Наличие сложности<select value={draft.hasDifficulty} onChange={event => setField('hasDifficulty', event.target.value)}><option value="">Любые</option><option value="true">Задана</option><option value="false">Не задана</option></select></label><label>Название дисциплины<input value={draft.disciplineName} onChange={event => setField('disciplineName', event.target.value)} /></label></>}{ranges.map(([field, label]) => <fieldset className="range" key={field}><legend>{label}</legend><div>{['From', 'To'].map((suffix, index) => <input key={suffix} aria-label={`${label} ${index === 0 ? 'от' : 'до'}`} type={field === 'creationDate' ? 'date' : 'number'} step={field === 'y' ? 'any' : '1'} placeholder={index === 0 ? 'От' : 'До'} value={draft[`${field}${suffix}` as keyof Filters]} onChange={event => setField(`${field}${suffix}` as keyof Filters, event.target.value)} />)}</div></fieldset>)}</div>}
        {activeFilters > 0 && <button type="button" className="text-button clear-filters" onClick={() => { setDraft({ ...emptyFilters }); setFilters({ ...emptyFilters }); setPage(1); setError(''); }}>Сбросить фильтры <X size={13} /></button>}
      </form>
      {error && <div className="alert error catalog-alert" role="alert">{error}<button type="button" className="text-button" onClick={() => { setError(''); setReload(value => value + 1); }}>Повторить</button></div>}{success && <div className="alert success catalog-alert" role="status"><Check size={16} />{success}<button className="icon-button" aria-label="Скрыть сообщение" onClick={() => setSuccess('')}><X size={15} /></button></div>}
      <div className="table-controls"><div><label htmlFor="sort">Сортировка</label><select aria-label="Сортировка" id="sort" value={sortBy} onChange={event => { setSortBy(event.target.value); if (thenBy === event.target.value) setThenBy(''); setPage(1); }}>{sortFields.map(key => <option key={key} value={key}>{sortLabels[key]}</option>)}</select><button className="icon-button" aria-label={direction === 'asc' ? 'Сортировать по убыванию' : 'Сортировать по возрастанию'} onClick={() => { setDirection(value => value === 'asc' ? 'desc' : 'asc'); setPage(1); }}><ArrowDown size={15} style={{ transform: direction === 'desc' ? 'rotate(180deg)' : undefined }} /></button></div></div>
      <div className="table-controls secondary-sort"><span>Второй критерий</span><div><select aria-label="Второй критерий сортировки" value={thenBy} onChange={event => { setThenBy(event.target.value); setPage(1); }}><option value="">Не выбран</option>{sortFields.filter(key => key !== sortBy).map(key => <option key={key} value={key}>{sortLabels[key]}</option>)}</select><button className="icon-button" disabled={!thenBy} aria-label="Изменить направление второго критерия" onClick={() => { setThenDirection(value => value === 'asc' ? 'desc' : 'asc'); setPage(1); }}><ArrowDown size={15} style={{ transform: thenDirection === 'desc' ? 'rotate(180deg)' : undefined }} /></button></div></div>
      <div className="table-scroll" aria-busy={busy}><table><thead><tr><th>ID</th><th>{lab ? 'Лабораторная работа' : 'Название дисциплины'}</th>{lab ? <><th>Сложность</th><th>Мин. балл</th><th>Дисциплина</th><th>Координаты</th></> : <><th>Часы практики</th><th>Лабораторных</th></>}<th><span className="sr-only">Действия</span></th></tr></thead><tbody>{!busy && data?.content.map(entity => <tr key={entity.id}><td className="id-cell">{String(entity.id).padStart(2, '0')}</td><td><button className="entity-title" onClick={() => setDetail(entity)}>{entity.name}</button>{isLab(entity) && <span className="date-cell">{new Date(entity.creationDate).toLocaleDateString('ru-RU', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })}</span>}</td>{isLab(entity) ? <><td><span className={`difficulty ${entity.difficulty?.toLowerCase() ?? 'unset'}`}><span />{entity.difficulty ? difficultyLabels[entity.difficulty] : 'Не задана'}</span></td><td className="number-cell">{entity.minimalPoint}</td><td>{entity.discipline ? <span className="discipline-tag">{entity.discipline.name}</span> : <span className="muted">Без дисциплины</span>}</td><td className="coordinates">{entity.coordinates.x}; {entity.coordinates.y}</td></> : <><td className="number-cell">{entity.practiceHours} <span className="muted">ч</span></td><td><span className="count-badge">{entity.labsCount}</span></td></>}<td><div className="row-actions"><button className="icon-button" aria-label={`Редактировать ${entity.name}`} onClick={() => setEditor({ entity })}><Pencil size={16} /></button><button className="icon-button delete-button" aria-label={`Удалить ${entity.name}`} onClick={() => setDeleting(entity)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>
      {busy ? <div className="empty-state"><RefreshCw className="spin" size={20} />Загрузка…</div> : !error && !data?.content.length && <div className="empty-state">{activeFilters ? 'Ничего не найдено' : 'Нет записей'}</div>}</div>
      <div className="pagination"><span>{data?.totalElements ? `${(page - 1) * size + 1}–${Math.min(page * size, data.totalElements)} из ${data.totalElements}` : '0 записей'}</span><div><label htmlFor="page-size">На странице</label><select aria-label="Размер страницы" id="page-size" value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>{[1, 5, 10, 20, 50, 100].map(value => <option key={value}>{value}</option>)}</select><button className="icon-button" aria-label="Предыдущая страница" disabled={busy || page <= 1} onClick={() => setPage(value => value - 1)}><ArrowLeft size={16} /></button><span className="current-page">{page}</span><span className="muted">/ {Math.max(1, data?.totalPages ?? 0)}</span><button className="icon-button" aria-label="Следующая страница" disabled={busy || page >= (data?.totalPages ?? 0)} onClick={() => setPage(value => value + 1)}><ArrowRight size={16} /></button></div></div>
    </section>
    {editor && <EntityForm resource={resource} entity={editor.entity} close={() => setEditor(null)} saved={() => { setEditor(null); setSuccess(editor.entity ? 'Изменения сохранены.' : 'Запись добавлена.'); setPage(1); setReload(value => value + 1); }} />}
    {deleting && <DeleteDialog resource={resource} entity={deleting} close={() => setDeleting(null)} deleted={() => { setDeleting(null); setSuccess('Запись удалена.'); setReload(value => value + 1); }} />}
    {detail && <Modal title={isLab(detail) ? 'Лабораторная работа' : 'Дисциплина'} close={() => setDetail(null)}><span className="section-eyebrow">ID {detail.id}</span><h3 className="detail-title">{detail.name}</h3><dl className="details">{isLab(detail) ? <><dt>Координаты</dt><dd>{detail.coordinates.x}; {detail.coordinates.y}</dd><dt>Минимальный балл</dt><dd>{detail.minimalPoint}</dd><dt>Сложность</dt><dd>{detail.difficulty ? difficultyLabels[detail.difficulty] : 'Не задана'}</dd><dt>Дисциплина</dt><dd>{detail.discipline ? `${detail.discipline.name} · ID ${detail.discipline.id}` : 'Не привязана'}</dd><dt>Дата создания · UTC</dt><dd>{new Date(detail.creationDate).toLocaleString('ru-RU', { timeZone: 'UTC' })}</dd></> : <><dt>Часы практики</dt><dd>{detail.practiceHours}</dd><dt>Лабораторных</dt><dd>{detail.labsCount}</dd></>}</dl><div className="modal-actions"><button className="button secondary" onClick={() => setDetail(null)}>Закрыть</button><button className="button primary" onClick={() => { setEditor({ entity: detail }); setDetail(null); }}><Pencil size={16} />Редактировать</button></div></Modal>}
  </>;
}
