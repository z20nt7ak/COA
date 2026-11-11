import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkPanel } from './components';

const disciplines = [{ id: 3, name: 'Физика', practiceHours: 10, labsCount: 1 }, { id: 5, name: 'Алгебра', practiceHours: 20, labsCount: 0 }];
const free = { id: 12, name: 'Колебания', coordinates: { x: 1, y: 2 }, minimalPoint: 1, difficulty: null, creationDate: '2026-10-21T00:00:00Z', discipline: null };
const linked = { ...free, id: 13, name: 'Механика', discipline: disciplines[0] };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const page = (content: unknown[], pageNumber = 1, size = 20, total = content.length) =>
  ({ content, page: pageNumber, size, totalElements: total, totalPages: Math.ceil(total / size) });
describe('BARS selectors', () => {
  it('selects a free lab and discipline and refreshes lists after binding', async () => {
    let bound = false;
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/labs/disciplines/search') return json(page(disciplines));
      if (url === '/api/labs/lab-works/search') return json(page(bound ? [] : [free]));
      bound = true; return new Response(null, { status: 200 });
    });
    vi.stubGlobal('fetch', fetch); const changed = vi.fn().mockResolvedValue(undefined); const user = userEvent.setup();
    render(<LinkPanel changed={changed} />);
    await screen.findByRole('option', { name: 'Колебания · №12' });
    expect(screen.queryByRole('option', { name: /Механика/ })).toBeNull();
    await user.selectOptions(screen.getByLabelText('Лабораторная работа'), '12');
    await user.selectOptions(screen.getByLabelText('Дисциплина'), '3');
    await user.click(screen.getByRole('button', { name: 'Добавить в программу' }));
    await screen.findByRole('status');
    await waitFor(() => expect(changed).toHaveBeenCalledWith(12, 3));
    expect(fetch.mock.calls.some(call => call[0] === '/api/bars/discipline/3/labwork/12/add')).toBe(true);
    expect(screen.queryByRole('option', { name: /Колебания/ })).toBeNull();
  });
  it('automatically selects the current discipline for removal', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      if (url === '/api/labs/disciplines/search') return json(page(disciplines));
      if (url === '/api/labs/lab-works/search') return json(page(JSON.parse(String(options.body)).hasDiscipline ? [linked] : [free]));
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal('fetch', fetch); const user = userEvent.setup();
    render(<LinkPanel changed={vi.fn().mockResolvedValue(undefined)} />);
    await screen.findByRole('option', { name: 'Колебания · №12' });
    await user.click(screen.getByRole('button', { name: 'Отвязать работу' }));
    expect(screen.queryByRole('option', { name: /Колебания/ })).toBeNull();
    await screen.findByRole('option', { name: /Механика/ });
    await user.selectOptions(screen.getByLabelText('Лабораторная работа'), '13');
    expect((screen.getByLabelText('Дисциплина') as HTMLSelectElement).value).toBe('3');
    expect(screen.queryByRole('option', { name: /Алгебра/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Удалить из программы' }));
    await screen.findByRole('status');
    expect(fetch.mock.calls.some(call => call[0] === '/api/bars/discipline/3/labwork/13/remove')).toBe(true);
  });
  it('requests the chosen page size and switches work pages on the server', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      const body = JSON.parse(String(options.body));
      return json(url.endsWith('/disciplines/search')
        ? page(disciplines, body.page, body.size)
        : page([body.page === 1 ? free : { ...free, id: 14, name: 'Оптика' }], body.page, body.size, 6));
    });
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    render(<LinkPanel changed={vi.fn()} />);
    await screen.findByRole('option', { name: 'Колебания · №12' });
    await user.selectOptions(screen.getByLabelText('Записей на странице'), '5');
    await user.click(await screen.findByRole('button', { name: 'Следующая страница лабораторных работ' }));
    await screen.findByRole('option', { name: 'Оптика · №14' });
    expect(screen.queryByRole('option', { name: 'Колебания · №12' })).toBeNull();
    expect(fetch.mock.calls.some(([url, options]) =>
      url === '/api/labs/lab-works/search' &&
      JSON.stringify(JSON.parse(options.body)) === JSON.stringify({ page: 2, size: 5, sortBy: 'name', hasDiscipline: false }),
    )).toBe(true);
  });
  it('disables submission for empty lists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => json(page([]))));
    render(<LinkPanel changed={vi.fn()} />);
    await screen.findByText(/Нет свободных лабораторных/);
    expect((screen.getByRole('button', { name: 'Добавить в программу' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('shows list errors with a retry and never permits submitting stale lists', async () => {
    const fetch = vi.fn().mockImplementation(async () => json({ message: 'Нет подключения' }, 503));
    vi.stubGlobal('fetch', fetch); const user = userEvent.setup();
    render(<LinkPanel changed={vi.fn()} />);
    await screen.findByRole('alert');
    expect((screen.getByRole('button', { name: 'Добавить в программу' }) as HTMLButtonElement).disabled).toBe(true);
    fetch.mockImplementation(async (url: string) => json(page(url.endsWith('/disciplines/search') ? disciplines : [free])));
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку списков' }));
    await screen.findByRole('option', { name: 'Колебания · №12' });
  });
});
