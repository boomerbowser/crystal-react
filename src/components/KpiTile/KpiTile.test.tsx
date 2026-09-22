import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { KpiTile } from './KpiTile.js';

const base = {
  label: 'Revenue',
  value: '£48,210',
  target: '£45,000 target',
  attainment: 1.07,
  attainmentLabel: '107% of target, on target',
} as const;

describe('KpiTile', () => {
  /* "Target attainment is stated in words as well as shown": a bar near its end
     and a bar past its end look the same, and neither says whether past the end
     is good. */
  it('states the attainment in words, not only in the bar', () => {
    renderWithCrystal(<KpiTile {...base} onTarget />);
    expect(screen.getByText('107% of target, on target')).toBeInTheDocument();
    expect(screen.getByText('£45,000 target')).toBeInTheDocument();
  });

  it('is a real progress element, labelled by the sentence above it', () => {
    const { container } = renderWithCrystal(<KpiTile {...base} onTarget />);
    const bar = container.querySelector('progress');
    expect(bar).not.toBeNull();
    expect(bar?.max).toBe(1);
    /* Clamped for the bar, because 107% of a target is still a full bar. */
    expect(bar?.value).toBe(1);
    expect(bar?.getAttribute('aria-labelledby')).toBeTruthy();
  });

  /* Attainment is not always "value ≥ target": a cost target is met by coming in
     under it, so the judgement is the caller's. */
  it('takes the on-target judgement rather than making it', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <KpiTile {...base} onTarget data-testid="t" />,
    );
    expect(screen.getByTestId('t').dataset['state']).toBe('on-target');
    rerenderWithCrystal(<KpiTile {...base} onTarget={false} data-testid="t" />);
    expect(screen.getByTestId('t').dataset['state']).toBe('off-target');
    rerenderWithCrystal(<KpiTile {...base} data-testid="t" />);
    expect(screen.getByTestId('t').dataset['state']).toBe('at-rest');
  });

  /* No value at all while loading, which is what makes a progress element
     indeterminate rather than showing a figure nobody measured. */
  it('leaves the bar indeterminate while it loads', () => {
    const { container } = renderWithCrystal(<KpiTile {...base} loading data-testid="t" />);
    expect(container.querySelector('progress')?.hasAttribute('value')).toBe(false);
    expect(screen.getByTestId('t').dataset['state']).toBe('loading');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<KpiTile {...base} onTarget />);
    await expectNoAxeViolations(container);
  });
});
