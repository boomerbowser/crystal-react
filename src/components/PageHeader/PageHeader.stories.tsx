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
          + 'Three components bear on the `h1`. `Screen` says "the heading is the view '
          + 'name", `Result` takes a `headingLevel`, and this says it contains the h1. Read '
          + 'together: the page header owns it, the screen draws no heading, and a '
          + 'state screen takes level 1 only because it has replaced the view and there is no '
          + 'header left.\n\n'
          + 'Condensing makes the header take less room and removes nothing the reader needs. '
          + 'On scroll the band tightens and the description goes. The title, breadcrumbs and '
          + 'actions stay. A header that dropped its actions once the reader scrolled would '
          + 'remove the controls at the moment they went looking for them.',
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
