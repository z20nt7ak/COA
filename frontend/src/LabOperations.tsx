import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ChartNoAxesColumnIncreasing, Layers3, RefreshCw } from 'lucide-react';
import { api } from './api';
import { Modal, messageOf } from './components';
import type { LabWork, NameGroup } from './types';

export default function LabOperations({ onLab }: { onLab: (lab: LabWork) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<NameGroup[] | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function run(action: 'min' | 'max' | 'groups') {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setBusy(action); setError('');
    try {
      if (action === 'groups') {
        const result = await api.groupByName(request.signal);
        if (!request.signal.aborted) setGroups(result);
      } else {
        const result = await (action === 'min' ? api.minId(request.signal) : api.maxDifficulty(request.signal));
        if (!request.signal.aborted) onLab(result);
      }
    } catch (error) { if (!request.signal.aborted) setError(messageOf(error)); }
    finally { if (!request.signal.aborted) setBusy(null); }
  }
  return <section className="card operations" aria-labelledby="operations-title">
    <div className="operations-heading"><h2 id="operations-title">Операции с коллекцией</h2></div>
    <div className="operations-actions">
      <button className="button secondary" disabled={busy !== null} onClick={() => run('min')}>{busy === 'min' ? <RefreshCw size={17} className="spin" /> : <ArrowDownToLine size={17} />}Минимальный ID</button>
      <button className="button secondary" disabled={busy !== null} onClick={() => run('max')}>{busy === 'max' ? <RefreshCw size={17} className="spin" /> : <ChartNoAxesColumnIncreasing size={17} />}Максимальная сложность</button>
      <button className="button secondary" disabled={busy !== null} onClick={() => run('groups')}>{busy === 'groups' ? <RefreshCw size={17} className="spin" /> : <Layers3 size={17} />}Группировка по названию</button>
    </div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {groups !== null && <Modal title="Группировка по названию" close={() => setGroups(null)}>
      
      <div className="group-summary">Групп: {groups.length} · Работ: {groups.reduce((sum, group) => sum + group.count, 0)}</div>
      <div className="table-scroll group-table"><table><thead><tr><th scope="col">Название</th><th scope="col">Количество</th></tr></thead><tbody>{groups.map(group => <tr key={group.name}><td>{group.name}</td><td>{group.count}</td></tr>)}</tbody></table></div>
      {groups.length === 0 && <p>Нет лабораторных работ.</p>}
      <div className="modal-actions"><button className="button primary" onClick={() => setGroups(null)}>Закрыть</button></div>
    </Modal>}
  </section>;
}
