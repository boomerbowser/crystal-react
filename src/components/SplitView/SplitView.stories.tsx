import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitView } from './SplitView.js';

const meta = {
  title: 'Screens/SplitView',
  component: SplitView,
  parameters: {
    docs: {
      description: {
        component:
          'Three of the four states already exist in `Resizable`: React Aria\'s `useMove` '
          + 'behind a `role="separator"` carrying `aria-valuenow`, so the divider is resizable '
          + 'by keyboard rather than only by pointer, with a 44px target around a 4px grip.\n\n' /* crystal-allow-literal: prose about the target floor, not a value the component sets */
          + 'What this adds is `collapsed`, and it is a component rather than a prop because '
          + 'of what collapsing must do to the divider: a separator between one region and '
          + 'nothing announces a value it cannot change, and a keyboard user who lands on it '
          + 'can press arrow keys at it forever. So collapsing removes it.',
      },
    },
  },
  args: { 'aria-label': 'Resize the list' },
} satisfies Meta<typeof SplitView>;

export default meta;
type Story = StoryObj<typeof meta>;

const pane = (what: string) => <div style={{ padding: 16 }}>{what}</div>;

export const Default: Story = {
  args: { defaultSize: 220, secondary: pane('Detail'), children: pane('List') },
};

export const Collapsed: Story = {
  args: { collapse: 'secondary', secondary: pane('Detail'), children: pane('List') },
};
