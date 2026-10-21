import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityForm } from './components';
import type { LabWork } from './types';

const options = [{ id: 3, name: 'Физика', practiceHours: 10, labsCount: 1 }, { id: 8, name: 'Алгебра', practiceHours: 20, labsCount: 0 }];
const lab: LabWork = { id: 12, name: 'Колебания', coordinates: { x: 1, y: 2 }, minimalPoint: 10, difficulty: null, discipline: options[0], creationDate: '2026-10-21T00:00:00Z' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
describe('discipline selector', () => {
  it('loads existing disciplines and submits only the selected ID', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => json(url === '/api/labs/disciplines' ? options : lab));
    vi.stubGlobal('fetch', fetch); const saved = vi.fn(); const user = userEvent.setup();
    render(<EntityForm resource="lab-works" close={vi.fn()} saved={saved} />);
    await screen.findByRole('option', { name: 'Физика · №3' });
    expect(screen.queryByRole('textbox', { name: /ID дисциплины/ })).toBeNull();
    await user.type(screen.getByLabelText('Название'), 'Колебания');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Дисциплина' }), '3');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(saved).toHaveBeenCalled());
    const call = fetch.mock.calls.find(call => call[0] === '/api/labs/lab-works');
    expect(JSON.parse(call![1].body).discipline).toEqual({ id: 3 });
  });
  it('keeps the current selection when editing and allows removing it', async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => json(url === '/api/labs/disciplines' ? options : lab));
    vi.stubGlobal('fetch', fetch); const user = userEvent.setup();
    render(<EntityForm resource="lab-works" entity={lab} close={vi.fn()} saved={vi.fn()} />);
    await screen.findByRole('option', { name: 'Физика · №3' });
    const select = screen.getByRole('combobox', { name: 'Дисциплина' }) as HTMLSelectElement;
    expect(select.value).toBe('3');
    await user.selectOptions(select, '');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    const call = fetch.mock.calls.find(call => call[0] === '/api/labs/lab-works/12');
    expect(JSON.parse(call![1].body).discipline).toBeNull();
  });
  it('supports an empty catalogue without asking for a manual ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([])));
    render(<EntityForm resource="lab-works" close={vi.fn()} saved={vi.fn()} />);
    await screen.findByText(/Дисциплин пока нет/);
    const select = screen.getByRole('combobox', { name: 'Дисциплина' }) as HTMLSelectElement;
    expect(select.value).toBe(''); expect(select.disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Сохранить' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('blocks saving on a list error and allows retrying', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(json({ message: 'Сервис недоступен' }, 503)).mockImplementation(async () => json(options));
    vi.stubGlobal('fetch', fetch); const user = userEvent.setup();
    render(<EntityForm resource="lab-works" close={vi.fn()} saved={vi.fn()} />);
    await screen.findByRole('alert');
    expect((screen.getByRole('button', { name: 'Сохранить' }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }));
    await screen.findByRole('option', { name: 'Физика · №3' });
    expect((screen.getByRole('button', { name: 'Сохранить' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
