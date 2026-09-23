import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { useMarkNavigation } from './useMarkNavigation.js';

function Marks({ count, start }: { count: number; start?: number }) {
  const marks = useMarkNavigation(count);
  /* Drive `active` to the end once, so the shrink below starts from a state that
     the new, shorter list cannot contain. */
  if (start !== undefined && marks.active !== start) marks.setActive(start);
  return (
    <svg {...marks.containerProps}>
      {Array.from({ length: count }, (_, i) => (
        // eslint-disable-next-line react/no-array-index-key -- a mark is its position
        <g key={i} {...marks.markProps(i)} data-testid={`mark-${i}`} />
      ))}
    </svg>
  );
}

describe('useMarkNavigation', () => {
  it('leaves exactly one tab stop in the plot', () => {
    const { container } = render(<Marks count={6} />);
    expect(container.querySelectorAll('[tabindex="0"]').length).toBe(1);
    expect(container.querySelectorAll('[tabindex="-1"]').length).toBe(5);
  });

  /* The defect this exists for: a chart whose data shrinks leaves `active` past
     the end, and then no mark is the tab stop and Tab skips the plot entirely. */
  it('keeps a tab stop when the data shrinks under it', () => {
    const { container, rerender } = render(<Marks count={6} start={5} />);
    expect(container.querySelectorAll('[tabindex="0"]').length).toBe(1);
    rerender(<Marks count={3} start={5} />);
    expect(container.querySelectorAll('[tabindex="0"]').length).toBe(1);
  });

  it('survives having no marks at all', () => {
    const { container } = render(<Marks count={0} />);
    expect(container.querySelectorAll('[tabindex]').length).toBe(0);
  });
});
