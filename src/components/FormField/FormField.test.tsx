import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { FormField, Fieldset, HelperText } from './FormField.js';

describe('FormField', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <FormField label="Workspace name"><input /></FormField>,
    );
    await expectNoAxeViolations(container);
  });

  it('points the label at the control, so clicking it focuses the control', async () => {
    renderWithCrystal(<FormField label="Workspace name"><input /></FormField>);
    await userEvent.click(screen.getByText('Workspace name'));
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  /* Both, when there are both. Describing a field by only its error drops the
     guidance that would have prevented it. */
  it('describes the control by the hint and the error together', () => {
    renderWithCrystal(
      <FormField label="Name" description="Visible to your team" errorMessage="Already taken">
        <input />
      </FormField>,
    );
    const control = screen.getByRole('textbox');
    const describedBy = control.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(describedBy).toHaveLength(2);
    const described = describedBy.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(described).toContain('Visible to your team');
    expect(described).toContain('Already taken');
  });

  /* An error message is the invalid state. Two ways to say the same thing
     eventually disagree, and the one the reader is told is the one that matters. */
  it('marks the control invalid from the message alone', () => {
    renderWithCrystal(<FormField label="Name" errorMessage="Already taken"><input /></FormField>);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
  });

  /* Errors are text, never colour alone — and a message that appears after
     submission has to be announced rather than only drawn. */
  it('announces the error rather than only colouring the field', () => {
    renderWithCrystal(<FormField label="Name" errorMessage="Already taken"><input /></FormField>);
    expect(screen.getByRole('alert').textContent).toContain('Already taken');
  });

  it('says a field is required in the accessibility tree, not only with an asterisk', () => {
    renderWithCrystal(<FormField label="Name" isRequired><input /></FormField>);
    expect(screen.getByRole('textbox').getAttribute('aria-required')).toBe('true');
  });
});

describe('Fieldset', () => {
  /* A native fieldset disables every control in it, which is why this is one
     rather than a div with a heading. */
  it('disables its controls when the set is disabled', () => {
    renderWithCrystal(
      <Fieldset legend="Billing" isDisabled>
        <input aria-label="Card" />
      </Fieldset>,
    );
    expect(screen.getByRole('textbox', { name: 'Card' })).toBeDisabled();
  });

  it('is a named group', () => {
    renderWithCrystal(<Fieldset legend="Billing"><input aria-label="Card" /></Fieldset>);
    expect(screen.getByRole('group', { name: /Billing/ })).toBeInTheDocument();
  });
});

describe('HelperText', () => {
  it('announces an error and stays quiet for a hint', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<HelperText>Visible to your team</HelperText>);
    expect(screen.queryByRole('alert')).toBeNull();

    rerenderWithCrystal(<HelperText isError>Already taken</HelperText>);
    expect(screen.getByRole('alert').textContent).toContain('Already taken');
  });
});
