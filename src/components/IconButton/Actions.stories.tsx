import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { IconButtonProps } from './IconButton.js';
import { useState } from 'react';
import { IconButton, CloseButton } from './IconButton.js';
import { ButtonGroup, SplitButton } from '../ButtonGroup/ButtonGroup.js';
import { FloatingAction, SpeedDial, ActionBar } from '../FloatingAction/FloatingAction.js';
import { CopyButton } from '../CopyButton/CopyButton.js';
import { Button } from '../Button/Button.js';
import { Card } from '../Card/Card.js';
import { Stack, Group } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d={path} /></svg>
);
const Star = icon('M12 3l2.8 6.3 6.2.6-4.7 4.3 1.4 6.3L12 17.3 6.3 20.5l1.4-6.3L3 9.9l6.2-.6z');
const Plus = icon('M12 5v14M5 12h14');
const Bold = icon('M7 5h6a4 4 0 010 8H7zM7 13h7a4 4 0 010 8H7z');

const meta = {
  title: 'Actions/Icon, group and floating',
  component: IconButton,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` (see `.storybook/main.ts`), and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    ...ariaArgTypes<IconButtonProps>({
      autoFocus: false,
      isDisabled: true,
      /* An icon-only button's accessible name, so never off. */
      label: true,
      onFocusChange: false,
      onHoverChange: false,
      onPress: true,
    }),
  },
  parameters: {
    docs: {
      description: {
        component:
          /* The figures come from the live tokens, so the documentation cannot
             drift from the geometry it describes. The design system's own drift
             guard applies the same rule. */
          `Every action in Crystal is a pill and every one reaches ${crystalTokens['action.minTarget']}. `
          + `For an icon button the target grows and the icon does not: a `
          + `${crystalTokens['icon.action']} icon is a ${crystalTokens['icon.action']} picture and a `
          + `${crystalTokens['action.minTarget']} place to press. Growing the visible control `
          + 'instead makes a toolbar look clumsy.\n\n'
          + 'An icon has no text, so the label is the only name the control has, and `label` '
          + 'is required. CloseButton also names what closes. A page with three dismissible '
          + 'things otherwise has three buttons called "Close", and a screen reader user listing '
          + 'the controls learns nothing.\n\n'
          + 'A group is one Resin plane: pill outside, square inside, with a hairline between. '
          + 'Rounding every child instead gives a row of separate buttons that happen to touch. '
          + 'A split button is two buttons, because a control that behaves '
          + 'differently depending on which half was pressed cannot be described to somebody who '
          + 'cannot see the halves.',
      },
    },
  },
  args: { label: 'Add to favourites', icon: Star },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Icons: Story = {
  render: function Icons() {
    const [starred, setStarred] = useState(false);
    return (
      <Group gap="md">
        <IconButton label="Add to favourites" icon={Star} />
        <IconButton label="Add to favourites" icon={Star} variant="resin" />
        <IconButton label="Add to favourites" icon={Star} variant="resin" circle />
        <IconButton
          label="Favourite"
          icon={Star}
          isSelected={starred}
          onPress={() => setStarred((was) => !was)}
        />
        <CloseButton closes="the filters panel" variant="resin" />
      </Group>
    );
  },
};

export const Groups: Story = {
  render: function Groups() {
    const [open, setOpen] = useState(false);
    /* `align="start"` because a group is a control. A flex child stretches to
       its container's cross axis by default, and a control that fills the page
       looks broken. */
    return (
      <Stack gap="lg" align="start">
        <ButtonGroup label="Clipboard">
          <Button variant="quiet">Cut</Button>
          <Button variant="quiet">Copy</Button>
          <Button variant="quiet">Paste</Button>
        </ButtonGroup>
        <ButtonGroup label="Formatting" orientation="vertical">
          <IconButton label="Bold" icon={Bold} />
          <IconButton label="Add to favourites" icon={Star} />
        </ButtonGroup>
        <SplitButton
          menuLabel="More save options"
          isOpen={open}
          onToggleMenu={() => setOpen((was) => !was)}
        >
          Save
        </SplitButton>
        <Card aria-label="Install">
          <Group gap="sm" align="center">
            <Text as="span"><code>npm i @crystal-ui/react</code></Text>
            <CopyButton value="npm i @crystal-ui/react" label="Copy the install command" />
          </Group>
        </Card>
      </Stack>
    );
  },
};

/** These are fixed to the viewport. A page that uses one owes the space underneath
 *  it, as scroll padding or a spacer, because Crystal cannot know what the content
 *  at the bottom of the page is. */
export const Floating: Story = {
  render: function Floating() {
    const [selected, setSelected] = useState(0);
    return (
      <Stack gap="lg" style={{ paddingBlockEnd: 'var(--cr-spacing-2xl)' }}>
        <Text>
          The floating action sits bottom-right; the action bar appears centred when a selection
          exists, and announces how many items are in it.
        </Text>
        <Group gap="md">
          <Button onPress={() => setSelected((n) => n + 1)}>Select one more</Button>
          <Button variant="quiet" onPress={() => setSelected(0)}>Clear</Button>
        </Group>
        <FloatingAction label="New document" icon={Plus} isExtended />
        <ActionBar isVisible={selected > 0} selectedCount={selected}>
          <Button variant="quiet">Move</Button>
          <Button variant="quiet">Delete</Button>
        </ActionBar>
      </Stack>
    );
  },
};

export const Dial: Story = {
  render: () => (
    <SpeedDial
      label="Create"
      icon={Plus}
      actions={[
        { id: 'doc', label: 'Document', onPress: () => undefined },
        { id: 'sheet', label: 'Spreadsheet', onPress: () => undefined },
        { id: 'deck', label: 'Presentation', onPress: () => undefined },
      ]}
    />
  ),
};
