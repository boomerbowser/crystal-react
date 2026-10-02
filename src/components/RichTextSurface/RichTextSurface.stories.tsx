import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { RichTextSurface, Mentions, type FormatAction } from './RichTextSurface.js';

const Bold = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" /></svg>
);
const Italic = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M14 5h-4M14 19h-4M13 5l-2 14" /></svg>
);

/* The editor (the document, the paste pipeline, the serialisation) is the
   product's, so the story uses a stand-in: a plain editable region with the
   name and the multi-line role a real editor would carry. */
const Editor = ({ label }: { label: string }) => (
  <div
    role="textbox"
    aria-multiline="true"
    aria-label={label}
    contentEditable
    suppressContentEditableWarning
    style={{ minBlockSize: 120, outline: 'none' }}
  >
    Figures are due the Wednesday before the board meets.
  </div>
);

const meta = {
  title: 'Inputs/RichTextSurface',
  component: RichTextSurface,
  parameters: {
    docs: {
      description: {
        component:
          'The surface around a rich text editor: a field (Crystal\'s `field` surface) with a '
          + 'formatting toolbar whose buttons say whether the selection already has their format. '
          + 'The editor itself is the product\'s. It owns the document, and whatever it renders '
          + 'puts a value in the form. `Mentions` is the suggestion list that follows a trigger '
          + 'character.',
      },
    },
  },
  args: { label: 'Note', description: 'Shown to everyone on the account.', children: <Editor label="Note" /> },
  render: function RichTextStory(args) {
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const actions: FormatAction[] = [
      { id: 'bold', label: 'Bold', icon: Bold, isActive: bold, onToggle: () => { setBold((on) => !on); } },
      { id: 'italic', label: 'Italic', icon: Italic, isActive: italic, onToggle: () => { setItalic((on) => !on); } },
    ];
    return (
      <div style={{ maxInlineSize: 520 }}>
        <RichTextSurface {...args} actions={args.isReadOnly ? [] : actions} />
      </div>
    );
  },
} satisfies Meta<typeof RichTextSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

/** With formatting controls that report their own state. */
export const Default: Story = {};
/** Read only: the surface without its toolbar. */
export const ReadOnly: Story = { args: { isReadOnly: true } };
/** Refused, with the reason in words. */
export const Invalid: Story = { args: { errorMessage: 'A note cannot be empty.' } };

/** The suggestions that follow "@", announced through the surface's own semantics. */
export const WithMentions: StoryObj<typeof Mentions> = {
  render: () => (
    <div style={{ maxInlineSize: 520 }}>
      <Mentions
        isOpen
        options={[{ value: 'ada', label: 'Ada Lovelace' }, { value: 'alan', label: 'Alan Turing' }]}
        highlightedValue="ada"
        onSelect={fn()}
      >
        <Editor label="Message" />
      </Mentions>
    </div>
  ),
};
