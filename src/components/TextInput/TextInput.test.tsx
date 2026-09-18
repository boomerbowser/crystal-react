import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { TextInput } from './TextInput.js';


describe('TextInput', () => {
  it('associates its label with the field', () => {
    renderWithCrystal(<TextInput label="Product name" />);
    expect(screen.getByRole('textbox', { name: 'Product name' })).toBeInTheDocument();
  });

  it('has no accessibility violations, including when invalid', async () => {
    const { container } = renderWithCrystal(
      <TextInput label="Email" description="We only use this to reply." errorMessage="Enter an email address." />,
    );
    await expectNoAxeViolations(container);
  });

  it('describes the field with its helper text', () => {
    renderWithCrystal(<TextInput label="Name" description="As it appears on the invoice." />);
    expect(screen.getByRole('textbox', { name: 'Name' }))
      .toHaveAccessibleDescription('As it appears on the invoice.');
  });

  /* An error message IS the invalid state. Two ways to say the same thing would
     eventually disagree, and a field that looks wrong but is not marked invalid
     is invisible to assistive technology. */
  it('treats an error message as the invalid state', () => {
    renderWithCrystal(<TextInput label="Email" errorMessage="Enter an email address." />);
    const field = screen.getByRole('textbox', { name: 'Email' });
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription('Enter an email address.');
  });

  it('plays field-focus when focused', async () => {
    const user = userEvent.setup();
    const { container } = renderWithCrystal(<TextInput label="Name" />);
    await user.tab();
    const shell = container.querySelector('[class*="shell"]') as HTMLElement;
    expect(shell.dataset['crMotionName']).toBe('field-focus');
  });

  /* Bound to state, so a server-side failure animates identically to a client one. */
  it('plays field-invalid when the field becomes invalid, and field-valid when it recovers', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<TextInput label="Email" />);
    const shell = () => container.querySelector('[class*="shell"]') as HTMLElement;

    rerenderWithCrystal(<TextInput label="Email" errorMessage="Bad address." />);
    expect(shell().dataset['crMotionName']).toBe('field-invalid');

    rerenderWithCrystal(<TextInput label="Email" />);
    expect(shell().dataset['crMotionName']).toBe('field-valid');
  });

  /* Motion marks the moment a state is entered. A field that mounts already
     invalid did not just change, so animating it would be marking nothing. */
  it('does not animate a field that mounts already invalid', () => {
    const { container } = renderWithCrystal(
      <TextInput label="Email" errorMessage="Bad address." />,
    );
    const shell = container.querySelector('[class*="shell"]') as HTMLElement;
    expect(shell.dataset['crMotionName']).toBeUndefined();
  });

  it('accepts typing and forwards a ref to the input', async () => {
    const user = userEvent.setup();
    const ref = { current: null as HTMLInputElement | null };
    renderWithCrystal(<TextInput label="Name" ref={ref} />);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Studio');
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.value).toBe('Studio');
  });
});
