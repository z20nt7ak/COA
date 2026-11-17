import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpandableText } from './components';

describe('expandable text', () => {
  it('shows short text as is without a toggle', () => {
    render(<ExpandableText text="Физика" limit={10} />);
    screen.getByText('Физика');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('truncates long text and expands and collapses it on demand', async () => {
    const text = 'Исследование вынужденных колебаний маятника';
    render(<ExpandableText text={text} limit={12} />);
    screen.getByText('Исследование…');

    const toggle = screen.getByRole('button', { name: `Показать полностью «${text}»` });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(toggle);
    screen.getByText(text);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: `Свернуть «${text}»` }));
    screen.getByText('Исследование…');
  });

  it('keeps a custom wrapper such as a clickable title', () => {
    render(<ExpandableText text="Очень длинное название лабораторной" limit={5} render={shown => <button>{shown}</button>} />);
    screen.getByRole('button', { name: 'Очень…' });
  });
});
