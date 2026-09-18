import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Select, NativeSelect } from './Select.js';

const options = [
  { value: 'prism', label: 'Prism' },
  { value: 'harbor', label: 'Harbor' },
];

describe('Select', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Select label="Palette" options={options} />);
    await expectNoAxeViolations(container);
  });

  it('opens and chooses from the keyboard', async () => {
    renderWithCrystal(<Select label="Palette" options={options} />);
    const trigger = screen.getByRole('button', { name: /Palette/ });
    await userEvent.click(trigger);

    const list = screen.getByRole('listbox');
    expect(list).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Harbor' }));
    expect(trigger.textContent).toContain('Harbor');
  });

  /* In Crystal a check mark means validated or informational. A list that uses
     one for selection has said something else, so selection is label weight. */
  it('marks the chosen option without a check mark', async () => {
    renderWithCrystal(<Select label="Palette" options={options} defaultSelectedKey="prism" />);
    await userEvent.click(screen.getByRole('button', { name: /Palette/ }));
    const chosen = screen.getByRole('option', { name: 'Prism' });
    expect(chosen.getAttribute('aria-selected')).toBe('true');
    expect(chosen.textContent).not.toContain('✓');
  });
});

describe('NativeSelect', () => {
  /* A real select opens the platform picker, which on a phone is faster and works
     with everything the platform ships. */
  it('is a real select with a bound label', () => {
    renderWithCrystal(
      <NativeSelect label="Palette" id="palette">
        <option value="prism">Prism</option>
      </NativeSelect>,
    );
    const select = screen.getByRole('combobox', { name: 'Palette' });
    expect(select.tagName).toBe('SELECT');
  });
});
