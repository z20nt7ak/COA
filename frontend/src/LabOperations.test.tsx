import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LabOperations from './LabOperations';

const lab = { id: 7, name: 'Mechanics', coordinates: { x: 1, y: 2 }, minimalPoint: 1, creationDate: '2026-10-21T00:00:00Z', difficulty: 'TERRIBLE', discipline: null };
describe('collection operations', () => {
  it.each([
    ['Минимальный ID', '/api/labs/lab-works/by-min-id'],
    ['Максимальная сложность', '/api/labs/lab-works/by-max-difficulty'],
  ])('opens the server result for %s', async (label, path) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(lab)));
    vi.stubGlobal('fetch', fetch); const onLab = vi.fn();
    render(<LabOperations onLab={onLab} />);
    await userEvent.click(screen.getByRole('button', { name: label }));
    expect(fetch.mock.calls[0][0]).toBe(path);
    expect(fetch.mock.calls[0][1].method).toBe('GET');
    expect(onLab).toHaveBeenCalledWith(lab);
  });
  it('displays counts returned by the grouping endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ name: 'Physics', count: 3 }, { name: 'Math', count: 2 }])));
    vi.stubGlobal('fetch', fetch); render(<LabOperations onLab={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Группировка по названию' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Групп: 2 · Работ: 5')).toBeTruthy();
    expect(within(dialog).getByRole('cell', { name: 'Physics' })).toBeTruthy();
    expect(within(dialog).getByRole('cell', { name: '3' })).toBeTruthy();
    expect(fetch.mock.calls[0][0]).toBe('/api/labs/lab-works/group-by-name');
  });
  it('shows the server not-found message without inventing a result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Нет лабораторных работ с заданной сложностью' }), { status: 404 })));
    const onLab = vi.fn(); render(<LabOperations onLab={onLab} />);
    await userEvent.click(screen.getByRole('button', { name: 'Максимальная сложность' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Нет лабораторных работ с заданной сложностью');
    expect(onLab).not.toHaveBeenCalled();
  });
});
