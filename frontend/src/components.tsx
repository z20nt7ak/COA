import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Link2, RefreshCw, Unlink, X } from 'lucide-react';
import { api } from './api';
import { positiveId } from './search';
import { difficulties, difficultyLabels, isLab, type Entity, type LabInput, type DisciplineInput, type Resource, type Discipline, type LabWork } from './types';

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
  const cannotSave = busy || (lab && (loadingDisciplines || !!disciplineError || unavailableDiscipline));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (cannotSave) return;
    const data = new FormData(event.currentTarget);
    const number = (key: string) => Number(data.get(key));
    const name = String(data.get('name')).trim();
    if (!name) { setError('Введите название: строка не может состоять только из пробелов.'); return; }
    let body: LabInput | DisciplineInput;
    try {
      if (lab) {
        const x = number('x'), y = number('y'), minimalPoint = number('minimalPoint');
        if (!Number.isInteger(x) || x < -2147483648 || x > 2147483647) throw new Error('X должен быть целым числом в диапазоне int32.');
        if (!Number.isFinite(y)) throw new Error('Введите конечное значение Y.');
        if (!Number.isInteger(minimalPoint) || minimalPoint < 1 || minimalPoint > 2147483647) throw new Error('Минимальный балл: целое число от 1 до 2147483647.');
        const discipline = String(data.get('discipline')).trim();
        body = { name, coordinates: { x, y }, minimalPoint, difficulty: (String(data.get('difficulty')) || null) as LabInput['difficulty'], discipline: discipline ? { id: positiveId(discipline) } : null };
      } else {
        const practiceHours = number('practiceHours');
        if (!Number.isSafeInteger(practiceHours) || practiceHours < 0) throw new Error('Часы практики должны быть неотрицательным целым числом.');
        body = { name, practiceHours };
      }
      setBusy(true);
      saved(await api.save(resource, body, entity?.id));
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <Modal title={`${entity ? 'Редактировать' : 'Добавить'} ${lab ? 'лабораторную' : 'дисциплину'}`} close={close} busy={busy}>
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="form-fields">
        <label>Название<input name="name" defaultValue={entity?.name} required placeholder={lab ? 'Например, Исследование колебаний' : 'Например, Общая физика'} autoFocus /></label>
        {lab ? <>
          <div className="form-grid"><label>Координата X<input name="x" type="number" required step="1" min="-2147483648" max="2147483647" defaultValue={existingLab?.coordinates.x ?? 0} /></label><label>Координата Y<input name="y" type="number" required step="any" defaultValue={existingLab?.coordinates.y ?? 0} /></label></div>
          <div className="form-grid"><label>Минимальный балл<input name="minimalPoint" type="number" required min="1" max="2147483647" step="1" defaultValue={existingLab?.minimalPoint ?? 1} /></label><label>Сложность<select name="difficulty" defaultValue={existingLab?.difficulty ?? ''}><option value="">Не задана</option>{difficulties.map(value => <option key={value} value={value}>{difficultyLabels[value]}</option>)}</select></label></div>
          <label>Дисциплина <span className="optional">необязательно</span><select aria-label="Дисциплина" name="discipline" value={disciplineId} disabled={loadingDisciplines || !!disciplineError} onChange={event => setDisciplineId(event.target.value)}>
            <option value="">{loadingDisciplines ? 'Загрузка дисциплин…' : 'Без дисциплины'}</option>
            {unavailableDiscipline && <option value={disciplineId} disabled>{existingLab?.discipline?.name ?? 'Текущая дисциплина'} — недоступна</option>}
            {disciplines.map(item => <option key={item.id} value={item.id}>{item.name} · №{item.id}</option>)}
          </select></label>
          {!loadingDisciplines && !disciplineError && disciplines.length === 0 && <p className="field-hint">Дисциплин пока нет. Создайте их в разделе «Дисциплины» или сохраните работу без привязки.</p>}
          {!loadingDisciplines && !disciplineError && unavailableDiscipline && <p className="field-hint">Текущей дисциплины больше нет в списке. Выберите другую или «Без дисциплины».</p>}

        </> : <><label>Часы практики<input name="practiceHours" type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" required defaultValue={existingDiscipline?.practiceHours ?? 0} /></label></>}
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

export function LinkPanel({ changed }: { changed: (labId: number, disciplineId: number) => Promise<void> }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [labs, setLabs] = useState<LabWork[]>([]), [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [labId, setLabId] = useState(''), [disciplineId, setDisciplineId] = useState('');
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState('');
  const controller = useRef<AbortController | null>(null);
  async function load() {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setLoadError('');
    try {
      const [labs, disciplines] = await Promise.all([api.labWorks(request.signal), api.disciplines(request.signal)]);
      if (request.signal.aborted) return;
      if (!Array.isArray(labs) || !Array.isArray(disciplines)) throw new Error('Неверный формат списков от сервера.');
      setLabs(labs); setDisciplines(disciplines);
      setLabId(''); setDisciplineId('');
    } catch (error) { if (!request.signal.aborted) setLoadError(messageOf(error)); }
    finally { if (!request.signal.aborted) setLoading(false); }
  }
  useEffect(() => { void load(); return () => controller.current?.abort(); }, []);
  const eligibleLabs = labs.filter(lab => action === 'add' ? !lab.discipline : !!lab.discipline);
  const selectedLab = eligibleLabs.find(lab => String(lab.id) === labId);
  const selectableDisciplines = action === 'remove'
    ? disciplines.filter(discipline => discipline.id === selectedLab?.discipline?.id) : disciplines;
  const selectedDiscipline = selectableDisciplines.find(discipline => String(discipline.id) === disciplineId);
  const cannotSubmit = busy || loading || !!loadError || !selectedLab || !selectedDiscipline;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (cannotSubmit) return;
    const lab = selectedLab.id, discipline = selectedDiscipline.id;
    try {
      setBusy(true); await api.link(discipline, lab, action);
      setSuccess(action === 'add' ? `«${selectedLab.name}» добавлена в дисциплину «${selectedDiscipline.name}».` : `«${selectedLab.name}» отвязана от дисциплины «${selectedDiscipline.name}».`);
      await load();
      try { await changed(lab, discipline); }
      catch { setError('Связь изменена, но данные каталога не удалось обновить.'); }
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <div className="link-layout"><section className="card link-card">
    <div className="link-heading"><h2>Связи</h2><button type="button" className="button secondary" disabled={busy || loading} onClick={() => void load()}><RefreshCw size={16} className={loading ? 'spin' : ''} />{loadError ? 'Повторить загрузку списков' : 'Обновить списки'}</button></div>
    <form onSubmit={submit}><fieldset disabled={busy || loading} className="form-fields">
      <div className="segmented" aria-label="Операция со связью">{(['add', 'remove'] as const).map(value => <button key={value} type="button" aria-pressed={action === value} className={action === value ? 'selected' : ''} onClick={() => { setAction(value); setLabId(''); setDisciplineId(''); setSuccess(''); setError(''); }}>{value === 'add' ? <Link2 size={17} /> : <Unlink size={17} />}{value === 'add' ? 'Привязать работу' : 'Отвязать работу'}</button>)}</div>
      <div className="link-fields"><div className="link-field"><label><span className="link-field-label"><span className="step-number" aria-hidden="true">1</span>Лабораторная работа</span><select aria-label="Лабораторная работа" required value={labId} disabled={!!loadError} onChange={event => {
        setLabId(event.target.value);
        if (action === 'remove') setDisciplineId(String(eligibleLabs.find(lab => String(lab.id) === event.target.value)?.discipline?.id ?? ''));
      }}><option value="">{loading ? 'Загрузка работ…' : 'Выберите лабораторную'}</option>{eligibleLabs.map(lab => <option key={lab.id} value={lab.id}>{lab.name} · №{lab.id}{lab.discipline ? ` · ${lab.discipline.name}` : ''}</option>)}</select></label>
      {!loading && !loadError && eligibleLabs.length === 0 && <p className="field-hint">{action === 'add' ? 'Нет свободных лабораторных работ. Создайте работу без дисциплины или сначала отвяжите существующую.' : 'Нет лабораторных работ, привязанных к дисциплинам.'}</p>}
      </div><div className="link-field"><label><span className="link-field-label"><span className="step-number" aria-hidden="true">2</span>Дисциплина</span><select aria-label="Дисциплина" required value={disciplineId} disabled={!!loadError || (action === 'remove' && !selectedLab)} onChange={event => setDisciplineId(event.target.value)}><option value="">{loading ? 'Загрузка дисциплин…' : 'Выберите дисциплину'}</option>{selectableDisciplines.map(discipline => <option key={discipline.id} value={discipline.id}>{discipline.name} · №{discipline.id}</option>)}</select></label>
      {action === 'remove' && selectedLab && <p className="field-hint">Выбрана текущая дисциплина работы. Отвязать работу можно только от неё.</p>}
      {!loading && !loadError && disciplines.length === 0 && <p className="field-hint">Дисциплин пока нет. Создайте их в разделе «Дисциплины».</p>}
      </div></div>
      {selectedLab && selectedDiscipline && <div className="link-summary"><span>{action === 'add' ? 'Привязать' : 'Отвязать'}</span><strong>{selectedLab.name} <small>№{selectedLab.id}</small></strong><ArrowRight size={17} /><strong>{selectedDiscipline.name} <small>№{selectedDiscipline.id}</small></strong></div>}
      <div className="link-submit"><button className="button primary" disabled={cannotSubmit}>{busy ? <RefreshCw size={17} className="spin" /> : action === 'add' ? <Link2 size={17} /> : <Unlink size={17} />}{busy ? 'Выполнение…' : action === 'add' ? 'Добавить в программу' : 'Удалить из программы'}</button></div>
    </fieldset></form>
    {loadError && <div className="alert error" role="alert">Не удалось загрузить списки: {loadError}</div>}
    {error && <div className="alert error" role="alert">{error}</div>}{success && <div className="alert success" role="status">{success}</div>}
  </section></div>;
}
