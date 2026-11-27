import { describe, expect, it } from 'vitest';
import { renderWithPrismata, screen } from '../../test/render.js';
import { Grid } from './Grid.js';

describe('Grid', () => {
  it('passes spans as custom properties rather than generated classes', () => {
    renderWithPrismata(
      <Grid gap="lg" data-testid="g">
        <Grid.Cell span={4} spanMd={6} spanSm={12} data-testid="c">x</Grid.Cell>
      </Grid>,
    );
    expect(screen.getByTestId('g').style.getPropertyValue('--pr-grid-gap')).toBe('var(--pr-spacing-lg)');
    const cell = screen.getByTestId('c');
    expect(cell.style.getPropertyValue('--pr-cell-span')).toBe('4');
    expect(cell.style.getPropertyValue('--pr-cell-span-md')).toBe('6');
    expect(cell.style.getPropertyValue('--pr-cell-span-sm')).toBe('12');
  });

  /* A cell with no span must be full width, so a forgotten prop produces a
     readable stack and not a page of slivers. */
  it('declares no span when none is given, so the stylesheet default applies', () => {
    renderWithPrismata(<Grid><Grid.Cell data-testid="c">x</Grid.Cell></Grid>);
    expect(screen.getByTestId('c').style.getPropertyValue('--pr-cell-span')).toBe('');
  });
});
