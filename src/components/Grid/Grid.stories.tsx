import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from './Grid.js';
import { SimpleGrid } from '../SimpleGrid/SimpleGrid.js';
import { Card } from '../Card/Card.js';
import { Stack } from '../Stack/Stack.js';

const meta = {
  title: 'Layout/Grid',
  component: Grid,
  parameters: {
    docs: {
      description: {
        component:
          'Twelve columns, which is what makes halves, thirds, quarters and sixths all '
          + 'expressible without a second grid. A cell declares a span per breakpoint, and the '
          + 'defaults are the ones that fail safely: a cell with no span is full width, so a '
          + 'forgotten prop produces a readable stack rather than a page of slivers.\n\n'
          + 'Reading order must match visual order. That is a rule about not reordering cells in '
          + 'CSS — a grid that visually reorders its children leaves a keyboard and a screen '
          + 'reader walking the original order, and the two no longer agree.\n\n'
          + 'SimpleGrid is the other half of the pair: equal cells that flow into as many columns '
          + 'as fit, with no breakpoint props at all, which is what a gallery or a card list wants.',
      },
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Twelve: Story = {
  render: () => (
    <Grid gap="md">
      {([[6, 12], [6, 12], [4, 6], [4, 6], [4, 12], [12, 12]] as const).map(([span, spanSm], i) => (
        <Grid.Cell key={i} span={span} spanSm={spanSm}>
          <Card aria-label={`Cell ${i + 1}`}>span {span}</Card>
        </Grid.Cell>
      ))}
    </Grid>
  ),
};

export const Simple: Story = {
  render: () => (
    <Stack gap="lg">
      <SimpleGrid gap="md">
        {['Prism', 'Bloom', 'Harbor', 'Ion', 'Ember', 'Moss'].map((name) => (
          <Card key={name} aria-label={name}>{name}</Card>
        ))}
      </SimpleGrid>
    </Stack>
  ),
};
