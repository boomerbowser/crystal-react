import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor, within } from '../../test/render.js';
import { Switch } from '../Switch/Switch.js';
import { SettingsBlock, type SettingsBlockProps, type SettingsState } from './SettingsBlock.js';

const groups: SettingsBlockProps['groups'] = [
  { id: 'mail', title: 'Email', description: 'What we send you.', children: <Switch>Weekly summary</Switch> },
  { id: 'privacy', title: 'Privacy', children: <Switch>Show my status</Switch> },
];

const props: SettingsBlockProps = { title: 'Settings', groups };

/* Whether a beforeunload now would ask the reader to confirm. */
const wouldAsk = (): boolean => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe('SettingsBlock', () => {
  /* The opinion, half one. */
  it('makes each group a region named by its heading', () => {
    renderWithCrystal(<SettingsBlock {...props} />);
    const mail = screen.getByRole('region', { name: 'Email' });
    expect(within(mail).getByRole('switch', { name: 'Weekly summary' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Privacy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Email' })).toBeInTheDocument();
  });

  /* Half two, route one: becoming dirty is said. */
  it('says unsaved changes when it becomes dirty, from a region that was already there', () => {
    const { rerender } = renderWithCrystal(<SettingsBlock {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    rerender(<SettingsBlock {...props} state="dirty" />);
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
  });

  /* Route two: the browser asks, while there is anything unsaved and not after. */
  it('asks the browser to confirm leaving the document while dirty, and stops once saved', () => {
    const { rerender, unmount } = renderWithCrystal(<SettingsBlock {...props} />);
    expect(wouldAsk()).toBe(false);
    rerender(<SettingsBlock {...props} state="dirty" />);
    expect(wouldAsk()).toBe(true);
    rerender(<SettingsBlock {...props} state="saving" />);
    expect(wouldAsk()).toBe(true);
    rerender(<SettingsBlock {...props} state="saved" />);
    expect(wouldAsk()).toBe(false);
    rerender(<SettingsBlock {...props} state="dirty" guardUnload={false} />);
    expect(wouldAsk()).toBe(false);
    unmount();
  });

  /* Route three: the product's router holds the navigation and the block asks. */
  it('asks in an alert dialog when the router holds a navigation, and reports the choice', async () => {
    const onLeaveChoice = vi.fn();
    renderWithCrystal(<SettingsBlock {...props} state="dirty" isLeaving onLeaveChoice={onLeaveChoice} />);
    const dialog = await screen.findByRole('alertdialog', { name: 'Unsaved changes' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard and leave' }));
    expect(onLeaveChoice).toHaveBeenLastCalledWith('discard');
  });

  it('stays on Escape', async () => {
    const onLeaveChoice = vi.fn();
    renderWithCrystal(<SettingsBlock {...props} state="dirty" isLeaving onLeaveChoice={onLeaveChoice} />);
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    expect(onLeaveChoice).toHaveBeenLastCalledWith('stay');
  });

  it('does not ask on leaving when nothing is unsaved', () => {
    renderWithCrystal(<SettingsBlock {...props} state="saved" isLeaving />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('offers save and discard while dirty, and holds them while saving', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const { rerender } = renderWithCrystal(<SettingsBlock {...props} state="dirty" onSave={onSave} onDiscard={onDiscard} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onDiscard).toHaveBeenCalledOnce();
    rerender(<SettingsBlock {...props} state="saving" onSave={onSave} onDiscard={onDiscard} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Saving');
  });

  it('applies immediately without a save bar, and still says saving and saved', () => {
    const { rerender } = renderWithCrystal(<SettingsBlock {...props} saveMode="immediate" state="saving" />);
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Saving');
    rerender(<SettingsBlock {...props} saveMode="immediate" state="saved" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it.each(['at-rest', 'dirty', 'saving', 'saved'] satisfies SettingsState[])('has no axe violations %s', async (state) => {
    const { container } = renderWithCrystal(<SettingsBlock {...props} state={state} />);
    await expectNoAxeViolations(container);
  });

  it('has no axe violations while asking about leaving', async () => {
    renderWithCrystal(<SettingsBlock {...props} state="dirty" isLeaving />);
    await waitFor(() => { expect(screen.getByRole('alertdialog')).toBeInTheDocument(); });
    await expectNoAxeViolations(document.body);
  });
});
