import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor, within } from '../../test/render.js';
import { TextInput } from '../TextInput/TextInput.js';
import { ProfileBlock, type ProfileBlockProps, type ProfileState } from './ProfileBlock.js';

const removes = 'Your projects, your comments and your billing history. This cannot be undone.';

const props = (onDelete = vi.fn(), onSignOut = vi.fn()): ProfileBlockProps => ({
  name: 'Ada Fern',
  subtitle: 'Design lead',
  details: [{ label: 'Email', value: 'ada@example.com' }, { label: 'Time zone', value: 'London' }],
  actions: [
    { id: 'sign-out', label: 'Sign out everywhere', onPress: onSignOut },
    { id: 'delete', label: 'Delete account', onPress: onDelete, removes },
  ],
  editor: <TextInput name="name" label="Name" defaultValue="Ada Fern" />,
});

describe('ProfileBlock', () => {
  it('names the profile after the person, and lists the details as terms and values', () => {
    renderWithCrystal(<ProfileBlock {...props()} />);
    expect(screen.getByRole('region', { name: 'Ada Fern' })).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Email', 'Time zone']);
    expect(screen.getByText('ada@example.com').tagName).toBe('DD');
  });

  it('runs an action that removes nothing without asking', async () => {
    const onSignOut = vi.fn();
    renderWithCrystal(<ProfileBlock {...props(vi.fn(), onSignOut)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
    expect(onSignOut).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  /* Destructive actions confirm and say what they remove. */
  it('confirms a destructive action in an alert dialog that says what it removes', async () => {
    const onDelete = vi.fn();
    renderWithCrystal(<ProfileBlock {...props(onDelete)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete account?' });
    expect(dialog).toHaveTextContent(removes);
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete account' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('puts focus on Cancel, and Escape removes nothing', async () => {
    const onDelete = vi.fn();
    renderWithCrystal(<ProfileBlock {...props(onDelete)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    const dialog = await screen.findByRole('alertdialog');
    await waitFor(() => { expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus(); });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => { expect(screen.queryByRole('alertdialog')).toBeNull(); });
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('shows the product\'s fields while editing, and hands over their values', async () => {
    const onSave = vi.fn();
    renderWithCrystal(<ProfileBlock {...props()} state="editing" onSave={onSave} />);
    expect(screen.queryByText('ada@example.com')).toBeNull();
    await userEvent.clear(screen.getByRole('textbox', { name: 'Name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada King');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect((onSave.mock.calls[0]![0] as FormData).get('name')).toBe('Ada King');
  });

  it('holds the fields while saving, and says saved when the details come back', () => {
    const { rerender } = renderWithCrystal(<ProfileBlock {...props()} state="saving" />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Saving');
    rerender(<ProfileBlock {...props()} state="at-rest" />);
    expect(screen.getByRole('status')).toHaveTextContent('Profile saved');
  });

  it('holds the account actions while editing', () => {
    renderWithCrystal(<ProfileBlock {...props()} state="editing" />);
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeDisabled();
  });

  it.each(['at-rest', 'editing', 'saving'] satisfies ProfileState[])('has no axe violations %s', async (state) => {
    const { container } = renderWithCrystal(<ProfileBlock {...props()} state={state} onEdit={() => {}} />);
    await expectNoAxeViolations(container);
  });

  it('has no axe violations while confirming', async () => {
    renderWithCrystal(<ProfileBlock {...props()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    await screen.findByRole('alertdialog');
    await expectNoAxeViolations(document.body);
  });
});
