import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { only } from '../../.storybook/environment.js';
import { RichTextEditor, type RichTextEditorVariant } from './RichTextEditor.js';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl.js';

/* A document that uses every part of the vocabulary, so a reviewer sees each
   block type and mark rendered by the surface the way `Prose` publishes it. */
const DOCUMENT = `
<h2>Harbour board, October</h2>
<p>Figures are due the <strong>Wednesday</strong> before the board meets. The <em>pilot boat</em> budget is <u>under review</u>, and the old mooring fees are <s>£40</s> £45.</p>
<h3>Before the meeting</h3>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Send the minutes</p></li>
  <li data-type="taskItem" data-checked="false"><p>Confirm the venue</p></li>
  <li data-type="taskItem" data-checked="false"><p>Ask finance for Q3 figures</p></li>
</ul>
<h3>Agenda</h3>
<ol>
  <li><p>Apologies</p></li>
  <li><p>The <mark>dredging tender</mark>, with the costs in <a href="https://example.org/tender">the tender pack</a></p>
    <ul><li><p>Two bids received</p></li><li><p>One withdrawn</p></li></ul>
  </li>
  <li><p>Any other business</p></li>
</ol>
<blockquote><p>A harbour is only as good as the water in it.</p></blockquote>
<p>Water depth at low tide: 4.2 m (H<sub>2</sub>O, of course), and the 10<sup>th</sup> buoy needs paint. Press <code>Alt+F10</code> to reach the toolbar.</p>
<pre><code>depth = tide.low - silt.estimate</code></pre>
`;

const meta = {
  title: 'Inputs/RichTextEditor',
  component: RichTextEditor,
  parameters: {
    docs: {
      description: {
        component:
          'Crystal\'s rich text surface with TipTap bound to it, from `@crystal-ui/react/editor`. '
          + 'TipTap is an optional peer dependency, so a product that never imports this never '
          + 'bundles an editor. It offers the whole format vocabulary: a block-type menu, the marks '
          + '(bold, italic, underline, strikethrough, inline code, highlight, link, subscript, '
          + 'superscript), bulleted, numbered and checklist lists, indent and outdent, undo and '
          + 'redo.\n\n'
          + 'Formatting state follows the caret. A change made by a shortcut is announced, because '
          + 'the toolbar is out of reach while typing. Alt+F10 moves focus to the toolbar, and '
          + 'Escape returns it. Markdown typed at the start of a line (`## `, `- `, `1. `, `[ ] `, '
          + '`> `) becomes the block it means.\n\n'
          + 'On a touch screen the toolbar moves below the text and sticks above the on-screen '
          + 'keyboard. Indent, outdent, undo and redo are on it because a phone keyboard has none '
          + 'of their keys. Selecting text shows a Frost selection toolbar with the commonest marks.',
      },
    },
  },
  args: {
    label: 'Board notes',
    description: 'Shared with everyone on the harbour board.',
    placeholder: 'Write the notes, or type ## for a heading',
    onChange: fn(),
  },
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EveryFormat: Story = { args: { defaultValue: DOCUMENT } };

export const Empty: Story = {};

/* A product offers the subset its documents need: a comment box has no
   headings, no code and no history buttons. */
export const ASubset: Story = {
  args: {
    label: 'Comment',
    description: undefined,
    formats: ['bold', 'italic', 'strike', 'link', 'bullet-list', 'checklist'],
    defaultValue: '<p>Looks right to me. Two things:</p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Check the tide table</p></li></ul>',
  },
};

/* The touch layout on any screen: the toolbar below the text. */
export const ToolbarBelow: Story = {
  args: { toolbarPlacement: 'bottom', defaultValue: DOCUMENT },
};

export const ReadOnly: Story = { args: { isReadOnly: true, defaultValue: DOCUMENT } };

export const Invalid: Story = {
  args: { isInvalid: true, errorMessage: 'The notes need a heading before they are sent.', defaultValue: '<p>Draft</p>' },
};

/* The same notes, written as Markdown. */
const MARKDOWN = `## Harbour board, October

Figures are due the **Wednesday** before the board meets. The *pilot boat* budget is ==under review==, and the old mooring fees are ~~£40~~ £45.

### Before the meeting

- [x] Send the minutes
- [ ] Confirm the venue
- [ ] Ask finance for Q3 figures

> Shared with everyone on the harbour board.
`;

/** A page in the manner of Notion: no fixed toolbar. Type "/" at the start of
 *  a line, or after a space, for a menu of blocks; keep typing to filter it
 *  ("/head"), arrows to move, Enter to apply, Escape to leave the "/" as
 *  typed. Select text for the selection toolbar. Written in Markdown. */
export const Document: Story = {
  args: { variant: 'document', contentFormat: 'markdown', defaultValue: MARKDOWN },
};

/** Markdown in and out: the document starts as Markdown, and every change is
 *  shown below as the Markdown it would save. Underline, subscript and
 *  superscript are not offered, because Markdown cannot write them. */
export const MarkdownInAndOut: Story = {
  args: { contentFormat: 'markdown', defaultValue: MARKDOWN },
  render: function MarkdownStory(args) {
    const [markdown, setMarkdown] = useState(MARKDOWN);
    return (
      <div style={{ display: 'grid', gap: 'var(--cr-spacing-md)' }}>
        <RichTextEditor {...only(args)} onChange={(value) => { setMarkdown(value.markdown); }} />
        <pre aria-label="The Markdown it saves" style={{ margin: 0, padding: 'var(--cr-spacing-md)', whiteSpace: 'pre-wrap', fontSize: 'var(--cr-text-caption-size)' }} className="cr-haze">{markdown}</pre>
      </div>
    );
  },
};

/** The layout can change while the editor is open; the document stays as it
 *  is. A product can offer the plain toolbar to some people and the page to
 *  others, or switch when the editor is given more room. */
export const SwitchingLayouts: Story = {
  args: { contentFormat: 'markdown', defaultValue: MARKDOWN },
  render: function SwitchingStory(args) {
    const [variant, setVariant] = useState<RichTextEditorVariant>('toolbar');
    return (
      <div style={{ display: 'grid', gap: 'var(--cr-spacing-md)' }}>
        <SegmentedControl
          label="Layout"
          value={variant}
          onChange={(value) => { setVariant(value as RichTextEditorVariant); }}
          options={[{ value: 'toolbar', label: 'Toolbar' }, { value: 'document', label: 'Document' }]}
        />
        <RichTextEditor {...only(args)} variant={variant} />
      </div>
    );
  },
};
