import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ChartNoAxesColumnIncreasing, Layers3, RefreshCw } from 'lucide-react';
import { api, ApiError } from './api';
import { ExpandableText, LinkPager, Modal, messageOf } from './components';
import { difficultyLabels, type LabWork, type NameGroup, type Page } from './types';

const PAGE_SIZE = 5;

export default function LabOperations({ onLab }: { onLab: (lab: LabWork) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'empty' | 'error'; message: string } | null>(null);
  const [groups, setGroups] = useState<Page<NameGroup> | null>(null);
  const [hardest, setHardest] = useState<Page<LabWork> | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function run(action: 'min' | 'max' | 'groups', page = 1) {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setBusy(action); setFeedback(null);
    try {
      if (action === 'groups') {
        const result = await api.groupByName(page, PAGE_SIZE, request.signal);
        if (!request.signal.aborted) setGroups(result);
      } else if (action === 'max') {
        const result = await api.maxDifficulty(page, PAGE_SIZE, request.signal);
        if (request.signal.aborted) return;
        if (result.totalElements === 0) { setHardest(null); setFeedback({ kind: 'empty', message: 'Нет лабораторных работ с заданной сложностью.' }); }
        else setHardest(result);
      } else {
        const result = await api.minId(request.signal);
        if (!request.signal.aborted) onLab(result);
      }
    } catch (error) {
      if (!request.signal.aborted) setFeedback({
        kind: error instanceof ApiError && error.status === 404 ? 'empty' : 'error',
        message: messageOf(error),
      });
    }
    finally { if (!request.signal.aborted) setBusy(null); }
  }
  const modalOpen = hardest !== null || groups !== null;
  const feedbackView = feedback && <p className={`operation-feedback ${feedback.kind}`} role={feedback.kind === 'empty' ? 'status' : 'alert'}>{feedback.message}</p>;
  const difficulty = hardest?.content[0]?.difficulty;
  return <section className="card operations" aria-labelledby="operations-title">
    <div className="operations-heading"><h2 id="operations-title">Операции с коллекцией</h2></div>
    <div className="operations-actions">
      <button className="button secondary" disabled={busy !== null} onClick={() => run('min')}>{busy === 'min' ? <RefreshCw size={17} className="spin" /> : <ArrowDownToLine size={17} />}Минимальный ID</button>
      <button className="button secondary" disabled={busy !== null} onClick={() => run('max')}>{busy === 'max' ? <RefreshCw size={17} className="spin" /> : <ChartNoAxesColumnIncreasing size={17} />}Максимальная сложность</button>
      <button className="button secondary" disabled={busy !== null} onClick={() => run('groups')}>{busy === 'groups' ? <RefreshCw size={17} className="spin" /> : <Layers3 size={17} />}Группировка по названию</button>
    </div>
    {!modalOpen && feedbackView}
    {hardest !== null && <Modal title="Максимальная сложность" close={() => { setHardest(null); setFeedback(null); }}>
      <div className="group-summary">Сложность: {difficulty ? difficultyLabels[difficulty] : '—'} · Работ: {hardest.totalElements}</div>
      <div className="table-scroll group-table"><table><thead><tr><th scope="col">ID</th><th scope="col">Название</th><th scope="col">Мин. балл</th><th scope="col">Дисциплина</th></tr></thead><tbody>{hardest.content.map(lab => <tr key={lab.id}><td>{lab.id}</td><td><ExpandableText text={lab.name} render={shown => <button className="entity-title" onClick={() => { setHardest(null); onLab(lab); }}>{shown}</button>} /></td><td>{lab.minimalPoint}</td><td>{lab.discipline ? <ExpandableText text={lab.discipline.name} /> : <span className="muted">Без дисциплины</span>}</td></tr>)}</tbody></table></div>
      <LinkPager label="работ" page={hardest.page} totalPages={hardest.totalPages} disabled={busy !== null} go={page => run('max', page)} />
      {feedbackView}
      <div className="modal-actions"><button className="button primary" onClick={() => { setHardest(null); setFeedback(null); }}>Закрыть</button></div>
    </Modal>}
    {groups !== null && <Modal title="Группировка по названию" close={() => { setGroups(null); setFeedback(null); }}>
      <div className="group-summary">Групп: {groups.totalElements}</div>
      {groups.totalElements > 0 ? <div className="table-scroll group-table"><table><thead><tr><th scope="col">Название</th><th scope="col">Количество</th></tr></thead><tbody>{groups.content.map(group => <tr key={group.name}><td><ExpandableText text={group.name} /></td><td>{group.count}</td></tr>)}</tbody></table></div>
        : <p>Нет лабораторных работ.</p>}
      <LinkPager label="групп" page={groups.page} totalPages={groups.totalPages} disabled={busy !== null} go={page => run('groups', page)} />
      {feedbackView}
      <div className="modal-actions"><button className="button primary" onClick={() => { setGroups(null); setFeedback(null); }}>Закрыть</button></div>
    </Modal>}
  </section>;
}
