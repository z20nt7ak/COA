import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LabOperations from './LabOperations';

const pageOf = <T,>(content: T[], totalElements = content.length, page = 1) => ({ content, page, size: 5, totalElements, totalPages: Math.ceil(totalElements / 5) });
const lab = { id: 7, name: 'Mechanics', coordinates: { x: 1, y: 2 }, minimalPoint: 1, creationDate: '2026-10-21T00:00:00Z', difficulty: 'TERRIBLE', discipline: null };
describe('collection operations', () => {
  it('opens the server result for Минимальный ID', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(lab)));
    vi.stubGlobal('fetch', fetch); const onLab = vi.fn();
    render(<LabOperations onLab={onLab} />);
    await userEvent.click(screen.getByRole('button', { name: 'Минимальный ID' }));
    expect(fetch.mock.calls[0][0]).toBe('/api/labs/lab-works/by-min-id');
    expect(fetch.mock.calls[0][1].method).toBe('GET');
    expect(onLab).toHaveBeenCalledWith(lab);
  });
  it('lists every lab with the maximum difficulty and opens the chosen one', async () => {
    const second = { ...lab, id: 9, name: 'Optics' };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(pageOf([lab, second]))));
    vi.stubGlobal('fetch', fetch); const onLab = vi.fn(); const user = userEvent.setup();
    render(<LabOperations onLab={onLab} />);
    await user.click(screen.getByRole('button', { name: 'Максимальная сложность' }));
    expect(fetch.mock.calls[0][0]).toBe('/api/labs/lab-works/by-max-difficulty?page=1&size=5');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Сложность: Экстремально · Работ: 2')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Optics' }));
    expect(onLab).toHaveBeenCalledWith(second);
  });
  it('displays counts returned by the grouping endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(pageOf([{ name: 'Physics', count: 3 }, { name: 'Math', count: 2 }]))));
    vi.stubGlobal('fetch', fetch); render(<LabOperations onLab={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Группировка по названию' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Групп: 2')).toBeTruthy();
    expect(within(dialog).getByRole('cell', { name: 'Physics' })).toBeTruthy();
    expect(within(dialog).getByRole('cell', { name: '3' })).toBeTruthy();
    expect(fetch.mock.calls[0][0]).toBe('/api/labs/lab-works/group-by-name?page=1&size=5');
  });
  it.each([
    ['Максимальная сложность', 'by-max-difficulty', 'работ', (n: number) => ({ ...lab, id: n, name: `Работа ${n}` })],
    ['Группировка по названию', 'group-by-name', 'групп', (n: number) => ({ name: `Группа ${n}`, count: 1 })],
  ] as const)('pages through %s five items at a time', async (button, path, label, item) => {
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      const page = Number(new URL(url, 'http://x').searchParams.get('page'));
      return new Response(JSON.stringify(pageOf([item(page * 10)], 12, page)));
    });
    vi.stubGlobal('fetch', fetch); const user = userEvent.setup();
    render(<LabOperations onLab={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: button }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('1 / 3')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: `Следующая страница ${label}` }));
    expect(await within(dialog).findByText(path === 'group-by-name' ? 'Группа 20' : 'Работа 20')).toBeTruthy();
    expect(fetch.mock.calls[1][0]).toBe(`/api/labs/lab-works/${path}?page=2&size=5`);
    expect(within(dialog).getByText('2 / 3')).toBeTruthy();
  });
  it('reports an empty result when no lab has a difficulty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(pageOf([])))));
    const onLab = vi.fn(); render(<LabOperations onLab={onLab} />);
    await userEvent.click(screen.getByRole('button', { name: 'Максимальная сложность' }));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Нет лабораторных работ с заданной сложностью.');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onLab).not.toHaveBeenCalled();
  });
  it('shows an empty grouping instead of an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(pageOf([])))));
    render(<LabOperations onLab={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Группировка по названию' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Нет лабораторных работ.')).toBeTruthy();
  });
});
