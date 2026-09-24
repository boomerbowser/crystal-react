import type { Meta, StoryObj } from '@storybook/react-vite';
import { Workspace } from './Workspace.js';

const panes = [
  { id: 'files', label: 'Files', children: <div style={{ padding: 16 }}>Files</div> },
  { id: 'editor', label: 'Editor', children: <div style={{ padding: 16 }}>Editor</div> },
  { id: 'preview', label: 'Preview', children: <div style={{ padding: 16 }}>Preview</div> },
];

const meta = {
  title: 'Screens/Workspace',
  component: Workspace,
  parameters: {
    docs: {
      description: {
        component:
          '"Each pane is a labelled region; focus order follows the visual order."\n\n'
          + '`label` is required on every pane: a landmark list reading "region, region, '
          + 'region" gives the reader three entries and no way to choose between them.\n\n'
          + 'Focus order following visual order is the clause no type can enforce and no '
          + 'jsdom test can see, because both orders are geometry — the tab order comes from '
          + 'the document and the visual order from the boxes, and a `grid-column`, an '
          + '`order` or a `direction` moves one without the other. The behaviour gate walks '
          + 'the tab order and compares it against the rendered positions.\n\n'
          + 'Focus mode removes the other panes rather than shrinking them: a pane squeezed '
          + 'to a sliver is still a tab stop, still read aloud, and still catches a click.',
      },
    },
  },
  args: { panes },
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FocusMode: Story = { args: { focused: 'editor' } };
