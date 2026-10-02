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
          + '`AppShell` already renders a `<main>`, so a screen that always rendered one would '
          + 'give a product two whenever it used both: a landmark list with two identical '
          + 'entries and no way to tell which holds the content. A prop asking the consumer to '
          + 'remember would be easy to miss.\n\n'
          + 'The screen checks instead. `AppShell` publishes its scrolling region, and the '
          + 'element it publishes is its `<main>` (the same node). Standalone the screen is the '
          + 'main. Nested, it becomes a labelled `<section>`. Neither case asks the product to '
          + 'know.\n\n'
          + 'It draws no heading, because "the heading is the view name" says what the heading '
          + 'must say, not who renders it. `PageHeader` owns the `h1`.',
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
