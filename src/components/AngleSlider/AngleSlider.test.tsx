import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AngleSlider, Knob } from './AngleSlider.js';

describe('AngleSlider and Knob', () => {
  /* The defect this replaced: the name was written only when `label` was a
     string, so a label carrying an icon or a fragment produced a slider with no
     accessible name at all. It now points at the visible label, whatever that
     label is made of. */
  it('is named by its visible label even when the label is not a string', () => {
    renderWithCrystal(<Knob label={<>Gain</>} defaultValue={40} maxValue={100} />);
    expect(screen.getByRole('slider', { name: 'Gain' })).toBeInTheDocument();
  });

  it('names an angle dial the same way', () => {
    renderWithCrystal(<AngleSlider label={<span>Rotation</span>} defaultValue={90} />);
    expect(screen.getByRole('slider', { name: 'Rotation' })).toBeInTheDocument();
  });

  /* A dial announces a bare figure without this; for an angle or a gain that is
     not enough to act on. */
  it('announces the formatted value', () => {
    renderWithCrystal(
      <AngleSlider label="Rotation" defaultValue={90} formatValue={(v) => `${v}°`} />,
    );
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('90°');
  });

  it('moves with the keyboard', async () => {
    renderWithCrystal(<Knob label="Gain" defaultValue={40} maxValue={100} step={5} />);
    const dial = screen.getByRole('slider', { name: 'Gain' });
    dial.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(dial.getAttribute('aria-valuenow')).toBe('45');
  });

  /* Both halves of the key handling have to survive: `useMove` supplies the
     arrows, this component supplies Home and End, and merging is what keeps
     them from replacing one another. */
  it('jumps to each end with Home and End', async () => {
    renderWithCrystal(<Knob label="Gain" defaultValue={40} maxValue={100} step={5} />);
    const dial = screen.getByRole('slider', { name: 'Gain' });
    dial.focus();
    await userEvent.keyboard('{End}');
    expect(dial.getAttribute('aria-valuenow')).toBe('100');
    await userEvent.keyboard('{Home}');
    expect(dial.getAttribute('aria-valuenow')).toBe('0');
  });
});
