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

  /* Focus stays in the text field, and the highlighted row is named by
     aria-activedescendant. Moving focus into the list breaks typing. */
  it('never moves focus into the list', async () => {
    renderWithCrystal(<ComboBox label="Palette" options={options} />);
    const input = screen.getByRole('combobox', { name: 'Palette' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');

    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-activedescendant')).toBeTruthy();
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  /* A list that shows nothing cannot be told apart from one still loading, or
     from a broken field. Each state says which it is, in text. */
  it('says when nothing matches', async () => {
    renderWithCrystal(<ComboBox label="Palette" options={options} emptyMessage="No palettes" />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Palette' }), 'zzz');
    expect(screen.getByText('No palettes')).toBeInTheDocument();
  });

  /* Filtering is the component's main job. Passing `items` makes React Aria
     treat the collection as the product's and filter nothing, so every option
     would show however much was typed. */
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
  /* Unlike a combobox, here the text is the value and the list is a shortcut. */
  it('keeps whatever was typed', async () => {
    renderWithCrystal(<Autocomplete label="City" options={options} />);
    const input = screen.getByRole('combobox', { name: 'City' }) as HTMLInputElement;
    await userEvent.type(input, 'Somewhere else');
    await userEvent.tab();
    expect(input.value).toBe('Somewhere else');
  });
});
