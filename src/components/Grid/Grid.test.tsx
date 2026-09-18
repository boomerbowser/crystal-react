import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Grid } from './Grid.js';

describe('Grid', () => {
  it('passes spans as custom properties rather than generated classes', () => {
    renderWithCrystal(
      <Grid gap="lg" data-testid="g">
        <Grid.Cell span={4} spanMd={6} spanSm={12} data-testid="c">x</Grid.Cell>
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--cr-grid-gap')).toBe('var(--cr-spacing-lg)');
    const cell = screen.getByTestId('c');
    expect(cell.style.getPropertyValue('--cr-cell-span')).toBe('4');
    expect(cell.style.getPropertyValue('--cr-cell-span-md')).toBe('6');
    expect(cell.style.getPropertyValue('--cr-cell-span-sm')).toBe('12');
  });

  /* A cell with no span must be full width, not narrow. A grid that defaults to
     a sliver produces a page of slivers the first time somebody forgets a prop;
     one that defaults to full width produces a readable stack. */
  it('declares no span when none is given, so the stylesheet default applies', () => {
    renderWithCrystal(<Grid><Grid.Cell data-testid="c">x</Grid.Cell></Grid>);
    expect(screen.getByTestId('c').style.getPropertyValue('--cr-cell-span')).toBe('');
  });
});
