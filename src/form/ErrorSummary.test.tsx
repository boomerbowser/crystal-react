import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor } from '../test/render.js';
import { ErrorSummary } from './ErrorSummary.js';
import { TextInput } from '../components/TextInput/TextInput.js';
import { Select } from '../components/Select/Select.js';

const Fixture = ({ errors }: { errors: Record<string, string> }) => (
  <form>
    <ErrorSummary errors={errors} />
    <TextInput name="email" label="Email" />
    <Select name="plan" label="Plan" options={[{ value: 'team', label: 'Team' }, { value: 'solo', label: 'Solo' }]} />
  </form>
);

describe('ErrorSummary', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = renderWithCrystal(<Fixture errors={{}} />);
    expect(container.querySelector('[role=region]')).toBeNull();
  });

  it('says how many there are, and takes focus when they arrive', async () => {
    renderWithCrystal(<Fixture errors={{ email: 'Enter an email address' }} />);
    const summary = screen.getByRole('region', { name: 'There is a problem' });
    await waitFor(() => { expect(summary).toHaveFocus(); });
  });

  it('takes the reader to a text field by its name', async () => {
    renderWithCrystal(<Fixture errors={{ email: 'Enter an email address' }} />);
    await userEvent.click(screen.getByRole('link', { name: 'Enter an email address' }));
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
  });

  /* A select's named element is React Aria's hidden native one, which cannot
     take focus, so the link lands on the select's own button instead. */
  it('takes the reader to a select, landing on its button', async () => {
    renderWithCrystal(<Fixture errors={{ plan: 'Choose a plan' }} />);
    await userEvent.click(screen.getByRole('link', { name: 'Choose a plan' }));
    expect(screen.getByRole('button', { name: /Plan/ })).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Fixture errors={{ email: 'Enter an email address', plan: 'Choose a plan' }} />);
    await expectNoAxeViolations(container);
  });
});
