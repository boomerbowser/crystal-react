import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tour, type TourStep } from './Tour.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Tour',
  component: Tour,
  parameters: {
    docs: {
      description: {
        component:
          '"Focus moves to each step; **the sequence is escapable** and its position is '
          + 'announced." A tour is the one pattern in the library that takes the whole interface '
          + 'away from someone who did not ask for it. So every step carries a visible way out, '
          + 'Escape ends it from anywhere, and ending returns focus to whatever had it when the '
          + "tour began. Focus does not go to the last step's target, which by then may be the "
          + 'thing the tour was explaining.\n\n'
          + 'The highlight is a hole in the scrim instead of a ring around the target. A ring has '
          + 'to out-stack everything between it and the viewport, and a hole does not. '
          + "It takes the target's own radius, so a pill is cut as a pill.\n\n"
          + 'The position is in the panel\'s accessible name as well as in small text beside it. '
          + 'A reader who cannot see the progress has no other way to know whether they are '
          + 'near the end.',
      },
    },
  },
  args: { steps: [], isOpen: false },
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

function Guided(): React.JSX.Element {
  const projects = useRef<HTMLButtonElement>(null);
  const settings = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  const steps: TourStep[] = [
    {
      target: projects,
      title: 'Your projects live here',
      children: 'Everything you own, and everything shared with you.',
    },
    {
      target: settings,
      title: 'Settings are per project',
      children: 'Changing one never changes another.',
    },
    { title: 'That is the whole tour', children: 'You can start it again from the help menu.' },
  ];

  return (
    <div style={{ display: 'grid', gap: 16, padding: 24 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button ref={projects}>Projects</Button>
        <Button ref={settings} variant="quiet">Settings</Button>
      </div>
      <div>
        <Button onPress={() => { setStep(0); setOpen(true); }}>Start the tour</Button>
      </div>
      <Tour
        steps={steps}
        isOpen={open}
        step={step}
        onStepChange={setStep}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

/* A tour needs something to point at, so the story renders the page it runs
   over instead of the panel on its own. */
export const AGuidedSequence: Story = {
  args: { steps: [], isOpen: false },
  render: () => <Guided />,
};
