import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AnalyticsPanel } from './AnalyticsPanel.js';

const chart = <div data-testid="chart">The chart</div>;

describe('AnalyticsPanel', () => {
  it('is a region named by its heading', () => {
    renderWithCrystal(<AnalyticsPanel title="Revenue by month">{chart}</AnalyticsPanel>);
    expect(screen.getByRole('region', { name: 'Revenue by month' })).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  /* A chart that is loading, empty or failed is usually drawn as an empty plot
     with axes. It says "zero" to anyone reading it, and zero is a number the
     data did not say. So each state replaces the chart rather than decorating
     it, and the panel's controls stay, because they are how the reader changes
     the range that might fix it. */
  it.each([
    ['loading', 'Drawing the chart'],
    ['empty', 'Nothing to chart for this range'],
    ['error', 'The chart could not be drawn'],
  ] as const)('replaces the chart entirely when %s', (state, said) => {
    renderWithCrystal(
      <AnalyticsPanel title="Revenue" state={state} controls={<button type="button">Last 30 days</button>}>
        {chart}
      </AnalyticsPanel>,
    );
    expect(screen.queryByTestId('chart')).toBeNull();
    expect(screen.getByText(said)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 30 days' })).toBeInTheDocument();
  });

  /* A failure is announced; nothing to draw is not. One is a failure, the other
     is a fact about the range, the same division as `ErrorScreen` against
     `EmptyScreen`. */
  it('announces a failure and does not announce an empty range', () => {
    const { unmount } = renderWithCrystal(<AnalyticsPanel title="Revenue" state="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    unmount();

    renderWithCrystal(<AnalyticsPanel title="Revenue" state="empty" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reports the wait as busy', () => {
    renderWithCrystal(<AnalyticsPanel title="Revenue" state="loading" />);
    expect(screen.getByRole('region', { name: 'Revenue' })).toHaveAttribute('aria-busy', 'true');
  });

  /* Every state, not just the one that renders first. An axe violation can
     live in a state most assertions do not check. */
  it.each(['at-rest', 'loading', 'empty', 'error'] as const)('has no axe violations %s', async (state) => {
    const { container } = renderWithCrystal(
      <AnalyticsPanel title="Revenue by month" state={state} controls={<button type="button">Range</button>}>
        {chart}
      </AnalyticsPanel>,
    );
    await expectNoAxeViolations(container);
  });
});
