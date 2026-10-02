import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { only } from '../../../.storybook/environment.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { RollingNumber } from './RollingNumber.js';

const meta = {
  title: 'Data display/Rolling number',
  component: RollingNumber,
  parameters: {
    docs: {
      description: {
        component:
          'A number that rolls digit by digit when it changes. Crystal assigns this component '
          + 'no motion recipe. A library must not invent motion the design system did not '
          + 'specify, and `Card` plays nothing for that reason. Here the movement is the '
          + 'component, so the roll is built from Crystal\'s published motion tokens: the travel '
          + `is one digit, the duration is \`motion.duration.state\` (${crystalTokens['motion.duration.state']}), and the easing is `
          + '`motion.easing.settle`. This library chose none of the numbers.\n\n'
          + 'The digits are `aria-hidden` and a polite live region carries the settled value one '
          + 'roll later, because "the value is announced once it settles, not on every frame". '
          + 'Under reduced motion the roll is removed, the duration resolves to zero, and the '
          + 'announcement is immediate.',
      },
    },
  },
  args: { value: 1234, description: 'subscribers' },
} satisfies Meta<typeof RollingNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Currency: Story = {
  args: { value: 48210.5, locale: 'en-GB', format: { style: 'currency', currency: 'GBP' }, description: 'revenue this month' },
};

/** Changing, so the roll is visible. The movement is started by arriving data,
 *  so it is not movement at rest. */
export const Changing: Story = {
  render: (args) => {
    const Demo = () => {
      const [value, setValue] = useState(1234);
      useEffect(() => {
        const timer = setInterval(() => { setValue((n) => n + Math.round(Math.random() * 40) + 1); }, 1400);
        return () => { clearInterval(timer); };
      }, []);
      return <RollingNumber {...only(args)} value={value} />;
    };
    return <Demo />;
  },
};
