import type { Meta, StoryObj } from '@storybook/react-vite';
import { PricingBlock, type PricingPlan } from './PricingBlock.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const plans: PricingPlan[] = [
  {
    id: 'solo', name: 'Solo', price: gbp(0), period: 'per month', description: 'For one person trying things out.',
    features: [{ label: '3 projects' }, { label: 'Version history for 7 days' }, { label: 'Shared workspaces', included: false }, { label: 'Single sign-on', included: false }],
  },
  {
    id: 'team', name: 'Team', price: gbp(12), period: 'per seat per month', description: 'For teams shipping together.', recommended: true,
    features: [{ label: 'Unlimited projects' }, { label: 'Version history for 90 days' }, { label: 'Shared workspaces' }, { label: 'Single sign-on', included: false }],
  },
  {
    id: 'org', name: 'Organisation', price: gbp(30), period: 'per seat per month', description: 'For many teams, with controls.',
    features: [{ label: 'Unlimited projects' }, { label: 'Unlimited version history' }, { label: 'Shared workspaces' }, { label: 'Single sign-on' }],
  },
];

const meta = {
  title: 'Blocks/PricingBlock',
  component: PricingBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"The recommended plan is stated in words, not only styled."\n\n"Recommended" is a word in the plan\'s '
          + 'heading, so a reader moving by headings hears "Team, Recommended". Emphasis is Crystal\'s (the one '
          + 'primary action, label weight and placement), and every plan is the same Haze card. Actions name '
          + 'their plan; a missing feature says "Not included".',
      },
    },
  },
  args: { plans, onChoose: () => {} },
} satisfies Meta<typeof PricingBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Recommended: Story = {};
export const AtRest: Story = { args: { plans: plans.map((plan) => ({ ...plan, recommended: false })) } };
export const OnAPlan: Story = { args: { currentPlan: 'solo' } };
