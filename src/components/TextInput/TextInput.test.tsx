import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen, userEvent } from '../../test/render.js';
import { TextInput } from './TextInput.js';


describe('TextInput', () => {
  it('associates its label with the field', () => {
    renderWithPrismata(<TextInput label="Product name" />);
    expect(screen.getByRole('textbox', { name: 'Product name' })).toBeInTheDocument();
  });

  it('has no accessibility violations, including when invalid', async () => {
    const { container } = renderWithPrismata(
      <TextInput label="Email" description="We only use this to reply." errorMessage="Enter an email address." />,
    );
    await expectNoAxeViolations(container);
  });

  it('describes the field with its helper text', () => {
    renderWithPrismata(<TextInput label="Name" description="As it appears on the invoice." />);
    expect(screen.getByRole('textbox', { name: 'Name' }))
      .toHaveAccessibleDescription('As it appears on the invoice.');
  });

  /* An error message is the invalid state. Two separate ways to say it could
     disagree, and a field that looks wrong but is not marked invalid is
     invisible to assistive technology. */
  it('treats an error message as the invalid state', () => {
    renderWithPrismata(<TextInput label="Email" errorMessage="Enter an email address." />);
    const field = screen.getByRole('textbox', { name: 'Email' });
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription('Enter an email address.');
  });

  it('plays field-focus when focused', async () => {
    const user = userEvent.setup();
    const { container } = renderWithPrismata(<TextInput label="Name" />);
    await user.tab();
    const shell = container.querySelector('[class*="shell"]') as HTMLElement;
    expect(shell.dataset['prMotionName']).toBe('field-focus');
  });

  /* Bound to state, so a server-side failure animates identically to a client one. */
  it('plays field-invalid when the field becomes invalid, and field-valid when it recovers', () => {
    const { container, rerenderWithPrismata } = renderWithPrismata(<TextInput label="Email" />);
    const shell = () => container.querySelector('[class*="shell"]') as HTMLElement;

    rerenderWithPrismata(<TextInput label="Email" errorMessage="Bad address." />);
    expect(shell().dataset['prMotionName']).toBe('field-invalid');

    rerenderWithPrismata(<TextInput label="Email" />);
    expect(shell().dataset['prMotionName']).toBe('field-valid');
  });

  /* Motion marks the moment a state is entered. A field that mounts already
     invalid has not changed state, so it does not animate. */
  it('does not animate a field that mounts already invalid', () => {
    const { container } = renderWithPrismata(
      <TextInput label="Email" errorMessage="Bad address." />,
    );
    const shell = container.querySelector('[class*="shell"]') as HTMLElement;
    expect(shell.dataset['prMotionName']).toBeUndefined();
  });

  it('accepts typing and forwards a ref to the input', async () => {
    const user = userEvent.setup();
    const ref = { current: null as HTMLInputElement | null };
    renderWithPrismata(<TextInput label="Name" ref={ref} />);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Studio');
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.value).toBe('Studio');
  });
});
