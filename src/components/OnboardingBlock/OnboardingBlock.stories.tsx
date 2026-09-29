import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { OnboardingBlock, type OnboardingState, type OnboardingStep } from './OnboardingBlock.js';
import { Button } from '../Button/Button.js';

const steps: OnboardingStep[] = [
  { id: 'welcome', title: 'Welcome to Harbour', children: 'A place for your team’s projects, documents and decisions.' },
  { id: 'invite', title: 'Invite your team', children: 'Projects are better shared. You can invite people now or later.' },
  { id: 'start', title: 'Start a project', children: 'Everything begins with one. Give it a name; the rest can wait.' },
];

function Flow({ initial = 'at-rest' as OnboardingState }) {
  const [state, setState] = useState<OnboardingState>(initial);
  const [step, setStep] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <Button onPress={() => { setStep(0); setState('active'); }}>Show me around</Button>
      <p style={{ margin: 0 }}>State: {state}</p>
      <OnboardingBlock
        steps={steps}
        state={state}
        step={step}
        onStepChange={setStep}
        onComplete={() => { setState('complete'); }}
        onSkip={() => { setState('skipped'); }}
      />
    </div>
  );
}

const meta = {
  title: 'Blocks/OnboardingBlock',
  component: OnboardingBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Escapable at every step; progress announced; focus moves with the step."\n\nBuilt on `Tour`: '
          + 'every step has a way out and Escape ends it, and finishing is kept apart from skipping. The '
          + 'position is in each step’s name, and a bar shows it to the eye. Focus moves onto the panel '
          + 'at each step and goes back where it was at the end. Pages change with `page-in` and '
          + '`page-out`; the panel is Frost over a Mirage scrim.',
      },
    },
  },
  args: { steps, state: 'at-rest', step: 0, onStepChange: () => {}, onComplete: () => {}, onSkip: () => {} },
  render: () => <Flow />,
} satisfies Meta<typeof OnboardingBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Active: Story = { render: () => <Flow initial="active" /> };
