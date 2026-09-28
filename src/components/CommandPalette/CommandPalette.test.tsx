import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor, within } from '../../test/render.js';
import { CommandPalette, groupCommands, type Command } from './CommandPalette.js';

/* A closing scrim withdraws on Crystal's 650ms departure clock (`mirage-out`),
   and `AnimatePresence` unmounts only after it. Testing Library waits one second
   by default, which the hand-written opacity fade used to fit inside and the
   real departure does not — so the exits wait for the departure, not for luck. */
const DEPARTURE = 2500;
import { Button } from '../Button/Button.js';

const commands: Command[] = [
  { id: 'open', label: 'Open file', shortcut: '⌘O', section: 'File' },
  { id: 'save', label: 'Save', shortcut: '⌘S', section: 'File' },
  { id: 'theme', label: 'Toggle dark mode', section: 'View' },
  { id: 'help', label: 'Keyboard shortcuts' },
];

function Harness({ onAction = () => {} }: { onAction?: (id: unknown) => void }): React.JSX.Element {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => { setOpen(true); }}>Open the palette</Button>
      <CommandPalette
        commands={commands}
        isOpen={isOpen}
        onOpenChange={setOpen}
        onAction={(id) => { onAction(id); setOpen(false); }}
      />
    </>
  );
}

describe('CommandPalette', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <CommandPalette commands={commands} isOpen onAction={() => {}} />,
    );
    await expectNoAxeViolations(container);
  });

  it('renders nothing when closed', () => {
    renderWithCrystal(<CommandPalette commands={commands} onAction={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a named dialog holding a search field and a list', () => {
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: 'Run a command' });
    expect(within(dialog).getByRole('searchbox', { name: 'Run a command' })).toBeInTheDocument();
    expect(within(dialog).getByRole('listbox')).toBeInTheDocument();
  });

  it('lists every command, grouped', () => {
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByRole('group', { name: 'File' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument();
  });

  /* The requirement every hand-built palette breaks. Move real focus into the
     list and typing stops working, so the user has to arrow back up to keep
     searching. The caret stays put and the row is named instead. */
  it('never moves focus out of the search field', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    const search = screen.getByRole('searchbox');
    await user.click(search);
    await user.keyboard('{ArrowDown}');
    expect(search).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(search).toHaveFocus();
  });

  it('names the highlighted row with aria-activedescendant', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    const search = screen.getByRole('searchbox');
    await user.click(search);
    await user.keyboard('{ArrowDown}');
    await waitFor(() => { expect(search.getAttribute('aria-activedescendant')).toBeTruthy(); });
    const active = document.getElementById(search.getAttribute('aria-activedescendant')!);
    expect(active).toHaveAttribute('role', 'option');
  });

  it('filters as you type', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    await user.type(screen.getByRole('searchbox'), 'save');
    await waitFor(() => { expect(screen.getAllByRole('option')).toHaveLength(1); });
    expect(screen.getByRole('option', { name: /Save/ })).toBeInTheDocument();
  });

  /* Accent-insensitive, because `toLowerCase().includes` is the reflex and it
     fails for every reader whose language writes a letter more than one way. */
  it('matches without regard to case or accent', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <CommandPalette commands={[{ id: 'e', label: 'Exporter le résumé' }]} isOpen onAction={() => {}} />,
    );
    await user.type(screen.getByRole('searchbox'), 'RESUME');
    await waitFor(() => { expect(screen.getAllByRole('option')).toHaveLength(1); });
  });

  /* Three different answers to "why is this list empty", and a palette that gives
     one of them for all three is a palette nobody can debug. */
  it('says nothing matched, rather than showing an empty list', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    await waitFor(() => { expect(screen.queryByRole('option', { name: /Save/ })).toBeNull(); });
    expect(screen.getByRole('status')).toHaveTextContent('No matching commands');
    /* Not "no options at all": React Aria wraps whatever `renderEmptyState`
       returns in a `role="option"` of its own, to keep the listbox structurally
       valid — a listbox may hold only options and groups. That wrapper carries
       no id and the collection is empty, so nothing arrows onto it. What is
       asserted is what matters: no command is listed, and the reason is said. */
    expect(screen.getByRole('listbox')).toHaveAttribute('data-empty', 'true');
  });

  it('says it is still loading, which is a different thing', () => {
    renderWithCrystal(
      <CommandPalette commands={[]} isOpen isLoading onAction={() => {}} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading commands');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('runs the command that was chosen', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={onAction} />);
    await user.click(screen.getByRole('option', { name: /Toggle dark mode/ }));
    expect(onAction).toHaveBeenCalledWith('theme');
  });

  it('runs the highlighted command on Enter', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={onAction} />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAction).toHaveBeenCalledOnce();
  });

  /* A palette is a way of doing things, not a list you pick from: nothing stays
     selected afterwards, so nothing is marked as chosen. */
  it('selects nothing, and marks nothing with a check', () => {
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    for (const option of screen.getAllByRole('option')) {
      expect(option.getAttribute('aria-selected')).toBeNull();
      expect(option.textContent).not.toMatch(/[✓✔]/);
    }
  });

  it('announces a shortcut as a shortcut', () => {
    renderWithCrystal(<CommandPalette commands={commands} isOpen onAction={() => {}} />);
    const option = screen.getByRole('option', { name: /Open file/ });
    expect(within(option).getByText('⌘O').tagName).toBe('KBD');
  });

  it('skips a disabled command', () => {
    renderWithCrystal(
      <CommandPalette
        commands={[{ id: 'a', label: 'Allowed' }, { id: 'b', label: 'Blocked', isDisabled: true }]}
        isOpen
        onAction={() => {}}
      />,
    );
    expect(screen.getByRole('option', { name: 'Blocked' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('closes on Escape and returns focus to whatever opened it', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open the palette' });
    await user.click(opener);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); }, { timeout: DEPARTURE });
    await waitFor(() => { expect(opener).toHaveFocus(); }, { timeout: DEPARTURE });
  });
});

describe('groupCommands', () => {
  /* The registry's order is a product decision — most-used first, usually — so
     the grouping preserves it rather than sorting alphabetically and quietly
     overruling whoever wrote it. */
  it('keeps the registry’s order and puts ungrouped commands first', () => {
    const groups = groupCommands([
      { id: 'a', label: 'A', section: 'Zulu' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C', section: 'Alpha' },
      { id: 'd', label: 'D', section: 'Zulu' },
    ]);
    expect(groups.map((group) => group.section)).toEqual([undefined, 'Zulu', 'Alpha']);
    expect(groups[1]?.commands.map((command) => command.id)).toEqual(['a', 'd']);
  });

  it('returns nothing for an empty registry', () => {
    expect(groupCommands([])).toEqual([]);
  });
});
