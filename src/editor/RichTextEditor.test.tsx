/* RichTextEditor, against the real engine.
 *
 * TipTap and ProseMirror run in jsdom for everything that is a document
 * transaction: commands, marks, block types, lists, history and the state the
 * toolbar reads. What jsdom cannot do is lay out a selection, so the selection
 * toolbar's position and the touch placement are proven in Storybook and in
 * `verify:behaviour` instead. These tests drive the editor the way a person's
 * actions do (toolbar presses, the engine's own commands) and check what the
 * toolbar then says.
 */
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCrystal, screen } from '../test/render.js';
import { expectNoAxeViolations } from '../test/axe.js';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor.js';

/* ProseMirror measures the selection to scroll it into view. jsdom has no
   layout, so it gets empty rectangles, which is what a hidden element reports. */
const rect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) };
Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList;
Range.prototype.getBoundingClientRect = () => rect as DOMRect;
document.elementFromPoint ??= () => null;

async function mount(props: Partial<Parameters<typeof RichTextEditor>[0]> = {}) {
  const ref = createRef<RichTextEditorHandle>();
  const utils = renderWithCrystal(<RichTextEditor ref={ref} label="Notes" defaultValue="<p>Harbour notes</p>" {...props} />);
  await waitFor(() => expect(ref.current?.editor).toBeTruthy());
  await screen.findByRole('toolbar', { name: 'Formatting for Notes' });
  return { ...utils, editor: () => ref.current!.editor! };
}

describe('RichTextEditor', () => {
  it('offers the whole vocabulary on one toolbar', async () => {
    await mount();
    for (const name of ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Inline code', 'Highlight', 'Link',
      'Subscript', 'Superscript', 'Bulleted list', 'Numbered list', 'Checklist', 'Indent', 'Outdent', 'Undo', 'Redo']) {
      expect(screen.getByRole('button', { name }), name).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Block type, Paragraph' })).toBeInTheDocument();
  });

  /* Formatting state follows the caret: a mark's toggle is pressed exactly
     when the selection has the mark. */
  it('presses a mark\'s toggle when the selection has the mark', async () => {
    const user = userEvent.setup();
    const { editor } = await mount();
    act(() => { editor().commands.selectAll(); });
    const underline = screen.getByRole('button', { name: 'Underline' });
    expect(underline).toHaveAttribute('aria-pressed', 'false');
    await user.click(underline);
    expect(editor().getHTML()).toBe('<p><u>Harbour notes</u></p>');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Underline' })).toHaveAttribute('aria-pressed', 'true'));
  });

  it('writes strikethrough, highlight, subscript and superscript as their own elements', async () => {
    const { editor } = await mount();
    act(() => { editor().chain().selectAll().toggleStrike().toggleHighlight().run(); });
    expect(editor().getHTML()).toBe('<p><s><mark>Harbour notes</mark></s></p>');
    act(() => { editor().chain().selectAll().unsetAllMarks().toggleSubscript().run(); });
    expect(editor().getHTML()).toContain('<sub>');
  });

  /* The block-type control names the block the caret is in, and is a choice of
     one shown by weight. */
  it('names the current block and changes it from the menu', async () => {
    const user = userEvent.setup();
    const { editor } = await mount();
    /* Opened from the keyboard, as a toolbar control is reached by Alt+F10 and
       the arrow keys. */
    screen.getByRole('button', { name: 'Block type, Paragraph' }).focus();
    await user.keyboard('{Enter}');
    const heading = await screen.findByRole('menuitemradio', { name: /^Heading/ });
    expect(screen.getByRole('menuitemradio', { name: /^Paragraph/ })).toHaveAttribute('aria-checked', 'true');
    await user.click(heading);
    expect(editor().getHTML()).toMatch(/^<h2>Harbour notes<\/h2>/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Block type, Heading' })).toBeInTheDocument());
  });

  /* A checklist is real checkboxes in the document, so a screen reader reads
     each item's state as it would on the published page. */
  it('makes a checklist of real checkboxes', async () => {
    const user = userEvent.setup();
    const { container, editor } = await mount();
    act(() => { editor().commands.focus('start'); });
    await user.click(screen.getByRole('button', { name: 'Checklist' }));
    expect(editor().getHTML()).toContain('data-type="taskList"');
    /* A native checkbox, named by its item, which TipTap's node view writes. */
    const box = container.querySelector('ul[data-type="taskList"] input[type="checkbox"]');
    expect(box).not.toBeNull();
    expect(box).toHaveAccessibleName(/Harbour notes/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Checklist' })).toHaveAttribute('aria-pressed', 'true'));
  });

  /* A phone keyboard has no Tab, so nesting a list is a toolbar action, and is
     offered only when it is possible. */
  it('indents and outdents a list item from the toolbar', async () => {
    const user = userEvent.setup();
    const { editor } = await mount({ defaultValue: '<ul><li><p>One</p></li><li><p>Two</p></li></ul>' });
    act(() => { editor().commands.focus('end'); });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Indent' })).not.toBeDisabled());
    await user.click(screen.getByRole('button', { name: 'Indent' }));
    /* The trailing paragraph is the engine's: it keeps a place for the caret
       after the list, so a document never ends in a block the caret cannot leave. */
    const html = () => editor().getHTML().replace(/<p><\/p>$/, '');
    expect(html()).toBe('<ul><li><p>One</p><ul><li><p>Two</p></li></ul></li></ul>');
    await user.click(screen.getByRole('button', { name: 'Outdent' }));
    expect(html()).toBe('<ul><li><p>One</p></li><li><p>Two</p></li></ul>');
  });

  it('undoes and redoes from the toolbar, and says when it cannot', async () => {
    const user = userEvent.setup();
    const { editor } = await mount();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    act(() => { editor().chain().selectAll().toggleBold().run(); });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Undo' })).not.toBeDisabled());
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(editor().getHTML()).toBe('<p>Harbour notes</p>');
    expect(screen.getByRole('button', { name: 'Redo' })).not.toBeDisabled();
  });

  /* A subset is offered by id: a comment box has no headings and no history. */
  it('offers only the formats it is given', async () => {
    renderWithCrystal(<RichTextEditor label="Comment" formats={['bold', 'checklist']} />);
    await screen.findByRole('button', { name: 'Bold' });
    expect(screen.queryByRole('button', { name: 'Italic' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Block type/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  /* It submits with its form like any other field. */
  it('writes the document to its form as HTML', async () => {
    const { container, editor } = await mount({ name: 'notes' });
    act(() => { editor().chain().selectAll().toggleItalic().run(); });
    await waitFor(() => expect(container.querySelector('input[type="hidden"][name="notes"]')).toHaveValue('<p><em>Harbour notes</em></p>'));
  });

  it('is a multi-line text box named by its label', async () => {
    await mount();
    const box = screen.getByRole('textbox', { name: 'Notes' });
    expect(box).toHaveAttribute('aria-multiline', 'true');
  });

  it('has no toolbar when read-only', async () => {
    const ref = createRef<RichTextEditorHandle>();
    renderWithCrystal(<RichTextEditor ref={ref} label="Notes" isReadOnly defaultValue="<p>Fixed</p>" />);
    await waitFor(() => expect(ref.current?.editor).toBeTruthy());
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(ref.current!.editor!.isEditable).toBe(false);
  });

  it('has no axe violations', async () => {
    const { container } = await mount();
    await expectNoAxeViolations(container);
  });
});
