import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Accordion } from './Accordion.js';

const items = [
  { id: 'shipping', title: 'Shipping', children: 'Two to four days.' },
  { id: 'returns', title: 'Returns', children: 'Thirty days, unopened.' },
];

describe('Accordion', () => {
  it('gives every row a header button with aria-expanded and aria-controls', () => {
    renderWithCrystal(<Accordion items={items} />);
    const header = screen.getByRole('button', { name: 'Shipping' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header.getAttribute('aria-controls')).toBeTruthy();
  });

  it('opens a row when its header is pressed', async () => {
    renderWithCrystal(<Accordion items={items} />);
    await userEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Two to four days.')).toBeVisible();
  });

  /* "Only one at a time" is a property of the group, not of five rows each
     watching the others. That is what `DisclosureGroup` is for. */
  it('closes the open row when another opens, unless several are allowed', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Accordion items={items} />);
    await userEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    await userEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute('aria-expanded', 'false');

    rerenderWithCrystal(<Accordion items={items} allowsMultipleExpanded />);
    await userEvent.click(screen.getByRole('button', { name: 'Shipping' }));
    await userEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts with the rows it was told to expand', () => {
    renderWithCrystal(<Accordion items={items} defaultExpandedKeys={['returns']} />);
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute('aria-expanded', 'true');
  });

  /* `icon-turn` is a rotate-and-scale torsion. On the header button it would turn
     the title with it and leave the final keyframe applied there. This test
     keeps it scoped to the chevron. */
  it('turns the chevron and not the header', async () => {
    renderWithCrystal(<Accordion items={items} />);
    const header = screen.getByRole('button', { name: 'Shipping' });
    await userEvent.click(header);
    const chevron = header.querySelector('svg') as SVGElement;
    expect(chevron.dataset['crMotionName'] ?? chevron.dataset['crMotionState']).toBeDefined();
    expect(header.dataset['crMotionName'] ?? header.dataset['crMotionState']).toBeUndefined();
  });

  /* Crystal's `accordion-in` is a clip and a fade on the content ("no scripted
     height measurement needed"), and it plays when the row opens, never on a row
     that was open when the page loaded. */
  it('plays the arrival on the content when the row opens, and not on load', async () => {
    const { container } = renderWithCrystal(<Accordion items={items} defaultExpandedKeys={['shipping']} />);
    const open = container.querySelector('[id]:not([hidden]) > div') as HTMLElement | null;
    expect(open?.dataset['crMotionName'] ?? open?.dataset['crMotionState']).toBeUndefined();

    await userEvent.click(screen.getByRole('button', { name: 'Returns' }));
    const panels = [...container.querySelectorAll('div')]
      .filter((node) => node.dataset['crMotionName'] !== undefined || node.dataset['crMotionState'] !== undefined);
    expect(panels.length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Accordion items={items} defaultExpandedKeys={['shipping']} />);
    await expectNoAxeViolations(container);
  });
});
