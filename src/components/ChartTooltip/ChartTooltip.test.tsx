import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ChartTooltip } from './ChartTooltip.js';

const rows = [{ name: 'Revenue', value: '£18k', index: 0 }];
const bounds = { width: 400, height: 200 };

describe('ChartTooltip', () => {
  /* Every value in the panel is already the label of the mark it describes, so
     announcing both would read every number twice. The panel is the sighted
     reader's version of what the mark already says. */
  it('is hidden from the accessibility tree, because the mark already says it', () => {
    renderWithCrystal(
      <ChartTooltip data-testid="tip" shown x={10} y={10} bounds={bounds} title="February" rows={rows} />,
    );
    expect(screen.getByTestId('tip').getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByText('£18k')).not.toBeNull();
  });

  it('shows nothing until there is something under the cursor', () => {
    renderWithCrystal(
      <ChartTooltip data-testid="tip" shown={false} x={10} y={10} bounds={bounds} rows={rows} />,
    );
    expect(screen.getByTestId('tip').hasAttribute('data-shown')).toBe(false);
  });

  /* "Never covers the point it describes." Near the right edge it turns instead
     of being clipped. The side is chosen from the point's position without
     measuring the panel, because measuring needs a layout pass and a tooltip one
     frame late under a moving pointer trails. */
  it('turns to the side that keeps it inside the plot', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ChartTooltip data-testid="tip" shown x={20} y={20} bounds={bounds} rows={rows} />,
    );
    expect(screen.getByTestId('tip').dataset['side']).toBe('end');
    rerenderWithCrystal(
      <ChartTooltip data-testid="tip" shown x={380} y={180} bounds={bounds} rows={rows} />,
    );
    expect(screen.getByTestId('tip').dataset['side']).toBe('start');
  });
});
