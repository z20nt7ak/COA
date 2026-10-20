import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, FlaskConical, Layers3, Link2, Pencil, Plus, RefreshCw, Search, Settings2, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { api, ApiError, baseUrl } from './api';
import { DeleteDialog, EntityForm, LinkPanel, Modal, messageOf } from './components';
import { localPage, positiveId, searchBody } from './search';
import { difficulties, difficultyLabels, emptyFilters, isLab, type Entity, type Filters, type Page, type Resource } from './types';

type View = Resource | 'bars';
type Cache = Record<Resource, Entity[]>;
const titles: Record<View, string> = { 'lab-works': 'Лабораторные работы', disciplines: 'Дисциплины', bars: 'Программа дисциплин' };
const sortLabels: Record<string, string> = { id: 'ID', name: 'Название', creationDate: 'Дата создания', minimalPoint: 'Минимальный балл', difficulty: 'Сложность', practiceHours: 'Часы практики', labsCount: 'Количество работ' };
function upsert(items: Entity[], entity: Entity) { return [entity, ...items.filter(item => item.id !== entity.id)]; }

export default function App() {
  const [view, setView] = useState<View>('lab-works');
  const [cache, setCache] = useState<Cache>({ 'lab-works': [], disciplines: [] });
  const [settings, setSettings] = useState(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const merge = (resource: Resource, items: Entity[]) => setCache(previous => ({
    ...previous, [resource]: items.reduce(upsert, previous[resource]),
    ...(resource === 'disciplines' ? { 'lab-works': previous['lab-works'].map(lab => {
      if (!isLab(lab) || !lab.discipline) return lab;
      const updated = items.find(item => !isLab(item) && item.id === lab.discipline?.id);
      return updated && !isLab(updated) ? { ...lab, discipline: updated } : lab;
    }) } : {}),
  }));
  async function refreshLinks(labId: number, disciplineId: number) {
    // BARS changes both resources; also refresh a previously known discipline if present.
    const oldLab = cache['lab-works'].find(item => item.id === labId);
    const oldDisciplineId = oldLab && isLab(oldLab) ? oldLab.discipline?.id : undefined;
    const targets: [Resource, number][] = [['lab-works', labId], ...[...new Set([disciplineId, oldDisciplineId].filter((id): id is number => id !== undefined))].map(id => ['disciplines', id] as [Resource, number])];
    const results = await Promise.allSettled(targets.map(async ([resource, id]) => { const entity = await api.get(resource, id); merge(resource, [entity]); }));
    setRevision(value => value + 1);
    if (results.some(result => result.status === 'rejected')) setNotice('Связь изменена, но часть данных не удалось обновить. Откройте записи повторно по ID.');
  }
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#" onClick={event => { event.preventDefault(); setView('lab-works'); }}><span className="brand-mark"><FlaskConical size={24} /></span><span>практикум<span className="brand-sub">УЧЕБНОЕ ПРОСТРАНСТВО</span></span></a>
      <div className="workspace"><span className="workspace-avatar">У</span><div><strong>Учебный каталог</strong><small>Лабораторные и дисциплины</small></div><ChevronDown size={15} /></div>
      <div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav aria-label="Основная навигация">{([['lab-works', FlaskConical], ['disciplines', BookOpen], ['bars', Link2]] as const).map(([key, Icon]) => <button key={key} aria-label={key === 'bars' ? 'Связи · BARS' : titles[key]} className={`nav-item ${view === key ? 'active' : ''}`} onClick={() => { setView(key); setNotice(''); }}><Icon size={19} /><span>{key === 'bars' ? 'Связи · BARS' : titles[key]}</span>{view === key && <span className="active-dot" />}</button>)}</nav>
      <div className="sidebar-note"><div className="orbit"><Layers3 size={24} /></div><strong>От идеи к практике</strong><p>Все лабораторные работы и учебные программы в одном месте.</p><span>LABS + BARS <ArrowUpRight size={14} /></span></div>
      <button className="sidebar-bottom" onClick={() => setSettings(true)}><Settings2 size={18} /> Подключение к сервисам</button>
    </aside>
    <main className="main"><header className="topbar"><div>Рабочее пространство <span>/</span> <strong>{view === 'bars' ? 'Связи' : titles[view]}</strong></div><button className="user-avatar" aria-label="Подключение к сервисам" title="Подключение к сервисам" onClick={() => setSettings(true)}>УП</button></header>
      <div className="page-content"><div className="page-heading"><div><div className="section-eyebrow">КАТАЛОГ / {view === 'bars' ? 'ПРОГРАММА' : view === 'lab-works' ? 'ЛАБОРАТОРНЫЕ' : 'ДИСЦИПЛИНЫ'}</div><h1>{titles[view]}<span className="heading-dot">.</span></h1><p className="subtitle">{view === 'bars' ? 'Связывайте лабораторные работы с учебными дисциплинами.' : view === 'lab-works' ? 'Организуйте практические задания и управляйте учебным процессом.' : 'Управляйте дисциплинами, часами практики и составом программы.'}</p></div><span className="edition">УЧЕБНЫЙ КАТАЛОГ <span>01 / COA</span></span></div>
      {notice && <div className="alert warning" role="status">{notice}<button className="icon-button" aria-label="Скрыть уведомление" onClick={() => setNotice('')}><X size={16} /></button></div>}
      {view === 'bars' ? <LinkPanel changed={refreshLinks} /> : <Catalog key={view} resource={view} cached={cache[view]} revision={revision} merge={items => merge(view, items)} removeCached={id => setCache(previous => ({ ...previous, [view]: previous[view].filter(item => item.id !== id) }))} onMutated={() => {
        // A lab mutation can change counts on any discipline. Drop that snapshot instead of displaying stale counts.
        if (view === 'lab-works') setCache(previous => ({ ...previous, disciplines: [] }));
      }} />}
      <footer className="page-footer"><span><span className="footer-dot" /> Практикум · управление учебным каталогом</span><span>LABS / BARS</span></footer></div>
    </main>
    {settings && <Modal title="Подключение к сервисам" close={() => setSettings(false)}><p className="muted">Запросы идут через один адрес фронтенда. Vite перенаправляет их к Java-приложениям.</p><dl className="details"><dt>LABS</dt><dd><code>{baseUrl('labs')}</code></dd><dt>BARS</dt><dd><code>{baseUrl('bars')}</code></dd></dl><p>Адреса серверов задаются в <code>frontend/.env.local</code>: <code>LABS_TARGET</code> и <code>BARS_TARGET</code>. После изменения перезапустите фронтенд.</p><p className="field-hint">По умолчанию: http://localhost:8080/labs и http://localhost:8081/bars. Инструкция по запуску находится в frontend/README.md.</p><div className="modal-actions"><button className="button primary" onClick={() => setSettings(false)}>Понятно</button></div></Modal>}
  </div>;
}

function Catalog({ resource, cached, merge, removeCached, onMutated, revision }: { resource: Resource; cached: Entity[]; merge: (items: Entity[]) => void; removeCached: (id: number) => void; onMutated: () => void; revision: number }) {
  const lab = resource === 'lab-works';
  const [draft, setDraft] = useState<Filters>({ ...emptyFilters });
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const [expanded, setExpanded] = useState(false), [page, setPage] = useState(1), [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('id'), [direction, setDirection] = useState('asc');
  const [supported, setSupported] = useState<boolean | null>(null);
  const [result, setResult] = useState<Page<Entity> | null>(null);
  const [busy, setBusy] = useState(false), [lookupBusy, setLookupBusy] = useState(false), [refreshBusy, setRefreshBusy] = useState(false);
  const [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [lookup, setLookup] = useState('');
  const [editor, setEditor] = useState<{ entity?: Entity } | null>(null);
  const [deleting, setDeleting] = useState<Entity | null>(null), [detail, setDetail] = useState<Entity | null>(null);
  const [reload, setReload] = useState(0);
  const callbacks = useRef({ merge }); callbacks.current = { merge };
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    if (supported === false) return;
    const controller = new AbortController(); setBusy(true); setError(''); setResult(null);
    const body = searchBody(resource, filters, page, size, sortBy, direction);
    api.search(resource, body, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      if (!data || !Array.isArray(data.content) || !Number.isSafeInteger(data.totalElements) || !Number.isSafeInteger(data.totalPages)) throw new Error('Ответ поиска не соответствует контракту страницы.');
      setSupported(true); setResult(data); callbacks.current.merge(data.content);
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && [404, 405].includes(error.status)) { setSupported(false); setError(''); }
      else setError(messageOf(error));
    }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [resource, filters, page, size, sortBy, direction, reload, supported === false, revision]);

  const data = supported === false ? localPage(cached, filters, page, size, sortBy, direction) : result;
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
      merge([entity]); setDetail(entity); setPage(1);
    } catch (error) { if (alive.current) setError(messageOf(error)); } finally { if (alive.current) setLookupBusy(false); }
  }
  async function refresh() {
    if (supported !== false) { setReload(value => value + 1); return; }
    setRefreshBusy(true); setError('');
    const results = await Promise.allSettled(cached.map(async item => {
      try { const entity = await api.get(resource, item.id); if (alive.current) merge([entity]); }
      catch (error) { if (error instanceof ApiError && error.status === 404) { if (alive.current) removeCached(item.id); } else throw error; }
    }));
    if (!alive.current) return;
    if (results.some(result => result.status === 'rejected')) setError('Не все записи удалось обновить. Проверьте подключение и повторите.');
    else setSuccess('Загруженные записи обновлены.');
    setRefreshBusy(false);
  }
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const setField = (key: keyof Filters, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const ranges = lab ? [['x', 'Координата X'], ['y', 'Координата Y'], ['minimalPoint', 'Минимальный балл'], ['creationDate', 'Дата создания · UTC']] : [['practiceHours', 'Часы практики'], ['labsCount', 'Количество работ']];
  return <>
    <div className="overview"><div className="overview-icon">{lab ? <FlaskConical size={27} /> : <BookOpen size={27} />}</div><div><span className="overview-label">{supported ? 'НАЙДЕНО В КАТАЛОГЕ' : 'ЗАПИСЕЙ В ЭТОЙ СЕССИИ'}</span><strong>{supported ? result?.totalElements ?? '—' : cached.length}<span>{lab ? 'лабораторных работ' : 'учебных дисциплин'}</span></strong></div><div className="overview-divider" /><div className="overview-description"><strong>{lab ? 'Практика начинается здесь' : 'Основа учебной программы'}</strong><span>{lab ? 'Создавайте задания, задавайте сложность и связывайте с дисциплинами.' : 'Планируйте часы практики и объединяйте лабораторные работы.'}</span></div><span className="overview-graphic" aria-hidden="true">{lab ? '⌬' : '▱'}</span></div>
    <section className="card catalog"><div className="catalog-heading"><div><h2>{lab ? 'Каталог работ' : 'Каталог дисциплин'} <span className="count-badge">{data?.totalElements ?? '—'}</span></h2><p>{supported ? 'Поиск и пагинация выполняются на сервере' : 'Создавайте записи или открывайте существующие по ID'}</p></div><button className="button primary" onClick={() => setEditor({})}><Plus size={17} />{lab ? 'Добавить работу' : 'Добавить дисциплину'}</button></div>
      <div className="toolbar"><form className="id-lookup" onSubmit={openById}><span className="input-prefix">ID</span><input aria-label="ID записи" inputMode="numeric" pattern="[0-9]+" required placeholder="Открыть по ID" value={lookup} onChange={event => setLookup(event.target.value)} /><button className="icon-button" aria-label="Открыть запись по ID" disabled={lookupBusy}>{lookupBusy ? <RefreshCw size={18} className="spin" /> : <ArrowRight size={18} />}</button></form><button className="button secondary compact" onClick={refresh} disabled={busy || refreshBusy}><RefreshCw size={16} className={busy || refreshBusy ? 'spin' : ''} />Обновить</button></div>
      <form onSubmit={apply} className="filter-form"><div className="filter-row"><div className="search-field"><Search size={18} /><input aria-label="Поиск по названию" placeholder="Найти по названию…" value={draft.name} onChange={event => setField('name', event.target.value)} /></div>{lab && <select aria-label="Фильтр по сложности" value={draft.difficulty} onChange={event => setField('difficulty', event.target.value)}><option value="">Любая сложность</option>{difficulties.map(value => <option key={value} value={value}>{difficultyLabels[value]}</option>)}</select>}<button type="button" className={`button secondary ${expanded ? 'filter-active' : ''}`} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><SlidersHorizontal size={16} />Фильтры{activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}</button><button className="button search-submit">Найти</button></div>
        {expanded && <div className="advanced-filters"><label>ID записей<input value={draft.ids} placeholder="1, 2, 3" onChange={event => setField('ids', event.target.value)} /></label>{lab && <label>ID дисциплин<input value={draft.disciplineIds} placeholder="1, 2, 3" onChange={event => setField('disciplineIds', event.target.value)} /></label>}{ranges.map(([field, label]) => <fieldset className="range" key={field}><legend>{label}</legend><div>{['From', 'To'].map((suffix, index) => <input key={suffix} aria-label={`${label} ${index === 0 ? 'от' : 'до'}`} type={field === 'creationDate' ? 'date' : 'number'} step={field === 'y' ? 'any' : '1'} placeholder={index === 0 ? 'От' : 'До'} value={draft[`${field}${suffix}` as keyof Filters]} onChange={event => setField(`${field}${suffix}` as keyof Filters, event.target.value)} />)}</div></fieldset>)}</div>}
        {activeFilters > 0 && <button type="button" className="text-button clear-filters" onClick={() => { setDraft({ ...emptyFilters }); setFilters({ ...emptyFilters }); setPage(1); setError(''); }}>Сбросить фильтры <X size={13} /></button>}
      </form>
      {supported === false && <div className="catalog-notice"><span className="info-mark">i</span><p><strong>Показаны только записи этой сессии.</strong> Серверный поиск пока недоступен. Откройте запись по ID или добавьте новую — она появится в таблице. Фильтры работают по загруженным записям.</p><button className="text-button" onClick={() => { setSupported(null); setReload(value => value + 1); }}>Проверить снова</button></div>}
      {error && <div className="alert error catalog-alert" role="alert">{error}<button type="button" className="text-button" onClick={() => { setError(''); setReload(value => value + 1); }}>Повторить</button></div>}{success && <div className="alert success catalog-alert" role="status"><Check size={16} />{success}<button className="icon-button" aria-label="Скрыть сообщение" onClick={() => setSuccess('')}><X size={15} /></button></div>}
      <div className="table-controls"><span>{supported ? 'Весь каталог' : 'Загруженные записи'}</span><div><label htmlFor="sort">Сортировка</label><select aria-label="Сортировка" id="sort" value={sortBy} onChange={event => { setSortBy(event.target.value); setPage(1); }}>{(lab ? ['id', 'name', 'creationDate', 'minimalPoint', 'difficulty'] : ['id', 'name', 'practiceHours', 'labsCount']).map(key => <option key={key} value={key}>{sortLabels[key]}</option>)}</select><button className="icon-button" aria-label={direction === 'asc' ? 'Сортировать по убыванию' : 'Сортировать по возрастанию'} onClick={() => { setDirection(value => value === 'asc' ? 'desc' : 'asc'); setPage(1); }}><ArrowDown size={15} style={{ transform: direction === 'desc' ? 'rotate(180deg)' : undefined }} /></button></div></div>
      <div className="table-scroll" aria-busy={busy}><table><thead><tr><th>ID</th><th>{lab ? 'Лабораторная работа' : 'Название дисциплины'}</th>{lab ? <><th>Сложность</th><th>Мин. балл</th><th>Дисциплина</th><th>Координаты</th></> : <><th>Часы практики</th><th>Лабораторных</th></>}<th><span className="sr-only">Действия</span></th></tr></thead><tbody>{!busy && data?.content.map(entity => <tr key={entity.id}><td className="id-cell">{String(entity.id).padStart(2, '0')}</td><td><button className="entity-title" onClick={() => setDetail(entity)}>{entity.name}</button>{isLab(entity) && <span className="date-cell">{new Date(entity.creationDate).toLocaleDateString('ru-RU', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })}</span>}</td>{isLab(entity) ? <><td><span className={`difficulty ${entity.difficulty?.toLowerCase() ?? 'unset'}`}><span />{entity.difficulty ? difficultyLabels[entity.difficulty] : 'Не задана'}</span></td><td className="number-cell">{entity.minimalPoint}</td><td>{entity.discipline ? <span className="discipline-tag">{entity.discipline.name}</span> : <span className="muted">Без дисциплины</span>}</td><td className="coordinates">{entity.coordinates.x}; {entity.coordinates.y}</td></> : <><td className="number-cell">{entity.practiceHours} <span className="muted">ч</span></td><td><span className="count-badge">{entity.labsCount}</span></td></>}<td><div className="row-actions"><button className="icon-button" aria-label={`Редактировать ${entity.name}`} onClick={() => setEditor({ entity })}><Pencil size={16} /></button><button className="icon-button delete-button" aria-label={`Удалить ${entity.name}`} onClick={() => setDeleting(entity)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>
      {busy ? <div className="empty-state"><RefreshCw className="spin" size={30} /><h3>Загружаем каталог</h3><p>Получаем данные от сервиса LABS…</p></div> : !data?.content.length && <div className="empty-state"><span className="empty-icon">{lab ? <FlaskConical size={30} /> : <BookOpen size={30} />}</span><h3>{activeFilters ? 'Совпадений не найдено' : error ? 'Не удалось загрузить каталог' : 'Здесь будут ваши записи'}</h3><p>{activeFilters ? 'Попробуйте изменить условия поиска.' : 'Откройте существующую запись по ID или создайте первую.'}</p><button className="text-button" onClick={() => setEditor({})}><Plus size={15} />{lab ? 'Добавить лабораторную' : 'Добавить дисциплину'}</button></div>}</div>
      <div className="pagination"><span>{data?.totalElements ? `${(page - 1) * size + 1}–${Math.min(page * size, data.totalElements)} из ${data.totalElements}` : '0 записей'}</span><div><label htmlFor="page-size">На странице</label><select aria-label="Размер страницы" id="page-size" value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>{[10, 20, 50, 100].map(value => <option key={value}>{value}</option>)}</select><button className="icon-button" aria-label="Предыдущая страница" disabled={busy || page <= 1} onClick={() => setPage(value => value - 1)}><ArrowLeft size={16} /></button><span className="current-page">{page}</span><span className="muted">/ {Math.max(1, data?.totalPages ?? 0)}</span><button className="icon-button" aria-label="Следующая страница" disabled={busy || page >= (data?.totalPages ?? 0)} onClick={() => setPage(value => value + 1)}><ArrowRight size={16} /></button></div></div>
    </section>
    <div className="catalog-footnote"><span><Check size={14} /> Изменения сохраняются в сервисе LABS</span><span>Даты отображаются в UTC</span></div>
    {editor && <EntityForm resource={resource} entity={editor.entity} close={() => setEditor(null)} saved={entity => { merge([entity]); onMutated(); setEditor(null); setSuccess(editor.entity ? 'Изменения сохранены.' : 'Запись добавлена.'); setPage(1); setReload(value => value + 1); }} />}
    {deleting && <DeleteDialog resource={resource} entity={deleting} close={() => setDeleting(null)} deleted={() => { removeCached(deleting.id); onMutated(); setDeleting(null); setSuccess('Запись удалена.'); setReload(value => value + 1); }} />}
    {detail && <Modal title={isLab(detail) ? 'Лабораторная работа' : 'Дисциплина'} close={() => setDetail(null)}><span className="section-eyebrow">ID {detail.id}</span><h3 className="detail-title">{detail.name}</h3><dl className="details">{isLab(detail) ? <><dt>Координаты</dt><dd>{detail.coordinates.x}; {detail.coordinates.y}</dd><dt>Минимальный балл</dt><dd>{detail.minimalPoint}</dd><dt>Сложность</dt><dd>{detail.difficulty ? difficultyLabels[detail.difficulty] : 'Не задана'}</dd><dt>Дисциплина</dt><dd>{detail.discipline ? `${detail.discipline.name} · ID ${detail.discipline.id}` : 'Не привязана'}</dd><dt>Дата создания · UTC</dt><dd>{new Date(detail.creationDate).toLocaleString('ru-RU', { timeZone: 'UTC' })}</dd></> : <><dt>Часы практики</dt><dd>{detail.practiceHours}</dd><dt>Лабораторных</dt><dd>{detail.labsCount}</dd></>}</dl><div className="modal-actions"><button className="button secondary" onClick={() => setDetail(null)}>Закрыть</button><button className="button primary" onClick={() => { setEditor({ entity: detail }); setDetail(null); }}><Pencil size={16} />Редактировать</button></div></Modal>}
  </>;
}
