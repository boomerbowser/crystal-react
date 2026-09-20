import { describe, expect, it, vi } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Pagination } from './Pagination.js';

describe('Pagination', () => {
  it('names every page control rather than leaving it a bare number', () => {
    renderWithCrystal(<Pagination total={5} page={3} onPageChange={vi.fn()} />);
    /* "3" announced alone says nothing about what pressing it does. */
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeTruthy();
  });

  it('marks where you are, distinctly from where you could go', () => {
    renderWithCrystal(<Pagination total={5} page={3} onPageChange={vi.fn()} />);
    const current = screen.getByRole('button', { current: 'page' });
    expect(current.getAttribute('aria-label')).toBe('Page 3');
    expect(screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current'))).toHaveLength(1);
  });

  it('disables the arrows at the bounds rather than removing them', () => {
    const { rerender } = renderWithCrystal(<Pagination total={5} page={1} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();
    rerender(<Pagination total={5} page={5} onPageChange={vi.fn()} />);
    /* Still present. A control that disappears at the edge changes the row's
       shape and moves every other target. */
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).not.toBeDisabled();
  });

  it('never announces the ellipsis as something you can press', () => {
    renderWithCrystal(<Pagination total={50} page={25} onPageChange={vi.fn()} />);
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(names.some((n) => n?.includes('…'))).toBe(false);
    /* Page 25 of 50 elides on both sides, so there are two. */
    const gaps = screen.getAllByText('…');
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) expect(gap).toHaveAttribute('aria-hidden', 'true');
  });

  it('always offers the first and last page', () => {
    renderWithCrystal(<Pagination total={50} page={25} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Page 50' })).toBeTruthy();
  });

  it('renders a single elided page as that page, not as an ellipsis', () => {
    /* "1 … 3 4 5" spends the same width as "1 2 3 4 5" and hides a real
       destination behind a decoration. */
    renderWithCrystal(<Pagination total={5} page={4} onPageChange={vi.fn()} />);
    expect(screen.queryByText('…')).toBeNull();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeTruthy();
  });

  it('reports the page it was asked for', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderWithCrystal(<Pagination total={9} page={4} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange).toHaveBeenCalledWith(5);
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('survives a single page without offering anywhere to go', () => {
    renderWithCrystal(<Pagination total={1} page={1} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /^Page/ })).toHaveLength(1);
  });
});
