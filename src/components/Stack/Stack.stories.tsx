import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Group } from './Stack.js';
import { Card } from '../Card/Card.js';

const meta = {
  title: 'Layout/Stack and Group',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          'Two names for one box turned ninety degrees. Stack arranges vertically with one '
          + 'spacing value; Group arranges horizontally, wraps by default, and takes alignment.\n\n'
          + 'Both are presentational and render a `div`. Pass `as` when the grouping is real, such as a '
          + '`ul` or a `nav`, rather than nesting a meaningful element inside a meaningless one. A '
          + 'layout component that introduces a landmark tells assistive technology about a '
          + 'grouping that exists only visually.\n\n'
          + 'The gap comes from Crystal\'s spacing scale. `space` is the density-aware padding '
          + 'step rather than a step on the scale, which is what a stack matching a card\'s own '
          + 'padding wants.',
      },
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  args: { gap: 'lg' },
  render: (args) => (
    <Stack {...args}>
      <Card aria-label="One">First</Card>
      <Card aria-label="Two">Second</Card>
      <Card aria-label="Three">Third</Card>
    </Stack>
  ),
};

/** Every step, so the rhythm is visible rather than described. */
export const TheScale: Story = {
  render: () => (
    <Stack gap="lg">
      {(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((step) => (
        <Group key={step} gap={step}>
          <code style={{ minWidth: '44px' /* crystal-allow-literal: story label column, so the swatches line up */ }}>{step}</code>
          {[0, 1, 2, 3].map((n) => (
            <span
              key={n}
              style={{
                display: 'block', width: 'var(--cr-spacing-lg)', height: 'var(--cr-spacing-lg)',
                borderRadius: 'var(--cr-spacing-2xs)', background: 'var(--cr-primary)',
              }}
            />
          ))}
        </Group>
      ))}
    </Stack>
  ),
};

/** Horizontal, wrapping, with alignment. */
export const Horizontal: Story = {
  render: () => (
    <Group gap="md" justify="between" align="center">
      <Card aria-label="Left">Left</Card>
      <Card aria-label="Right">Right</Card>
    </Group>
  ),
};
