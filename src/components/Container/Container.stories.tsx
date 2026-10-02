import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Container } from './Container.js';
import { Card } from '../Card/Card.js';
import { Stack } from '../Stack/Stack.js';
import { Center } from '../Center/Center.js';
import { Space } from '../Space/Space.js';
import { AspectRatio } from '../AspectRatio/AspectRatio.js';

const meta = {
  title: 'Layout/Container and boxes',
  component: Container,
  parameters: {
    docs: {
      description: {
        component:
          'Container has two ceilings because Crystal has two: the shell, which is how wide the '
          + 'page becomes, and the reading column, which is how wide a line of prose gets before '
          + 'it stops being comfortable. Its gutters step down at Crystal\'s breakpoints. Narrow '
          + 'the window to see it.\n\n'
          + 'It introduces no landmark, as the catalogue requires. A container that renders a '
          + '`main` adds a landmark for a decision about width, and a screen reader user then '
          + 'navigates by landmarks into boxes that mean nothing.\n\n'
          + 'Center, Space and AspectRatio are shown here too, because each is small and they '
          + 'are clearer seen together. Space is `aria-hidden`: '
          + 'the catalogue forbids using it to convey grouping, and an empty div is announced as '
          + 'a blank item by some screen readers. AspectRatio reserves its box before the media '
          + 'loads, which is the largest single source of layout shift on a content page.',
      },
    },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shell: Story = {
  render: (args) => (
    <Container {...only(args)}>
      <Card aria-label="Shell">The page shell, with gutters that step down as the window narrows.</Card>
    </Container>
  ),
};

export const ReadingColumn: Story = {
  args: { width: 'reading' },
  render: (args) => (
    <Container {...only(args)}>
      <Card aria-label="Reading">
        A column of prose stops being comfortable to read past a certain measure, which is a
        different ceiling from how wide the page itself may become. Naming the intent rather than
        a size is what keeps the two from being confused.
      </Card>
    </Container>
  ),
};

export const CentreSpaceAndRatio: Story = {
  render: () => (
    <Stack gap="lg">
      <Card aria-label="Centred">
        <Center>Centred on both axes.</Center>
      </Card>
      <Card aria-label="Spaced">
        First line
        <Space size="xl" />
        Second line, an explicit gap below it
      </Card>
      <AspectRatio ratio="16 / 9" clip>
        <div style={{ background: 'linear-gradient(135deg, var(--cr-decorative), var(--cr-companion))' }} />
      </AspectRatio>
    </Stack>
  ),
};
