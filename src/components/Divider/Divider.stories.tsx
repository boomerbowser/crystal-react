import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Divider } from './Divider.js';
import { Stack, Group } from '../Stack/Stack.js';

const meta = {
  title: 'Layout/Divider',
  component: Divider,
  parameters: {
    docs: {
      description: {
        component:
          'A hairline in Crystal\'s edge colour, never a heavy rule, so it does not compete '
          + 'with the content it separates.\n\n'
          + 'The accessibility behaviour splits two ways, and both halves are needed. An '
          + 'unlabelled divider is decoration. The headings either side already describe the '
          + 'boundary, so announcing "separator" is noise, and it is `aria-hidden`. A labelled '
          + 'one names the boundary, so it is a real separator with an accessible name. The name '
          + 'comes from `aria-labelledby`, because `separator` is not a name-from-content role '
          + 'and a label left as a child text node is announced as nothing.',
      },
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  render: (args) => (
    <Stack gap="lg">
      <p style={{ margin: 0 }}>Above the rule.</p>
      <Divider {...only(args)} />
      <p style={{ margin: 0 }}>Below it.</p>
    </Stack>
  ),
};

export const Labelled: Story = {
  render: () => (
    <Stack gap="lg">
      <p style={{ margin: 0 }}>Recent</p>
      <Divider label="Earlier this year" />
      <p style={{ margin: 0 }}>Older</p>
      <Divider label="Archive" labelPosition="center" />
      <p style={{ margin: 0 }}>Oldest</p>
    </Stack>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Group gap="md" align="stretch">
      <span>Drafts</span>
      <Divider orientation="vertical" />
      <span>Published</span>
      <Divider orientation="vertical" />
      <span>Archived</span>
    </Group>
  ),
};
