import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { only } from '../../../.storybook/environment.js';
import { FloatingWindow } from './FloatingWindow.js';
import { HoverCard } from '../HoverCard/HoverCard.js';
import { Anchor } from '../Anchor/Anchor.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';
import { Title } from '../Title/Title.js';

const meta = {
  title: 'Overlays/Floating surfaces',
  component: FloatingWindow,
  args: {
    label: 'Inspector',
    defaultRect: { x: 40, y: 40, width: 320, height: 220 },
    isModal: false,
    step: 8,
    minWidth: 220,
    minHeight: 140,
    onRectChange: fn(),
    children: (
      <Stack gap="sm">
        <Title level={3}>Selection</Title>
        <Text>Move it with the arrow keys once the title bar has focus.</Text>
      </Stack>
    ),
  },
  argTypes: {
    label: { control: 'text', table: { category: 'Window' } },
    isModal: {
      description: 'Announce as a dialog and trap focus. Off by default, because a window that traps focus without being modal cannot be left with Tab.',
      control: 'boolean', table: { category: 'Window' },
    },
    step: {
      description: 'How far one arrow press moves it. Shift multiplies by ten.',
      control: { type: 'range', min: 1, max: 32, step: 1 }, table: { category: 'Window' },
    },
    minWidth: { control: { type: 'number' }, table: { category: 'Window' } },
    minHeight: { control: { type: 'number' }, table: { category: 'Window' } },
    defaultRect: { control: false, table: { category: 'Window' } },
    children: { control: false, table: { category: 'Window' } },
    onRectChange: { table: { category: 'Window' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Both surfaces here are Resin, and neither may contain Resin.** Crystal\'s materials nest '
          + 'Plastic → Frost → Resin, back to front. An overlay portals to `body`, so by the time it '
          + 'renders the DOM no longer shows what it sits inside. `SurfaceProvider` supplies that '
          + 'answer instead, so the rule still holds across the portal.\n\n'
          + '**A window moves from the keyboard.** A keyboard user cannot drag, so the title bar is '
          + 'focusable and the arrow keys move the window by `step`, or ten times that with Shift.\n\n'
          + '**A hover card is not a tooltip.** A tooltip names a control. A hover card previews the '
          + 'thing behind a link and contains its own content, sometimes focusable. It therefore '
          + 'carries a name of its own, opens on a delay so a pointer crossing a paragraph of links '
          + 'does not make cards flash open and shut, and waits before closing so the pointer can '
          + 'travel into it.',
      },
    },
  },
} satisfies Meta<typeof FloatingWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Window: Story = {
  render: (args) => (
    <div style={{ position: 'relative', minHeight: 340 }}>
      <FloatingWindow {...only(args)} />
    </div>
  ),
};

export const ModalWindow: Story = {
  name: 'Modal, with focus trapped',
  args: {
    isModal: true,
    children: <Text>Focus cannot leave this window, which is only honest because it is modal.</Text>,
  },
  render: (args) => (
    <div style={{ position: 'relative', minHeight: 340 }}>
      <FloatingWindow {...only(args)} />
    </div>
  ),
};

export const Preview: Story = {
  name: 'Hover card',
  render: () => (
    <Text>
      The parity bar for a platform library is{' '}
      <HoverCard
        label="Parity contract"
        trigger={<Anchor href="#contract">the parity contract</Anchor>}
      >
        <Stack gap="sm">
          <Title level={4}>CONTRACT §1</Title>
          <Text>A library implements Crystal for a platform. It does not fork the token or material definitions.</Text>
        </Stack>
      </HoverCard>
      , and it is generated from the catalogue rather than written twice.
    </Text>
  ),
};
