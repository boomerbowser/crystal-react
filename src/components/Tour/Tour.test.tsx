import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { Tour, type TourStep } from './Tour.js';

function Harness({ onClose }: { onClose?: (reason: 'finished' | 'dismissed') => void }) {
  const target = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const steps: TourStep[] = [
    { target, title: 'Your projects live here', children: 'Everything you own.' },
    { title: 'That is all of it' },
  ];
  return (
    <>
      <button type="button" ref={target} onClick={() => setOpen(true)}>Start tour</button>
      <Tour
        steps={steps}
        isOpen={open}
        step={step}
        onStepChange={setStep}
        onClose={(reason) => { setOpen(false); onClose?.(reason); }}
      />
    </>
  );
}

describe('Tour', () => {
  /* "Its position is announced." A reader who cannot see the progress has no
     other way to know whether they are near the end, so the position is in the
     panel's name and not only in small text beside it. */
  it('says where in the sequence each step is', async () => {
    renderWithCrystal(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    expect(screen.getByRole('dialog', { name: /^Step 1 of 2\.\s*Your projects live here$/ }))
      .toBeInTheDocument();
  });

  it('moves through the sequence', async () => {
    renderWithCrystal(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: /Step 2 of 2/ })).toBeInTheDocument();
    /* The last step finishes rather than offering a next that goes nowhere. */
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  /* "The sequence is escapable." A tour takes the whole interface away from
     someone who did not ask for it, so there is a way out on every step and
     Escape works from anywhere in it. */
  it('has a way out on every step', async () => {
    renderWithCrystal(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    expect(screen.getByRole('button', { name: 'End tour' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'End tour' })).toBeInTheDocument();
  });

  /* A product that records how a tour ended can tell finishing from leaving. */
  it('says whether it was finished or left', async () => {
    const onClose = vi.fn();
    renderWithCrystal(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    await userEvent.click(screen.getByRole('button', { name: 'End tour' }));
    expect(onClose).toHaveBeenLastCalledWith('dismissed');
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); });
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenLastCalledWith('finished');
  });

  it('ends on Escape', async () => {
    const onClose = vi.fn();
    renderWithCrystal(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledExactlyOnceWith('dismissed');
    /* After its exit: the panel plays `popover-out` before it goes. */
    await waitFor(() => { expect(screen.queryByRole('dialog')).toBeNull(); });
  });

  /* Back to whatever had focus when it began — not to the last step's target,
     which by then may be gone or may be the thing the tour was explaining. */
  it('gives focus back where it found it', async () => {
    renderWithCrystal(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Start tour' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'End tour' }));
    expect(trigger).toHaveFocus();
  });

  /* Focus lands on the panel, which carries the step and its position, rather
     than on "Next", which announces "Next". */
  it('moves focus to the step, not to its first button', async () => {
    renderWithCrystal(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    await expectNoAxeViolations(container);
  });
});
