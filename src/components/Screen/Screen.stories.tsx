import type { Meta, StoryObj } from '@storybook/react-vite';
import { Screen } from './Screen.js';
import { PageHeader } from '../PageHeader/PageHeader.js';
import { StatusBar } from '../StatusBar/StatusBar.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/Screen',
  component: Screen,
  parameters: {
    docs: {
      description: {
        component:
          '"One `main` per view; the heading is the view name."\n\n'
          + 'The first clause is the whole difficulty. `AppShell` already renders a `<main>`, '
          + 'so a screen that always rendered one would give a product two the moment it used '
          + 'both — a landmark list with two identical entries and no way to tell which holds '
          + 'the content. A prop asking the consumer to remember would put the failure where '
          + 'nobody looks.\n\n'
          + 'So the screen asks. `AppShell` publishes its scrolling region, and the element it '
          + 'publishes *is* its `<main>` — the same node, not a proxy. Standalone the screen '
          + 'is the main; nested it becomes a labelled `<section>`. Neither case asks the '
          + 'product to know.\n\n'
          + 'It draws no heading: "the heading is the view name" says what the heading must '
          + 'say, not who renders it. `PageHeader` owns the `h1`.',
      },
    },
  },
  args: { label: 'Reports' },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: <PageHeader title="Reports" description="Everything you have built." actions={<Button>New report</Button>} />,
    children: <p style={{ padding: 24 }}>The reports.</p>,
    chrome: <StatusBar status="All changes saved" />,
  },
};
