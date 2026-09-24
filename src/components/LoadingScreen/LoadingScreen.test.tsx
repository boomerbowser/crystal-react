import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { LoadingScreen } from './LoadingScreen.js';

describe('LoadingScreen', () => {
  it('reports the whole region as busy', () => {
    renderWithCrystal(
      <LoadingScreen label="Loading the report" placeholder={<div />} data-testid="screen" />,
    );
    expect(screen.getByTestId('screen')).toHaveAttribute('aria-busy', 'true');
  });

  /* "The wait is announced once, not repeatedly." That is a count, and the
     count is of live regions rather than of words: one `Skeleton` per shape
     would be one region per shape, and a screen reader would say the same
     sentence as many times as there are bars on the screen. Twelve shapes here,
     because a claim about repetition cannot be tested with one of anything. */
  it('announces the wait once however many shapes are coming', () => {
    renderWithCrystal(
      <LoadingScreen
        label="Loading the report"
        placeholder={<>{Array.from({ length: 12 }, (_, i) => <div key={i} />)}</>}
      />,
    );
    const regions = screen.getAllByRole('status');
    expect(regions).toHaveLength(1);
    expect(regions[0]).toHaveTextContent('Loading the report');
  });

  /* The shapes are decoration: a reader who heard them would be told about
     twelve empty boxes before being told what is loading. */
  it('keeps the shapes out of the accessibility tree', () => {
    const { container } = renderWithCrystal(
      <LoadingScreen label="Loading" placeholder={<div data-testid="shape" />} />,
    );
    expect(container.querySelector('[data-testid="shape"]')?.closest('[aria-hidden="true"]'))
      .not.toBeNull();
  });

  /* A skeleton of the wrong shape is a promise the arriving content breaks. A
     spinner is honest about knowing nothing, so that is the fallback. */
  it('falls back to a spinner when the shape is not known', () => {
    renderWithCrystal(<LoadingScreen label="Loading" />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <LoadingScreen label="Loading the report" placeholder={<div />} />,
    );
    await expectNoAxeViolations(container);
  });
});
