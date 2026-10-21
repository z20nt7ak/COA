import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const entity = { id: 12, name: 'Исследование колебаний', coordinates: { x: -5, y: 2.5 }, minimalPoint: 10, difficulty: null, discipline: null, creationDate: '2026-10-20T12:00:00Z' };
const discipline = { id: 3, name: 'Физика', practiceHours: 10, labsCount: 0 };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const page = (content: unknown[], totalElements = content.length, page = 1, size = 10) => ({ content, totalElements, totalPages: Math.ceil(totalElements / size), page, size });

describe('server search and pagination', () => {
  it('posts search parameters and renders counts from the response rather than the content length', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => json(url.endsWith('/search') ? page([entity], 57) : entity));
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await screen.findByRole('button', { name: entity.name });
    expect(screen.getByText('1–10 из 57')).toBeTruthy();
    expect(fetch.mock.calls[0][0]).toBe('/api/labs/lab-works/search');
    expect(fetch.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ page: 1, size: 10, sortBy: 'id', sortType: 'asc' });
    await user.type(screen.getByLabelText('ID записи'), '12');
    await user.click(screen.getByRole('button', { name: 'Открыть запись по ID' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(entity.name)).toBeTruthy();
    expect(fetch.mock.calls.some(call => call[0] === '/api/labs/lab-works/12')).toBe(true);
    expect(fetch.mock.calls.some(call => call[0] === '/api/labs/lab-works')).toBe(false);
  });
  it('refetches the server page after creating and deleting a lab', async () => {
    let items: typeof entity[] = [];
    const fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/search')) return json(page(items));
      if (url === '/api/labs/disciplines') return json([]);
      if (init.method === 'DELETE') { items = []; return new Response(null, { status: 204 }); }
      items = [entity]; return json(entity, 201);
    });
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await screen.findByText('Нет записей');
    await user.click(screen.getByRole('button', { name: 'Добавить работу' }));
    const form = await screen.findByRole('dialog');
    await user.type(within(form).getByLabelText('Название'), entity.name);
    await user.click(within(form).getByRole('button', { name: 'Сохранить' }));
    await screen.findByRole('button', { name: entity.name });
    await user.click(screen.getByRole('button', { name: `Удалить ${entity.name}` }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }));
    await screen.findByText('Запись удалена.');
    await waitFor(() => expect(screen.queryByRole('button', { name: entity.name })).toBeNull());
    expect(fetch.mock.calls.filter(call => call[0] === '/api/labs/lab-works/search').length).toBe(3);
  });
  it('shows errors and retries POST without falling back to loading the whole collection', async () => {
    const fetch = vi.fn().mockImplementation(async () => json({ message: 'Ошибка базы данных' }, 500));
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await screen.findByText('Ошибка базы данных');
    fetch.mockImplementation(async () => json(page([entity])));
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await screen.findByRole('button', { name: entity.name });
    expect(fetch.mock.calls.every(call => call[0] === '/api/labs/lab-works/search')).toBe(true);
  });
  it('replaces the returned page when refreshing', async () => {
    let content = [entity];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => json(page(content))));
    render(<App />); const user = userEvent.setup();
    await screen.findByRole('button', { name: entity.name });
    content = [{ ...entity, id: 99, name: 'Обновлённая работа' }];
    await user.click(screen.getByRole('button', { name: 'Обновить' }));
    await screen.findByRole('button', { name: 'Обновлённая работа' });
    expect(screen.queryByRole('button', { name: entity.name })).toBeNull();
  });
  it('sends page, filters, size and multi-sort to the backend', async () => {
    const fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      if (body.name) return json(page([{ ...entity, name: 'Найдено сервером' }], 1, body.page, body.size));
      return json(page([{ ...entity, name: body.page === 2 ? 'Вторая страница сервера' : 'Первая страница' }], 12, body.page, body.size));
    });
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await screen.findByRole('button', { name: 'Первая страница' });
    await user.click(screen.getByRole('button', { name: 'Следующая страница' }));
    await screen.findByRole('button', { name: 'Вторая страница сервера' });
    expect(JSON.parse(fetch.mock.lastCall![1].body).page).toBe(2);
    await user.type(screen.getByLabelText('Поиск по названию'), 'механика');
    await user.click(screen.getByRole('button', { name: 'Найти' }));
    // Deliberately a name not matching the client input: frontend must render the server response unchanged.
    await screen.findByRole('button', { name: 'Найдено сервером' });
    expect(JSON.parse(fetch.mock.lastCall![1].body)).toMatchObject({ name: 'механика', page: 1 });
    await user.selectOptions(screen.getByLabelText('Размер страницы'), '20');
    await waitFor(() => expect(JSON.parse(fetch.mock.lastCall![1].body).size).toBe(20));
    await user.selectOptions(screen.getByLabelText('Второй критерий сортировки'), 'name');
    await waitFor(() => expect(JSON.parse(fetch.mock.lastCall![1].body).sort).toEqual([{ field: 'id', direction: 'asc' }, { field: 'name', direction: 'asc' }]));
  });
  it('uses the discipline search endpoint and its response metadata', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => json(url === '/api/labs/disciplines/search' ? page([discipline]) : page([entity])));
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await screen.findByRole('button', { name: entity.name });
    await user.click(screen.getByRole('button', { name: 'Дисциплины' }));
    await screen.findByRole('button', { name: 'Физика' });
    expect(JSON.parse(fetch.mock.lastCall![1].body)).toMatchObject({ sortDirection: 'asc', page: 1 });
    expect(fetch.mock.lastCall![0]).toBe('/api/labs/disciplines/search');
  });
  it('does not let an old response overwrite a newer search', async () => {
    let resolveOld!: (response: Response) => void;
    const fetch = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { resolveOld = resolve; }))
      .mockImplementation(async () => json(page([{ ...entity, name: 'Новые данные' }])));
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Сортировка'), 'name');
    await screen.findByRole('button', { name: 'Новые данные' });
    await act(async () => { resolveOld(json(page([{ ...entity, name: 'Старые данные' }]))); });
    expect(screen.queryByRole('button', { name: 'Старые данные' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Новые данные' })).toBeTruthy();
  });
  it('keeps BARS selectors working alongside server search', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith('/search')) return json(page([entity]));
      if (url === '/api/labs/lab-works') return json([entity]);
      if (url === '/api/labs/disciplines') return json([discipline]);
      return json({ message: 'Работа уже привязана' }, 409);
    });
    vi.stubGlobal('fetch', fetch); render(<App />); const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Связи · BARS' }));
    await screen.findByRole('option', { name: `${entity.name} · №12` });
    await user.selectOptions(screen.getByLabelText('Лабораторная работа'), '12');
    await user.selectOptions(screen.getByLabelText('Дисциплина'), '3');
    await user.click(screen.getByRole('button', { name: 'Добавить в программу' }));
    await screen.findByText('Работа уже привязана');
  });
});
