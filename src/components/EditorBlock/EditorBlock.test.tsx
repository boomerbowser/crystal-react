import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor } from '../../test/render.js';
import { EditorBlock, type EditorState } from './EditorBlock.js';

const B = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h6a4 4 0 010 8H7zM7 13h7a4 4 0 010 8H7z" /></svg>;
const I = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5h8M6 19h8M14 5l-4 14" /></svg>;

/* An engine of sorts: bold and italic are real state, and Ctrl+B in the text
   toggles bold without the toolbar, as a real editor's shortcut would. */
function Harness({ state = 'at-rest', onSave = () => {} }: { state?: EditorState; onSave?: () => void }) {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  return (
    <>
      <button type="button">Before</button>
      <EditorBlock
        label="Notes"
        state={state}
        onSave={onSave}
        actions={[
          { id: 'bold', label: 'Bold', icon: B, isActive: bold, onToggle: () => { setBold((on) => !on); } },
          { id: 'italic', label: 'Italic', icon: I, isActive: italic, onToggle: () => { setItalic((on) => !on); } },
        ]}
      >
        <div
          role="textbox"
          aria-multiline="true"
          aria-label="Notes"
          contentEditable
          suppressContentEditableWarning
          tabIndex={0}
          onKeyDown={(event) => { if (event.ctrlKey && event.key === 'b') { event.preventDefault(); setBold((on) => !on); } }}
        >
          Draft
        </div>
      </EditorBlock>
    </>
  );
}

describe('EditorBlock', () => {
  /* The opinion, half one: a real toolbar with one tab stop. */
  it('gives the toolbar one tab stop, with the arrow keys moving along it', async () => {
    renderWithCrystal(<Harness />);
    screen.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveFocus();
    expect(screen.getByRole('toolbar')).toHaveAccessibleName('Formatting for Notes');
  });

  /* Half two: formatting state is announced — pressed on the toolbar… */
  it('says a format\'s state on its control', async () => {
    renderWithCrystal(<Harness />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(bold);
    expect(bold).toHaveAttribute('aria-pressed', 'true');
  });

  /* …and in words when it changes while the reader is in the text. */
  it('says a format change made from the text, where the toolbar cannot', async () => {
    renderWithCrystal(<Harness />);
    const text = screen.getByRole('textbox', { name: 'Notes' });
    text.focus();
    await userEvent.keyboard('{Control>}b{/Control}');
    await waitFor(() => { expect(screen.getByRole('status')).toHaveTextContent('Bold on'); });
    await userEvent.keyboard('{Control>}b{/Control}');
    await waitFor(() => { expect(screen.getByRole('status')).toHaveTextContent('Bold off'); });
  });

  it('leaves a toolbar change to aria-pressed rather than saying it twice', async () => {
    renderWithCrystal(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('shows and says the save state as it changes', () => {
    const { rerender } = renderWithCrystal(<Harness />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    rerender(<Harness state="dirty" />);
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
    rerender(<Harness state="saving" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving');
    rerender(<Harness state="saved" />);
    expect(screen.getAllByText('Saved')).toHaveLength(2);
  });

  it('saves with the shortcut while there is something to save, and not otherwise', async () => {
    const onSave = vi.fn();
    const { rerender } = renderWithCrystal(<Harness state="saved" onSave={onSave} />);
    screen.getByRole('textbox', { name: 'Notes' }).focus();
    await userEvent.keyboard('{Control>}s{/Control}');
    expect(onSave).not.toHaveBeenCalled();
    rerender(<Harness state="dirty" onSave={onSave} />);
    await userEvent.keyboard('{Control>}s{/Control}');
    expect(onSave).toHaveBeenCalledOnce();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toHaveAccessibleDescription('Ctrl S');
  });

  it.each(['at-rest', 'dirty', 'saving', 'saved'] satisfies EditorState[])('has no axe violations %s', async (state) => {
    const { container } = renderWithCrystal(<Harness state={state} />);
    await expectNoAxeViolations(container);
  });
});
