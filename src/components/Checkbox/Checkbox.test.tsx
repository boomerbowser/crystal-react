import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Checkbox, CheckboxGroup, Radio, RadioGroup } from './Checkbox.js';

describe('Checkbox', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Checkbox>Remember this device</Checkbox>);
    expect(screen.getByRole('checkbox', { name: 'Remember this device' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* The catalogue's rule, in as many words: indeterminate is set through the
     property, not a class. The DOM property is what makes a native checkbox
     expose "mixed"; a class that draws a dash gives a control that looks
     partially checked and announces as unchecked, which is worse than not
     drawing it. This asserts the property because that is the mechanism the rule
     names — `aria-checked` is absent precisely because the native one is used. */
  it('sets indeterminate through the property, not a class', () => {
    renderWithCrystal(<Checkbox isIndeterminate>Select all</Checkbox>);
    const box = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box.getAttribute('aria-checked')).toBeNull();
  });

  it('toggles from the keyboard', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<Checkbox onChange={onChange}>Remember</Checkbox>);
    screen.getByRole('checkbox', { name: 'Remember' }).focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('CheckboxGroup', () => {
  /* "Choose at least one" belongs to the set. Attached to the first checkbox it
     becomes a message about that checkbox. */
  it('describes the group rather than the first option', async () => {
    const { container } = renderWithCrystal(
      <CheckboxGroup label="Notify me about" errorMessage="Choose at least one">
        <Checkbox value="mentions">Mentions</Checkbox>
        <Checkbox value="replies">Replies</Checkbox>
      </CheckboxGroup>,
    );
    const group = screen.getByRole('group', { name: /Notify me about/ });
    expect(group).toBeInTheDocument();
    expect(screen.getByText('Choose at least one')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});

describe('RadioGroup', () => {
  it('moves between options with the arrow keys, as one tab stop', async () => {
    renderWithCrystal(
      <RadioGroup label="Plan">
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
      </RadioGroup>,
    );
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Free' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
  });
});
