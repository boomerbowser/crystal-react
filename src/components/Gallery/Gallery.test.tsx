import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Gallery } from './Gallery.js';

const items = [
  { id: 'a', label: 'Harbour at dusk', thumbnail: <img alt="" src="/a.jpg" /> },
  { id: 'b', label: 'The long bridge', thumbnail: <img alt="" src="/b.jpg" /> },
  { id: 'c', label: 'Rain on the quay', thumbnail: <img alt="" src="/c.jpg" /> },
];

describe('Gallery', () => {
  /* Twelve photographs are not twelve tab stops between the control before the
     gallery and the control after it — the same argument the charts make about
     marks. */
  it('is one tab stop, not one per thumbnail', () => {
    const { container } = renderWithCrystal(<Gallery items={items} label="Photographs" />);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(container.querySelectorAll('[tabindex="-1"]')).toHaveLength(2);
  });

  it('moves along the strip with the arrow keys', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    expect(screen.getByRole('option', { name: 'Harbour at dusk' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('option', { name: 'The long bridge' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: 'Rain on the quay' })).toHaveFocus();
  });

  it('opens the viewer on Enter', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /Harbour at dusk/ })).toBeInTheDocument();
  });

  /* "Arrows move between items with position announced." The position is part
     of the viewer's accessible name, not small text beside it: a reader who
     cannot see the strip has no other way to know where in the set they are. */
  it('says where in the set the viewer is', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /Harbour at dusk\s*1 of 3/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: /The long bridge\s*2 of 3/ })).toBeInTheDocument();
  });

  it('does not offer a way past either end of the set', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  /* A set of one needs no position and no way through it. */
  it('leaves the position and the arrows out of a set of one', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Gallery items={[items[0]!]} label="Photographs" />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Harbour at dusk' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Gallery items={items} label="Photographs" />);
    await expectNoAxeViolations(container);
  });
});
