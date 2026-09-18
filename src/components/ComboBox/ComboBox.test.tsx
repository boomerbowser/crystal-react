import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { ComboBox, Autocomplete } from './ComboBox.js';

const options = [
  { value: 'prism', label: 'Prism' },
  { value: 'harbor', label: 'Harbor' },
  { value: 'ion', label: 'Ion' },
];

describe('ComboBox', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<ComboBox label="Palette" options={options} />);
    await expectNoAxeViolations(container);
  });

  /* The requirement that makes this hard to build and easy to take: focus stays
     in the text field and the highlighted row is named by aria-activedescendant.
     Every implementation that moves focus into the list breaks typing. */
  it('never moves focus into the list', async () => {
    renderWithCrystal(<ComboBox label="Palette" options={options} />);
    const input = screen.getByRole('combobox', { name: 'Palette' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');

    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-activedescendant')).toBeTruthy();
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  /* A list that shows nothing is indistinguishable from one still thinking, and
     both from a broken field. Each says which it is, in text. */
  it('says when nothing matches', async () => {
    renderWithCrystal(<ComboBox label="Palette" options={options} emptyMessage="No palettes" />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Palette' }), 'zzz');
    expect(screen.getByText('No palettes')).toBeInTheDocument();
  });

  /* The whole subject of the component. The first version passed `items`
     unconditionally, which means React Aria treats the collection as the
     product's and filters nothing — a combobox that showed every option however
     much you typed. */
  it('filters as it is typed', async () => {
    renderWithCrystal(<ComboBox label="Palette" options={options} />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Palette' }), 'Har');
    expect(screen.getByRole('option', { name: 'Harbor' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Prism' })).toBeNull();
  });

  it('says when it is loading', async () => {
    renderWithCrystal(<ComboBox label="Palette" options={options} isLoading />);
    /* Opened from the trigger, which is the route that does not depend on typing
       having produced matches. */
    await userEvent.click(screen.getAllByRole('button')[0]!);
    expect(screen.getByRole('status').textContent).toContain('Loading');
  });
});

describe('Autocomplete', () => {
  /* The difference from a combobox is what the product is promising: here the
     text is the value and the list is a shortcut. */
  it('keeps whatever was typed', async () => {
    renderWithCrystal(<Autocomplete label="City" options={options} />);
    const input = screen.getByRole('combobox', { name: 'City' }) as HTMLInputElement;
    await userEvent.type(input, 'Somewhere else');
    await userEvent.tab();
    expect(input.value).toBe('Somewhere else');
  });
});
