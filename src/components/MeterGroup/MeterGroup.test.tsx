import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { MeterGroup } from './MeterGroup.js';

const segments = [
  { name: 'Documents', value: 40 },
  { name: 'Media', value: 25 },
  { name: 'Cache', value: 10 },
];

describe('MeterGroup', () => {
  /* Two measurements are two meters. One element reporting a single number would
     have to pick which of them it meant. */
  it('makes every segment its own meter', () => {
    renderWithCrystal(<MeterGroup label="Storage" segments={segments} />);
    expect(screen.getAllByRole('meter')).toHaveLength(3);
    expect(screen.getByRole('meter', { name: 'Documents' })).toHaveAttribute('aria-valuenow', '40');
  });

  /* "Meaning never rests on colour alone." The legend is where each segment's
     name is written, so it is on by default and this is the check that it is. */
  it('names every segment in words, not only by its swatch', () => {
    const { container } = renderWithCrystal(<MeterGroup label="Storage" segments={segments} />);
    const legend = container.querySelector('ul')!;
    expect(within(legend as HTMLElement).getByText('Media')).toBeInTheDocument();
  });

  it('measures each segment against the whole rather than against itself', () => {
    renderWithCrystal(<MeterGroup label="Storage" segments={segments} total={100} />);
    expect(screen.getByRole('meter', { name: 'Cache' })).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByRole('meter', { name: 'Cache' }))
      .toHaveAttribute('aria-valuetext', '10 of 100');
  });

  /* Without a total the whole is the sum, so the segments fill the track. With
     one, what is left over is left empty — which is the only reason to pass it. */
  it('fills the track when no total is given', () => {
    const { container } = renderWithCrystal(<MeterGroup label="Storage" segments={segments} />);
    const widths = [...container.querySelectorAll('[role="meter"]')]
      .map((meter) => Number.parseFloat((meter as HTMLElement).style.inlineSize));
    expect(widths.reduce((sum, one) => sum + one, 0)).toBeCloseTo(100, 5);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<MeterGroup label="Storage" segments={segments} />);
    await expectNoAxeViolations(container);
  });
});
