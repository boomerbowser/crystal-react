import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { only } from '../../../.storybook/environment.js';
import { Affix } from './Affix.js';
import { Portal } from '../Portal/Portal.js';
import { Card } from '../Card/Card.js';
import { ScrollArea } from '../ScrollArea/ScrollArea.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';
import { Button } from '../Button/Button.js';

const paragraphs = Array.from({ length: 12 }, (_, index) => (
  <Text key={index}>
    Paragraph {index + 1}. Scroll this column: the bar above pins once its natural
    position would be above the offset line, and unpins on the way back.
  </Text>
));

const meta = {
  title: 'Utilities/Positioning',
  component: Affix,
  args: {
    offset: 16,
    onChange: fn(),
    children: <Card><Text>This bar pins to the top of its scroller.</Text></Card>,
  },
  argTypes: {
    offset: {
      description: 'How far from the top of the viewport it settles — and the threshold at which it pins.',
      control: { type: 'range', min: 0, max: 96, step: 4 }, table: { category: 'Affix' },
    },
    children: { control: false, table: { category: 'Affix' } },
    onChange: { table: { category: 'Affix' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Nothing moves at rest.** An affix is not ambient motion: it changes position because the '
          + 'reader scrolled, which is motion a person started. It reports pinning through `onChange` '
          + 'so a product can shade a header without reading the scroll position a second time.\n\n'
          + '**The pin is measured on a scroll listener, not an `IntersectionObserver`.** The observer '
          + 'is the textbook answer and it delivers nothing at all in some embedded browsers — '
          + 'including the one this project previews in — which produces a component that is correct '
          + 'in every test and inert where it is looked at. The listener is passive and coalesced to '
          + 'one read per frame.\n\n'
          + '**A portal exists to escape `overflow` and `transform`, so it defaults to `body`.** The '
          + '`container` prop can name somewhere else, and the warning in its own documentation is '
          + 'the point: a container inside the page can itself sit inside the very `transform` the '
          + 'content is escaping, which is the defect this component exists to avoid, reintroduced '
          + 'through its own prop.',
      },
    },
  },
} satisfies Meta<typeof Affix>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pinned: Story = {
  name: 'Affix',
  render: (args) => (
    <ScrollArea style={{ height: 320 }}>
      <Affix {...only(args)} />
      <Stack gap="md">{paragraphs}</Stack>
    </ScrollArea>
  ),
};

/* The reported state, shown. `onChange` is the half of this component a product
   consumes and the half a screenshot cannot show. */
export const ReportsWhenItPins: Story = {
  render: (args) => {
    const [pinned, setPinned] = useState(false);
    return (
      <Stack gap="sm">
        <Text>{pinned ? 'Pinned' : 'At rest'}</Text>
        <ScrollArea style={{ height: 300 }}>
          <Affix {...only(args)} onChange={setPinned} />
          <Stack gap="md">{paragraphs}</Stack>
        </ScrollArea>
      </Stack>
    );
  },
};

/* The escape, demonstrated rather than described: the wrapper clips and
   transforms, so the portalled card is visible only because it left. */
export const EscapingAClippingAncestor: Story = {
  name: 'Portal',
  render: () => {
    const [shown, setShown] = useState(false);
    return (
      <div style={{ overflow: 'hidden', transform: 'translateZ(0)', height: 120, padding: 16 }}>
        <Button onPress={() => setShown((was) => !was)}>
          {shown ? 'Send it back' : 'Portal a card to the body'}
        </Button>
        {shown && (
          <Portal>
            <Card style={{ position: 'fixed', insetBlockEnd: 24, insetInlineEnd: 24, maxWidth: 280 }}>
              <Text>Rendered into `body`. Inside that clipping, transformed box it would not be visible at all.</Text>
            </Card>
          </Portal>
        )}
      </div>
    );
  },
};
