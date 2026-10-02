import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { useState } from 'react';
import { Toolbar } from './Toolbar.js';
import { Transition } from '../Transition/Transition.js';
import { Button } from '../Button/Button.js';
import { Card } from '../Card/Card.js';
import { Stack } from '../Stack/Stack.js';

const meta = {
  title: 'Utility/Toolbar and Transition',
  component: Toolbar,
  parameters: {
    docs: {
      description: {
        component:
          'A toolbar is one tab stop for a group of controls, with arrows moving between them. '
          + 'This is for accessibility: a formatting bar of fifteen buttons would otherwise be '
          + 'fifteen tab stops between a person and the next field.\n\n'
          + 'A floating toolbar is a Resin plane. One inside a surface that already has a '
          + 'material inherits it, because Resin never contains Resin.\n\n'
          + 'Transition is thin, because everything it could decide is already decided in '
          + '`@crystal-ui/core`. It renders a real wrapper instead of `display: contents`, because '
          + 'an element that generates no box cannot be faded, and the component exists for the '
          + 'exit animation.',
      },
    },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tab in once, then use the arrow keys. Tab again leaves the whole group. */
export const Floating: Story = {
  render: () => (
    <Stack gap="lg">
      <Toolbar variant="resin" aria-label="Formatting">
        <Button variant="quiet">Bold</Button>
        <Button variant="quiet">Italic</Button>
        <Button variant="quiet">Underline</Button>
      </Toolbar>
      <Card aria-label="Inside a surface">
        <Toolbar aria-label="Card actions">
          <Button variant="quiet">Share</Button>
          <Button variant="quiet">Duplicate</Button>
        </Toolbar>
      </Card>
    </Stack>
  ),
};

export const Vertical: Story = {
  args: { variant: 'resin', orientation: 'vertical', 'aria-label': 'Tools' },
  render: (args) => (
    <Toolbar {...only(args)}>
      <Button variant="quiet">Select</Button>
      <Button variant="quiet">Draw</Button>
      <Button variant="quiet">Erase</Button>
    </Toolbar>
  ),
};

export const Transitions: Story = {
  render: function Transitions() {
    const [shown, setShown] = useState(true);
    return (
      <Stack gap="md">
        <Button onPress={() => setShown((was) => !was)}>{shown ? 'Hide' : 'Show'}</Button>
        <Transition isPresent={shown} preset="frost" anchored>
          <Card aria-label="Transitioning">
            The exit plays before this leaves the tree. Without AnimatePresence the animation and
            the unmount race, and the unmount wins.
          </Card>
        </Transition>
      </Stack>
    );
  },
};
