import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const entity = { id: 12, name: 'Исследование колебаний', coordinates: { x: -5, y: 2.5 }, minimalPoint: 10, difficulty: null, discipline: null, creationDate: '2026-10-20T12:00:00Z' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
describe('backend integration UI', () => {
  it('shows the session limitation and opens an existing record by ID', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => url.endsWith('/search') ? json({ message: 'Ресурс не найден' }, 404) : json(entity));
    vi.stubGlobal('fetch', fetch);
    render(<App />); const user = userEvent.setup();
    await screen.findByText('Показаны только записи этой сессии.');
    await user.type(screen.getByLabelText('ID записи'), '12');
    await user.click(screen.getByRole('button', { name: 'Открыть запись по ID' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Исследование колебаний')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Закрыть' }));
    expect(screen.getByRole('button', { name: entity.name })).toBeTruthy();
    expect(fetch.mock.calls.some(call => call[0] === '/api/labs/lab-works/12')).toBe(true);
  });
  it('creates a lab using the Java request DTO and handles DELETE 204', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/search')) return json({}, 405);
      if (init.method === 'DELETE') return new Response(null, { status: 204 });
      return json(entity, 201);
    });
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await screen.findByText('Показаны только записи этой сессии.');
    await user.click(screen.getByRole('button', { name: 'Добавить работу' }));
    const form = await screen.findByRole('dialog');
    await user.type(within(form).getByLabelText('Название'), entity.name);
    await user.click(within(form).getByRole('button', { name: 'Сохранить' }));
    await screen.findByText('Запись добавлена.');
    const save = fetch.mock.calls.find(call => call[0] === '/api/labs/lab-works' && call[1].method === 'POST');
    expect(JSON.parse(save![1].body)).toEqual({ name: entity.name, coordinates: { x: 0, y: 0 }, minimalPoint: 1, difficulty: null, discipline: null });
    await user.click(screen.getByRole('button', { name: `Удалить ${entity.name}` }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }));
    await screen.findByText('Запись удалена.');
    expect(screen.queryByRole('button', { name: entity.name })).toBeNull();
  });
  it('does not switch to session mode on 500 and allows retry', async () => {
    const fetch = vi.fn().mockResolvedValue(json({ message: 'Ошибка базы данных' }, 500));
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await screen.findByText('Ошибка базы данных');
    expect(screen.queryByText('Показаны только записи этой сессии.')).toBeNull();
    fetch.mockImplementation(async () => json({ content: [entity], page: 1, size: 10, totalElements: 1, totalPages: 1 }));
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await screen.findByRole('button', { name: entity.name });
  });
  it('calls the real BARS path and displays a conflict', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => url.includes('/api/bars/') ? json({ message: 'Работа уже привязана' }, 409) : json({}, 404));
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Связи · BARS' }));
    await user.type(screen.getByLabelText('ID лабораторной'), '12');
    await user.type(screen.getByLabelText('ID дисциплины'), '3');
    await user.click(screen.getByRole('button', { name: 'Добавить в программу' }));
    await screen.findByText('Работа уже привязана');
    await waitFor(() => expect(fetch.mock.calls.some(call => call[0] === '/api/bars/discipline/3/labwork/12/add')).toBe(true));
  });
});
