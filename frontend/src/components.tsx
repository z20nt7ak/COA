import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { api } from './api';
import { positiveId } from './search';
import { difficulties, difficultyLabels, isLab, type Entity, type LabInput, type DisciplineInput, type Resource } from './types';

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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
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
          <label>ID дисциплины <span className="optional">необязательно</span><input name="discipline" inputMode="numeric" pattern="[0-9]+" defaultValue={existingLab?.discipline?.id ?? ''} placeholder="Оставьте пустым, чтобы не привязывать" /></label>
          <p className="field-hint">Дисциплина должна существовать. ID и дата создания назначаются автоматически.</p>
        </> : <><label>Часы практики<input name="practiceHours" type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" required defaultValue={existingDiscipline?.practiceHours ?? 0} /></label><p className="field-hint">Количество лабораторных рассчитывается бэкендом при привязке работ.</p></>}
      </fieldset>
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={close}>Отмена</button><button className="button primary" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</button></div>
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    const data = new FormData(event.currentTarget);
    try {
      const labId = positiveId(String(data.get('labId'))), disciplineId = positiveId(String(data.get('disciplineId')));
      setBusy(true); await api.link(disciplineId, labId, action);
      setSuccess(action === 'add' ? `Работа №${labId} добавлена в дисциплину №${disciplineId}.` : `Работа №${labId} отвязана от дисциплины №${disciplineId}.`);
      await changed(labId, disciplineId);
    } catch (error) { setError(messageOf(error)); } finally { setBusy(false); }
  }
  return <div className="link-layout"><section className="card link-card"><div className="section-eyebrow">СВЯЗИ МЕЖДУ ОБЪЕКТАМИ</div><h2>Соберите программу дисциплины</h2><p className="muted">Добавляйте лабораторные работы в учебную программу или освобождайте их для другой дисциплины.</p>
    <form onSubmit={submit}><fieldset disabled={busy} className="form-fields">
      <div className="segmented"><button type="button" className={action === 'add' ? 'selected' : ''} onClick={() => { setAction('add'); setSuccess(''); setError(''); }}>Привязать работу</button><button type="button" className={action === 'remove' ? 'selected' : ''} onClick={() => { setAction('remove'); setSuccess(''); setError(''); }}>Отвязать работу</button></div>
      <label>ID лабораторной<input name="labId" inputMode="numeric" pattern="[0-9]+" required placeholder="Например, 12" /></label>
      <label>ID дисциплины<input name="disciplineId" inputMode="numeric" pattern="[0-9]+" required placeholder="Например, 3" /></label>
      <button className="button primary" disabled={busy}>{busy ? 'Выполнение…' : action === 'add' ? 'Добавить в программу' : 'Удалить из программы'}</button>
    </fieldset></form>
    {error && <div className="alert error" role="alert">{error}</div>}{success && <div className="alert success" role="status">{success}</div>}
  </section><aside className="card note-card"><span className="note-icon">↗</span><h3>Одна работа — одна дисциплина</h3><p>Перед новой привязкой освободите лабораторную от предыдущей дисциплины.</p><hr /><h3>Счётчик обновляется автоматически</h3><p>После операции обновляются данные лабораторной и количество работ у дисциплины.</p><p className="field-hint">BARS проверяет связь и передаёт изменение сервису LABS.</p></aside></div>;
}
