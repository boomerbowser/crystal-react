import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { AnchorProps } from './Anchor.js';
import { Anchor } from './Anchor.js';
import { NavLink } from '../NavLink/NavLink.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';

const meta = {
  title: 'Navigation/Links',
  /* Without this docgen has nothing to read and Storybook generates no
     controls at all — the message Meridian screenshotted. This file shows
     several components together; the one named here is its subject, and the
     others are the context it is normally seen in. */
  component: Anchor,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` — see `.storybook/main.ts` — and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    ...ariaArgTypes<AnchorProps>({
      autoFocus: false,
      isDisabled: true,
      onFocusChange: false,
      onHoverChange: false,
      onPress: true,
    }),
  },
  args: { href: '#destination', children: 'a link in running text' },
  parameters: {
    docs: {
      description: {
        component:
          '**A link goes somewhere; a control that acts is a `Button`.** Both components here '
          + 'require an `href`, which is the catalogue\'s rule enforced in the type rather than '
          + 'documented beside it. React Aria will render a `<span role="link">` when given no '
          + 'destination, and the result announces as a link while being absent from the browser\'s '
          + 'link list, unopenable in a new tab, and silent in the status bar.\n\n'
          + '**An `Anchor` is underlined at rest.** The underline is the non-chromatic signal that '
          + 'distinguishes a link from the sentence around it, so it is not a hover affordance. '
          + 'Crystal offsets it clear of the descenders.\n\n'
          + '**A `NavLink` marks the current page with a dot and with weight**, and reserves the '
          + 'dot\'s room whether or not it is drawn. A column that appears only for the current '
          + 'entry shifts every label in the list the moment you navigate — which is the defect '
          + 'that had the leading selection mark withdrawn from Crystal, and it would be the same '
          + 'defect here under a different name.',
      },
    },
  },
} satisfies Meta<typeof Anchor>;

export default meta;
type Story = StoryObj<typeof meta>;

const HomeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

export const InRunningText: Story = {
  render: () => (
    <Text>
      Crystal&rsquo;s materials are described in <Anchor href="#materials">the materials chapter</Anchor>,
      and the reasoning behind them is drawn from{' '}
      <Anchor href="https://www.w3.org/TR/WCAG22/" isExternal>WCAG 2.2</Anchor>.
    </Text>
  ),
};

export const Destinations: Story = {
  render: () => (
    <Stack gap="2xs" style={{ maxWidth: '280px' }} /* crystal-allow-literal: story bound, a navigation column */>
      <NavLink href="#inbox" icon={HomeIcon}>Inbox</NavLink>
      <NavLink href="#drafts" icon={HomeIcon} isCurrent trailing="12">Drafts</NavLink>
      <NavLink href="#sent" icon={HomeIcon}>Sent</NavLink>
      <NavLink href="#archive" icon={HomeIcon} isDisabled>Archive</NavLink>
    </Stack>
  ),
};

/* The labels must sit at the same inline position in both frames. If the second
   one is indented relative to the first, the reserved slot is not reserved. */
export const TheLabelDoesNotMoveWhenYouNavigate: Story = {
  render: () => (
    <Stack gap="lg">
      <Stack gap="2xs" style={{ maxWidth: '280px' }} /* crystal-allow-literal: story bound, a navigation column */>
        <NavLink href="#inbox" isCurrent>Inbox</NavLink>
        <NavLink href="#drafts">Drafts</NavLink>
      </Stack>
      <Stack gap="2xs" style={{ maxWidth: '280px' }} /* crystal-allow-literal: story bound, a navigation column */>
        <NavLink href="#inbox">Inbox</NavLink>
        <NavLink href="#drafts" isCurrent>Drafts</NavLink>
      </Stack>
    </Stack>
  ),
};
