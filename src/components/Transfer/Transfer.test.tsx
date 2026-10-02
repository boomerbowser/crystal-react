import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Transfer } from './Transfer.js';
import { Cascader } from '../Cascader/Cascader.js';

const items = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'admin', label: 'Administer' },
];

describe('Transfer', () => {
  it('has no accessibility violations and names each list', async () => {
    const { container } = renderWithCrystal(<Transfer items={items} defaultValue={['read']} />);
    expect(screen.getByRole('listbox', { name: 'Available' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Chosen' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* The catalogue requires that the keyboard can move items without drag.
     Dragging between two lists is unavailable to a keyboard user and invisible
     to a screen reader. */
  it('moves items with named controls rather than a drag', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<Transfer items={items} defaultValue={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole('option', { name: 'Write' }));
    await userEvent.click(screen.getByRole('button', { name: 'Move to Chosen' }));
    expect(onChange).toHaveBeenLastCalledWith(['write']);
  });

  /* Without an announcement, a screen reader user hears nothing when an item
     leaves one list and appears in another. */
  it('announces a move', async () => {
    renderWithCrystal(<Transfer items={items} defaultValue={[]} />);
    await userEvent.click(screen.getByRole('option', { name: 'Write' }));
    await userEvent.click(screen.getByRole('button', { name: 'Move to Chosen' }));
    expect(screen.getByRole('status').textContent).toMatch(/moved to Chosen/);
  });
});

describe('Cascader', () => {
  const tree = [
    {
      value: 'uk',
      label: 'United Kingdom',
      children: [
        { value: 'scotland', label: 'Scotland', children: [{ value: 'edinburgh', label: 'Edinburgh' }] },
      ],
    },
    { value: 'fr', label: 'France' },
  ];

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Cascader label="Location" options={tree} />);
    await expectNoAxeViolations(container);
  });

  /* The answer is "United Kingdom / Scotland / Edinburgh". A reader who hears
     only "Edinburgh" loses the part that disambiguates it. */
  it('shows and announces the whole path', () => {
    renderWithCrystal(
      <Cascader label="Location" options={tree} defaultValue={['uk', 'scotland', 'edinburgh']} />,
    );
    expect(screen.getByRole('button', { name: /Location/ }).textContent)
      .toContain('United Kingdom / Scotland / Edinburgh');
  });

  /* An option that opens another column and one that is the answer look
     identical without a marker. */
  it('says which options are branches, in the name rather than as a picture', async () => {
    renderWithCrystal(<Cascader label="Location" options={tree} />);
    await userEvent.click(screen.getByRole('button', { name: /Location/ }));
    expect(screen.getByRole('option', { name: /United Kingdom, opens a further list/ })).toBeInTheDocument();
    /* A leaf has nothing extra in its name, because choosing it finishes. */
    expect(screen.getByRole('option', { name: 'France' })).toBeInTheDocument();
  });
});
