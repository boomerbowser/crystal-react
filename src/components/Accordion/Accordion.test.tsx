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
     watching the others — which is what `DisclosureGroup` is for. */
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

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Accordion items={items} defaultExpandedKeys={['shipping']} />);
    await expectNoAxeViolations(container);
  });
});
