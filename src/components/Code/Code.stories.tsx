import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Code } from './Code.js';

const meta = {
  title: 'Data display/Code',
  component: Code,
  parameters: {
    docs: {
      description: {
        component:
          'Monospace content that is never feathered, because code must stay exact — a softened '
          + 'edge around a fragment of syntax reads as imprecision in the thing being quoted. So '
          + 'Code takes a canvas fill and an edge rim, the flattest surface Crystal has. A block is '
          + 'a tab stop with a Resin scrollbar: a sample wider than its column scrolls, and a '
          + 'scroll container with nothing focusable in it cannot be reached without a pointer. For '
          + 'a titled sample with a named region and a copy control in a header, use `CodeBlock`.',
      },
    },
  },
  args: { children: 'npm i @crystal-ui/react' },
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inline, inside a line of prose. The 14px radius keeps it a rectangle with
 *  softened corners; the content radius would round it into a pill at this
 *  height, and the leading stays the prose's so the line's rhythm is unchanged. */
export const Inline: Story = {
  render: (args) => (
    <p style={{ maxInlineSize: 'var(--cr-layout-reading-max)' }}>
      Install it with <Code {...only(args)} />, then wrap your application in{' '}
      <Code {...only(args)}>CrystalProvider</Code>.
    </p>
  ),
};

export const Block: Story = {
  args: {
    block: true,
    children: 'import { CrystalProvider } from \'@crystal-ui/react\';\n\nexport const App = () => <CrystalProvider>…</CrystalProvider>;',
  },
};

/** The catalogue's `with-copy` state on a bare block: over the sample rather than
 *  above it, so the code keeps its full width. */
export const WithCopy: Story = {
  args: {
    block: true,
    copyable: true,
    copyLabel: 'Copy the install command',
    children: 'npm i @crystal-ui/react @crystal-ui/core',
  },
};
