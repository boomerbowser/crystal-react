import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { EditorBlock, type EditorState } from './EditorBlock.js';
import type { FormatAction } from '../RichTextSurface/RichTextSurface.js';
import { RichTextEditor } from '../../editor/RichTextEditor.js';

const Bold = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" /></svg>
);
const Italic = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M14 5h-4M14 19h-4M13 5l-2 14" /></svg>
);

/* The engine belongs to the product, so the story stands one in: an editable
   region with the name and role a real editor carries. Its Ctrl+B or Cmd+B
   toggles bold without the toolbar, which is the case the block's announcement
   is for, and typing in it makes the document dirty. */
function Working({ initial = 'at-rest' as EditorState }) {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [state, setState] = useState<EditorState>(initial);
  const actions: FormatAction[] = [
    { id: 'bold', label: 'Bold', icon: Bold, isActive: bold, onToggle: () => { setBold((on) => !on); } },
    { id: 'italic', label: 'Italic', icon: Italic, isActive: italic, onToggle: () => { setItalic((on) => !on); } },
  ];
  return (
    <EditorBlock
      label="Board notes"
      actions={actions}
      state={state}
      onSave={() => { setState('saving'); setTimeout(() => { setState('saved'); }, 600); }}
    >
      <div
        role="textbox"
        aria-multiline="true"
        aria-label="Board notes"
        contentEditable
        suppressContentEditableWarning
        style={{ minBlockSize: 120, outline: 'none', fontWeight: bold ? 700 : undefined, fontStyle: italic ? 'italic' : undefined }}
        onInput={() => { setState('dirty'); }}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') { event.preventDefault(); setBold((on) => !on); }
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') { event.preventDefault(); setItalic((on) => !on); }
        }}
      >
        Figures are due the Wednesday before the board meets.
      </div>
    </EditorBlock>
  );
}

const meta = {
  title: 'Blocks/EditorBlock',
  component: EditorBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"The toolbar is a real toolbar with one tab stop; formatting state is announced."\n\n'
          + 'React Aria\'s toolbar is one tab stop with the arrow keys along it, and its controls are '
          + '`aria-pressed`. A format changed from the text with a shortcut such as Ctrl+B is '
          + 'announced politely, since the toolbar is out of reach there. Save state is in words '
          + 'beside Save, announced as it changes. The shortcut is printed and describes the button. '
          + 'A Haze surface in a Frost frame.',
      },
    },
  },
  args: { label: 'Board notes', children: null },
  decorators: [(Story) => <div style={{ maxInlineSize: 640 }}><Story /></div>],
  render: () => <Working />,
} satisfies Meta<typeof EditorBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Dirty: Story = { render: () => <Working initial="dirty" /> };
export const Saving: Story = { render: () => <Working initial="saving" /> };
export const Saved: Story = { render: () => <Working initial="saved" /> };

/** The editor block with Crystal's bound editor, `RichTextEditor` from
 *  `@crystal-ui/react/editor`, given as `editor`: its own toolbar, selection
 *  toolbar and announcements, with the block's frame and save state around
 *  them. An edit makes the document dirty; Save, or Ctrl+S or Cmd+S, saves it. */
export const WithTheBoundEditor: Story = {
  render: function WithTheBoundEditorStory() {
    const [state, setState] = useState<EditorState>('at-rest');
    return (
      <EditorBlock
        label="Board notes"
        state={state}
        onSave={() => { setState('saving'); setTimeout(() => { setState('saved'); }, 600); }}
        editor={(
          <RichTextEditor
            label="Board notes"
            defaultValue="<h2>Harbour board, October</h2><p>Figures are due the <strong>Wednesday</strong> before the board meets.</p>"
            onChange={() => { setState('dirty'); }}
          />
        )}
      />
    );
  },
};
