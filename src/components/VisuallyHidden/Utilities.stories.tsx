import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { VisuallyHidden } from './VisuallyHidden.js';
import { SkipLink } from '../SkipLink/SkipLink.js';
import { FocusTrap } from '../FocusTrap/FocusTrap.js';
import { ClickAway } from '../ClickAway/ClickAway.js';
import { Focusable } from '../Focusable/Focusable.js';
import { Pressable } from '../Pressable/Pressable.js';
import { NoSsr } from '../NoSsr/NoSsr.js';
import { Button } from '../Button/Button.js';
import { Card } from '../Card/Card.js';
import { Stack } from '../Stack/Stack.js';

const meta = {
  title: 'Utility/Behaviour',
  component: VisuallyHidden,
  parameters: {
    docs: {
      description: {
        component:
          'The components with no appearance of their own. Each is React Aria\'s behaviour with '
          + 'Crystal\'s contract stated around it. In two cases Crystal is stricter than the '
          + 'library.\n\n'
          + '`ClickAway` also dismisses on Escape, because a keyboard user has no outside to '
          + 'click and Crystal\'s rule is that a click-away is never the only way out. '
          + '`Pressable` supplies the role React Aria leaves to the caller. A bare React Aria '
          + 'Pressable around a span is a tab stop a screen reader announces as nothing.\n\n'
          + 'Tab through this story instead of reading it. Most of it is visible only under '
          + 'keyboard focus.',
      },
    },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
  render: () => (
    <Card aria-label="Visually hidden">
      <p>
        Saved
        <VisuallyHidden> at 14:32, by Meridian Digital</VisuallyHidden>
      </p>
      <p style={{ color: 'var(--cr-muted)' }}>
        A screen reader reads the whole sentence; the page shows only the first word.
      </p>
    </Card>
  ),
};

/** Tab into this story: the link appears at the top-left and jumps focus, not
 *  only the viewport, to the region below. */
export const Skip: Story = {
  render: () => (
    <div style={{ position: 'relative', minHeight: '160px' /* crystal-allow-literal: story box, so the skip link has somewhere to go */ }}>
      <SkipLink targetId="story-main" />
      <p>Tab into this story. The skip link appears before anything else.</p>
      <Card aria-label="Main" id="story-main">
        <p>Focus lands here, so the next Tab continues from the content.</p>
      </Card>
    </div>
  ),
};

export const Trapped: Story = {
  render: function Trapped() {
    const [open, setOpen] = useState(false);
    return (
      <Stack gap="md">
        <Button onPress={() => setOpen(true)}>Open the trapped region</Button>
        {open ? (
          <FocusTrap>
            <Card aria-label="Trapped">
              <Stack gap="md">
                <p>Tab cycles inside this card. Escape is the visible, keyboard-reachable exit.</p>
                <ClickAway onDismiss={() => setOpen(false)}>
                  <Button onPress={() => setOpen(false)}>Close</Button>
                </ClickAway>
              </Stack>
            </Card>
          </FocusTrap>
        ) : null}
      </Stack>
    );
  },
};

export const PressAndFocus: Story = {
  render: () => (
    <Stack gap="md">
      <Pressable onPress={() => undefined}>
        <span style={{ display: 'inline-block', padding: 'var(--cr-spacing-sm)' }}>
          A span that is a button: Space and Enter activate it, and the press recipe plays.
        </span>
      </Pressable>
      <Focusable>
        <div style={{ padding: 'var(--cr-spacing-sm)' }}>
          A div that is a tab stop and nothing else, with no role invented.
        </div>
      </Focusable>
      <NoSsr fallback={<p>Rendered on the server.</p>}>
        <p>Rendered on the client only.</p>
      </NoSsr>
    </Stack>
  ),
};
