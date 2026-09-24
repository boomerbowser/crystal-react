import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from './PageHeader.js';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Screens/PageHeader',
  component: PageHeader,
  parameters: {
    docs: {
      description: {
        component:
          '"Contains the h1; breadcrumbs are a navigation landmark."\n\n'
          + 'The `h1` settles a three-way contest. `Screen` says "the heading is the view '
          + 'name", `Result` takes a `headingLevel`, and this says it contains the h1. Read '
          + 'together: the page header owns it, the screen draws no heading at all, and a '
          + 'state screen takes level 1 only because it has replaced the view and there is no '
          + 'header left.\n\n'
          + 'Condensing is the header taking less room, never taking things away. On scroll '
          + 'the band tightens and the description goes; the title, breadcrumbs and actions '
          + 'stay. A header that dropped its actions once the reader scrolled would remove '
          + 'the controls at the moment they went looking for them.',
      },
    },
  },
  args: { title: 'Q3 revenue' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    description: 'Everything booked between July and September.',
    breadcrumbs: (
      <Breadcrumbs items={[{ id: 'reports', label: 'Reports', href: '/reports' }, { id: 'q3', label: 'Q3' }]} />
    ),
    actions: <Button>Export</Button>,
  },
};

export const Condensed: Story = {
  args: {
    description: 'Everything booked between July and September.',
    actions: <Button>Export</Button>,
    isCondensed: true,
  },
};
