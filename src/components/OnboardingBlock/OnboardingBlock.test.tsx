import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor } from '../../test/render.js';
import { OnboardingBlock, type OnboardingState, type OnboardingStep } from './OnboardingBlock.js';

const steps: OnboardingStep[] = [
  { id: 'welcome', title: 'Welcome to Harbour', children: 'A place for your team’s projects.' },
  { id: 'invite', title: 'Invite your team', children: 'Projects are better shared.' },
  { id: 'start', title: 'Start a project', children: 'Everything begins with one.' },
];

function Harness({ onComplete = () => {}, onSkip = () => {} }: { onComplete?: () => void; onSkip?: () => void }) {
  const [state, setState] = useState<OnboardingState>('at-rest');
  const [step, setStep] = useState(0);
  return (
    <>
      <button type="button" onClick={() => { setStep(0); setState('active'); }}>Show me around</button>
      <OnboardingBlock
        steps={steps}
        state={state}
        step={step}
        onStepChange={setStep}
        onComplete={() => { onComplete(); setState('complete'); }}
        onSkip={() => { onSkip(); setState('skipped'); }}
      />
    </>
  );
}

const start = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Show me around' }));
};

describe('OnboardingBlock', () => {
  /* Progress announced: the position is in each step's name. */
  it('says where in the sequence each step is, in its name', async () => {
    renderWithCrystal(<Harness />);
    await start();
    expect(screen.getByRole('dialog', { name: /^Step 1 of 3\.\s*Welcome to Harbour$/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: /^Step 2 of 3\.\s*Invite your team$/ })).toBeInTheDocument();
  });

  it('shows the progress to the eye without saying it twice', async () => {
    renderWithCrystal(<Harness />);
    await start();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(document.querySelector('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '1');
  });

  /* Focus moves with the step. */
  it('moves focus onto the panel at each step', async () => {
    renderWithCrystal(<Harness />);
    await start();
    await waitFor(() => { expect(screen.getByRole('dialog')).toHaveFocus(); });
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => { expect(screen.getByRole('dialog', { name: /Step 2 of 3/ })).toHaveFocus(); });
  });

  it('shows the new step’s page, and lets the old one go', async () => {
    renderWithCrystal(<Harness />);
    await start();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Projects are better shared.')).toBeInTheDocument();
    await waitFor(() => { expect(screen.queryByText('A place for your team’s projects.')).toBeNull(); });
  });

  /* Escapable at every step, and the way it ended is kept apart. */
  it('is skipped by Escape from any step, and says so', async () => {
    const onSkip = vi.fn();
    const onComplete = vi.fn();
    renderWithCrystal(<Harness onSkip={onSkip} onComplete={onComplete} />);
    await start();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.keyboard('{Escape}');
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Tour skipped');
  });

  it('offers a way out on every step', async () => {
    renderWithCrystal(<Harness />);
    await start();
    for (let at = 0; at < steps.length - 1; at += 1) {
      expect(screen.getByRole('button', { name: 'Skip tour' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    }
    expect(screen.getByRole('button', { name: 'Skip tour' })).toBeInTheDocument();
  });

  it('is complete only when the last step is finished, and gives focus back', async () => {
    const onComplete = vi.fn();
    renderWithCrystal(<Harness onComplete={onComplete} />);
    await start();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Get started' }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Tour complete');
    await waitFor(() => { expect(screen.getByRole('button', { name: 'Show me around' })).toHaveFocus(); });
  });

  it('says nothing about a tour that was already over when the page loaded', () => {
    renderWithCrystal(<OnboardingBlock steps={steps} state="complete" step={0} onStepChange={() => {}} onComplete={() => {}} onSkip={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each(['at-rest', 'active', 'complete', 'skipped'] satisfies OnboardingState[])('has no axe violations %s', async (state) => {
    renderWithCrystal(<OnboardingBlock steps={steps} state={state} step={1} onStepChange={() => {}} onComplete={() => {}} onSkip={() => {}} />);
    await expectNoAxeViolations(document.body);
  });
});
