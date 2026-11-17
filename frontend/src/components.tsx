import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Link2, RefreshCw, Unlink, X } from 'lucide-react';
import { api } from './api';
import { collect, LIMITS, parseDecimal, parseInteger, parseName, positiveId } from './validation';
import { difficulties, difficultyLabels, isLab, type Entity, type LabInput, type DisciplineInput, type Resource, type Discipline, type LabWork, type Page } from './types';

export const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Не удалось выполнить действие.';
export function Modal({ title, children, close, busy = false }: { title: string; children: ReactNode; close: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); ref.current?.querySelector<HTMLInputElement>('input, select')?.focus(); return () => ref.current?.close(); }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <div className="modal-heading"><h2 id="dialog-title">{title}</h2><button disabled={busy} className="icon-button" aria-label="Закрыть окно" onClick={close}><X size={20} /></button></div>
    {children}
  </dialog>;
}

export function EntityForm({ resource, entity, close, saved }: { resource: Resource; entity?: Entity; close: () => void; saved: (entity: Entity) => void }) {
  const lab = resource === 'lab-works';
  const existingLab = entity && isLab(entity) ? entity : undefined;
  const existingDiscipline = entity && !isLab(entity) ? entity : undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [disciplineId, setDisciplineId] = useState(String(existingLab?.discipline?.id ?? ''));
  const [loadingDisciplines, setLoadingDisciplines] = useState(lab);
  const [disciplineError, setDisciplineError] = useState('');
  const [retryDisciplines, setRetryDisciplines] = useState(0);
  useEffect(() => {
    if (!lab) return;
    const controller = new AbortController();
    setLoadingDisciplines(true); setDisciplineError('');
    api.disciplines(controller.signal).then(items => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(items)) throw new Error('Сервис вернул неверный формат списка дисциплин.');
      setDisciplines(items);
    }).catch(error => {
      if (!controller.signal.aborted) setDisciplineError(messageOf(error));
    }).finally(() => { if (!controller.signal.aborted) setLoadingDisciplines(false); });
    return () => controller.abort();
  }, [lab, retryDisciplines]);
  const unavailableDiscipline = !!disciplineId && !disciplines.some(item => String(item.id) === disciplineId);
  const currentDiscipline = existingLab?.discipline;
  const allowedDisciplines = currentDiscipline ? disciplines.filter(item => item.id === currentDiscipline.id) : disciplines;
  const cannotSave = busy || (lab && (loadingDisciplines || !!disciplineError || unavailableDiscipline));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clearFieldError = (key: string) => setFieldErrors(previous => {
    if (!previous[key]) return previous;
    const next = { ...previous }; delete next[key]; return next;
  });
  const fieldProps = (key: string) => ({
    name: key, 'aria-invalid': fieldErrors[key] ? true : undefined,
    'aria-describedby': fieldErrors[key] ? `${key}-error` : undefined,
    onChange: () => clearFieldError(key),
  });
  const fieldError = (key: string) => fieldErrors[key] && <span id={`${key}-error`} className="field-error">{fieldErrors[key]}</span>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (cannotSave) return;
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? '');
    const errors: Record<string, string> = {};
    const name = collect(errors, 'name', () => parseName(text('name')));
    let body: LabInput | DisciplineInput | undefined;
    if (lab) {
      const x = collect(errors, 'x', () => parseInteger(text('x'), 'Координата X', LIMITS.coordinate));
      const y = collect(errors, 'y', () => parseDecimal(text('y'), 'Координата Y', LIMITS.coordinate, LIMITS.coordinateYFractionDigits));
      const minimalPoint = collect(errors, 'minimalPoint', () => parseInteger(text('minimalPoint'), 'Минимальный балл', LIMITS.minimalPoint));
      const discipline = text('discipline').trim();
      const disciplineRef = discipline ? collect(errors, 'discipline', () => ({ id: positiveId(discipline, 'ID дисциплины') })) : null;
      if (!Object.keys(errors).length) body = { name: name!, coordinates: { x: x!, y: y! }, minimalPoint: minimalPoint!, difficulty: (text('difficulty') || null) as LabInput['difficulty'], discipline: disciplineRef ?? null };
    } else {
      const practiceHours = collect(errors, 'practiceHours', () => parseInteger(text('practiceHours'), 'Часы практики', LIMITS.practiceHours));
      if (!Object.keys(errors).length) body = { name: name!, practiceHours: practiceHours! };
    }
    setFieldErrors(errors);
    if (!body) {
      event.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    try {
      setBusy(true);
      saved(await api.save(resource, body, entity?.id));
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <Modal title={`${entity ? 'Редактировать' : 'Добавить'} ${lab ? 'лабораторную' : 'дисциплину'}`} close={close} busy={busy}>
    <form onSubmit={submit} noValidate>
      <fieldset disabled={busy} className="form-fields">
        <label>Название<input {...fieldProps('name')} maxLength={LIMITS.nameMaxLength} defaultValue={entity?.name} required placeholder={lab ? 'Например, Исследование колебаний' : 'Например, Общая физика'} autoFocus />{fieldError('name')}</label>
        {lab ? <>
          <div className="form-grid"><label>Координата X<input {...fieldProps('x')} inputMode="numeric" autoComplete="off" required placeholder="Целое, от −1000 до 1000" defaultValue={existingLab?.coordinates.x ?? 0} />{fieldError('x')}</label><label>Координата Y<input {...fieldProps('y')} inputMode="decimal" autoComplete="off" required placeholder="От −1000 до 1000, напр. 12,5" defaultValue={existingLab?.coordinates.y ?? 0} />{fieldError('y')}</label></div>
          <div className="form-grid"><label>Минимальный балл<input {...fieldProps('minimalPoint')} inputMode="numeric" autoComplete="off" required placeholder="Целое, от 1 до 100" defaultValue={existingLab?.minimalPoint ?? 1} />{fieldError('minimalPoint')}</label><label>Сложность<select name="difficulty" defaultValue={existingLab?.difficulty ?? ''}><option value="">Не задана</option>{difficulties.map(value => <option key={value} value={value}>{difficultyLabels[value]}</option>)}</select></label></div>
          <label>Дисциплина <span className="optional">необязательно</span><select aria-label="Дисциплина" name="discipline" value={disciplineId} disabled={loadingDisciplines || !!disciplineError} onChange={event => setDisciplineId(event.target.value)}>
            <option value="">{loadingDisciplines ? 'Загрузка дисциплин…' : 'Без дисциплины'}</option>
            {unavailableDiscipline && <option value={disciplineId} disabled>{existingLab?.discipline?.name ?? 'Текущая дисциплина'} — недоступна</option>}
            {allowedDisciplines.map(item => <option key={item.id} value={item.id}>{item.name} · №{item.id}</option>)}
          </select></label>
          {!loadingDisciplines && !disciplineError && disciplines.length === 0 && <p className="field-hint">Дисциплин пока нет. Создайте их в разделе «Дисциплины» или сохраните работу без привязки.</p>}
          {currentDiscipline && <p className="field-hint">Чтобы сменить дисциплину, выберите «Без дисциплины» и сохраните работу. Затем привяжите её к новой дисциплине.</p>}

          {fieldError('discipline')}
        </> : <><label>Часы практики<input {...fieldProps('practiceHours')} inputMode="numeric" autoComplete="off" required placeholder="Целое, от 0 до 500" defaultValue={existingDiscipline?.practiceHours ?? 0} />{fieldError('practiceHours')}</label></>}
      </fieldset>
      {lab && disciplineError && <div className="alert error" role="alert">Не удалось загрузить дисциплины: {disciplineError}<button type="button" className="text-button" disabled={busy} onClick={() => setRetryDisciplines(value => value + 1)}>Повторить загрузку</button></div>}
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={close}>Отмена</button><button className="button primary" disabled={cannotSave}>{busy ? 'Сохранение…' : 'Сохранить'}</button></div>
    </form>
  </Modal>;
}

export function DeleteDialog({ resource, entity, close, deleted }: { resource: Resource; entity: Entity; close: () => void; deleted: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function remove() {
    setBusy(true); setError('');
    try { await api.remove(resource, entity.id); deleted(); } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <Modal title="Удалить запись?" close={close} busy={busy}>
    <p>«{entity.name}» (ID {entity.id}) будет удалена. Это действие нельзя отменить.</p>
    {!isLab(entity) && entity.labsCount > 0 && <p className="alert warning">К дисциплине привязаны лабораторные. Сначала отвяжите их в разделе BARS.</p>}
    {error && <div className="alert error" role="alert">{error}</div>}
    <div className="modal-actions"><button className="button secondary" disabled={busy} onClick={close}>Отмена</button><button className="button danger" disabled={busy} onClick={remove}>{busy ? 'Удаление…' : 'Удалить'}</button></div>
  </Modal>;
}

export function LinkPager({ label, page, totalPages, disabled, go }: { label: string; page: number; totalPages: number; disabled: boolean; go: (page: number) => void }) {
  if (totalPages <= 1 && page === 1) return null;
  return <div className="link-pager" role="group" aria-label={`Страницы ${label}`}>
    <button type="button" className="button secondary" aria-label={`Предыдущая страница ${label}`} disabled={disabled || page <= 1} onClick={() => go(page - 1)}>Назад</button>
    <span>{page} / {totalPages || '—'}</span>
    <button type="button" className="button secondary" aria-label={`Следующая страница ${label}`} disabled={disabled || page >= totalPages} onClick={() => go(page + 1)}>Далее</button>
  </div>;
}

export function LinkPanel({ changed }: { changed: (labId: number, disciplineId: number) => Promise<void> }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [labs, setLabs] = useState<Page<LabWork>>();
  const [disciplines, setDisciplines] = useState<Page<Discipline>>();
  const [size, setSize] = useState(20);
  const [labPage, setLabPage] = useState(1), [disciplinePage, setDisciplinePage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  function resetLists() {
    setLabPage(1); setDisciplinePage(1);
    setLabId(''); setDisciplineId('');
    setRefresh(value => value + 1);
  }
  const [labId, setLabId] = useState(''), [disciplineId, setDisciplineId] = useState('');
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState('');
  useEffect(() => {
    const request = new AbortController();
    setLoading(true); setLoadError('');
    void Promise.all([
      api.search('lab-works', { page: labPage, size, sortBy: 'name', hasDiscipline: action === 'remove' }, request.signal),
      action === 'add' ? api.search('disciplines', { page: disciplinePage, size, sortBy: 'name' }, request.signal) : Promise.resolve(undefined),
    ]).then(([workPage, discPage]) => {
      if (request.signal.aborted) return;
      if (!Array.isArray(workPage?.content) || (discPage && !Array.isArray(discPage.content))) {
        throw new Error('Неверный формат страницы от сервера.');
      }
      setLabs(workPage as Page<LabWork>);
      setDisciplines(discPage as Page<Discipline> | undefined);
    }).catch(error => {
      if (!request.signal.aborted) setLoadError(messageOf(error));
    }).finally(() => {
      if (!request.signal.aborted) setLoading(false);
    });
    return () => request.abort();
  }, [action, labPage, disciplinePage, size, refresh]);
  const eligibleLabs = labs?.content ?? [];
  const selectedLab = eligibleLabs.find(lab => String(lab.id) === labId);
  const selectableDisciplines = action === 'remove'
    ? (selectedLab?.discipline ? [selectedLab.discipline] : []) : (disciplines?.content ?? []);
  const selectedDiscipline = selectableDisciplines.find(discipline => String(discipline.id) === disciplineId);
  const cannotSubmit = busy || loading || !!loadError || !selectedLab || !selectedDiscipline;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (cannotSubmit) return;
    const lab = selectedLab.id, discipline = selectedDiscipline.id;
    try {
      setBusy(true); await api.link(discipline, lab, action);
      setSuccess(action === 'add' ? `«${selectedLab.name}» добавлена в дисциплину «${selectedDiscipline.name}».` : `«${selectedLab.name}» отвязана от дисциплины «${selectedDiscipline.name}».`);
      resetLists();
      try { await changed(lab, discipline); }
      catch { setError('Связь изменена, но данные каталога не удалось обновить.'); }
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <div className="link-layout"><section className="card link-card">
    <div className="link-heading"><h2>Связи</h2><button type="button" className="button secondary" disabled={busy || loading} onClick={resetLists}><RefreshCw size={16} className={loading ? 'spin' : ''} />{loadError ? 'Повторить загрузку списков' : 'Обновить списки'}</button></div>
    <form onSubmit={submit}><fieldset disabled={busy || loading} className="form-fields">
      <div className="segmented" aria-label="Операция со связью">{(['add', 'remove'] as const).map(value => <button key={value} type="button" aria-pressed={action === value} className={action === value ? 'selected' : ''} onClick={() => { if (value !== action) { setAction(value); resetLists(); setSuccess(''); setError(''); } }}>{value === 'add' ? <Link2 size={17} /> : <Unlink size={17} />}{value === 'add' ? 'Привязать работу' : 'Отвязать работу'}</button>)}</div>
      <label className="link-page-size">Записей на странице<select value={size} onChange={event => { setSize(Number(event.target.value)); resetLists(); }}>{[5, 10, 20, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
      <div className="link-fields"><div className="link-field"><label><span className="link-field-label"><span className="step-number" aria-hidden="true">1</span>Лабораторная работа</span><select aria-label="Лабораторная работа" required value={labId} disabled={!!loadError} onChange={event => {
        setLabId(event.target.value);
        if (action === 'remove') setDisciplineId(String(eligibleLabs.find(lab => String(lab.id) === event.target.value)?.discipline?.id ?? ''));
      }}><option value="">{loading ? 'Загрузка работ…' : 'Выберите лабораторную'}</option>{eligibleLabs.map(lab => <option key={lab.id} value={lab.id}>{lab.name} · №{lab.id}{lab.discipline ? ` · ${lab.discipline.name}` : ''}</option>)}</select></label>
      <LinkPager label="лабораторных работ" page={labPage} totalPages={labs?.totalPages ?? 0} disabled={!!loadError} go={page => {
        setLabId(''); if (action === 'remove') setDisciplineId(''); setLabPage(page);
      }} />
      {!loading && !loadError && eligibleLabs.length === 0 && <p className="field-hint">{action === 'add' ? 'Нет свободных лабораторных работ. Создайте работу без дисциплины или сначала отвяжите существующую.' : 'Нет лабораторных работ, привязанных к дисциплинам.'}</p>}
      </div><div className="link-field"><label><span className="link-field-label"><span className="step-number" aria-hidden="true">2</span>Дисциплина</span><select aria-label="Дисциплина" required value={disciplineId} disabled={!!loadError || (action === 'remove' && !selectedLab)} onChange={event => setDisciplineId(event.target.value)}><option value="">{loading ? 'Загрузка дисциплин…' : 'Выберите дисциплину'}</option>{selectableDisciplines.map(discipline => <option key={discipline.id} value={discipline.id}>{discipline.name} · №{discipline.id}</option>)}</select></label>
      {action === 'remove' && selectedLab && <p className="field-hint">Выбрана текущая дисциплина работы. Отвязать работу можно только от неё.</p>}
      {action === 'add' && <LinkPager label="дисциплин" page={disciplinePage} totalPages={disciplines?.totalPages ?? 0} disabled={!!loadError} go={page => { setDisciplineId(''); setDisciplinePage(page); }} />}
      {action === 'add' && !loading && !loadError && disciplines?.totalElements === 0 && <p className="field-hint">Дисциплин пока нет. Создайте их в разделе «Дисциплины».</p>}
      </div></div>
      {selectedLab && selectedDiscipline && <div className="link-summary"><span>{action === 'add' ? 'Привязать' : 'Отвязать'}</span><strong>{selectedLab.name} <small>№{selectedLab.id}</small></strong><ArrowRight size={17} /><strong>{selectedDiscipline.name} <small>№{selectedDiscipline.id}</small></strong></div>}
      <div className="link-submit"><button className="button primary" disabled={cannotSubmit}>{busy ? <RefreshCw size={17} className="spin" /> : action === 'add' ? <Link2 size={17} /> : <Unlink size={17} />}{busy ? 'Выполнение…' : action === 'add' ? 'Добавить в программу' : 'Удалить из программы'}</button></div>
    </fieldset></form>
    {loadError && <div className="alert error" role="alert">Не удалось загрузить списки: {loadError}</div>}
    {error && <div className="alert error" role="alert">{error}</div>}{success && <div className="alert success" role="status">{success}</div>}
  </section></div>;
}
