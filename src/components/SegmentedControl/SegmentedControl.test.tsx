import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { SegmentedControl } from './SegmentedControl.js';

const options = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
];

describe('SegmentedControl', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <SegmentedControl label="Appearance" options={options} defaultValue="light" />,
    );
    await expectNoAxeViolations(container);
  });

  /* Radio group semantics, never a tablist. A control that borrows tab semantics
     announces its options as tabs, and a reader then expects a panel to change —
     a promise the control did not make. */
  it('is a radio group and never uses aria-selected', () => {
    renderWithCrystal(<SegmentedControl label="Appearance" options={options} defaultValue="light" />);
    expect(screen.getByRole('radiogroup', { name: /Appearance/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
    for (const option of screen.getAllByRole('radio')) {
      expect(option.getAttribute('aria-selected')).toBeNull();
    }
  });

  it('moves with the arrow keys, as one tab stop', async () => {
    renderWithCrystal(<SegmentedControl label="Appearance" options={options} defaultValue="light" />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  /* A hidden label still has to name the group; dropping it would leave the
     group unnamed. */
  it('keeps the group named when the label is hidden', () => {
    renderWithCrystal(
      <SegmentedControl label="Appearance" options={options} labelHidden defaultValue="light" />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeInTheDocument();
  });
});
