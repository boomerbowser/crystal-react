'use client';

/* OnboardingBlock — a guided first-run sequence, with its progress.
 *
 * "**Escapable at every step; progress announced; focus moves with the step.**"
 * States: `at-rest`, `active`, `complete`, `skipped`.
 *
 * The steps and their copy are the product's. The block is `Tour` — which
 * already keeps all three promises — given the shape a first run has:
 *
 *   - **Escapable.** Every step has a way out and Escape ends it from anywhere,
 *     and the block tells the product which way it ended: finishing the last
 *     step is `complete`, leaving early is `skipped`, so a product never records
 *     a skip as a completion or asks again someone who finished.
 *   - **Progress announced.** The position is part of each step's accessible
 *     name ("Step 2 of 4. Invite your team"), and a bar shows the same to the
 *     eye. The bar is hidden from assistive technology, which has just heard it
 *     in the name. Ending is said too — "Tour complete", "Tour skipped" — as
 *     focus goes back to where it was.
 *   - **Focus moves with the step**, onto the panel, whose name carries the step.
 *
 * Motion is the catalogue's, `page-in` and `page-out`: a step's page leaves as
 * the next arrives, the two overlapping in one grid cell so nothing jumps. The
 * panel itself arrives and leaves with `Tour`'s `popover-in` and `popover-out`.
 * "Frost panel over a Mirage scrim" is `Tour`'s own material.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { Tour, type TourStep } from '../Tour/Tour.js';
import { Progress } from '../Progress/Progress.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import { cx } from '../../styles/cx.js';
import styles from './OnboardingBlock.module.scss';

export type OnboardingState = 'at-rest' | 'active' | 'complete' | 'skipped';

export interface OnboardingStep {
  id: string;
  title: ReactNode;
  children: ReactNode;
  /** A part of the interface to point at. Without one the step is a centred page. */
  target?: TourStep['target'];
}

export interface OnboardingBlockProps {
  steps: readonly OnboardingStep[];
  state: OnboardingState;
  step: number;
  onStepChange: (step: number) => void;
  /** The last step was finished. */
  onComplete: () => void;
  /** Left early — by Escape or by the way out on a step. */
  onSkip: () => void;
  skipLabel?: string;
  finishLabel?: string;
  completeLabel?: string;
  skippedLabel?: string;
  formatPosition?: (step: number, total: number) => string;
}

export function OnboardingBlock({
  steps, state, step, onStepChange, onComplete, onSkip, skipLabel = 'Skip tour', finishLabel = 'Get started',
  completeLabel = 'Tour complete', skippedLabel = 'Tour skipped',
  formatPosition = (at, total) => `Step ${String(at + 1)} of ${String(total)}`,
}: OnboardingBlockProps): React.JSX.Element {
  /* How it ended, said once as it ends — not on a page that loads already done. */
  const [said, setSaid] = useState('');
  const was = useRef(state);
  useEffect(() => {
    if (was.current === 'active' && state === 'complete') setSaid(completeLabel);
    if (was.current === 'active' && state === 'skipped') setSaid(skippedLabel);
    was.current = state;
  }, [state, completeLabel, skippedLabel]);

  /* Every step gets the same element in the same place, so React keeps it
     mounted across steps and its presence sees the page change. */
  const pages = (
    <Pages
      step={step}
      total={steps.length}
      page={steps[step]?.children}
      pageKey={steps[step]?.id ?? String(step)}
      formatPosition={formatPosition}
    />
  );
  const tourSteps: TourStep[] = steps.map((one) => ({
    title: one.title,
    children: pages,
    ...(one.target ? { target: one.target } : {}),
  }));

  return (
    <>
      <Tour
        steps={tourSteps}
        isOpen={state === 'active'}
        step={step}
        onStepChange={onStepChange}
        onClose={(reason) => { if (reason === 'finished') onComplete(); else onSkip(); }}
        formatPosition={formatPosition}
        closeLabel={skipLabel}
        finishLabel={finishLabel}
      />
      <VisuallyHidden role="status">{said}</VisuallyHidden>
    </>
  );
}

function Pages({ step, total, page, pageKey, formatPosition }: {
  step: number;
  total: number;
  page: ReactNode;
  pageKey: string;
  formatPosition: (step: number, total: number) => string;
}): React.JSX.Element {
  return (
    <div className={cx(styles['pages'])}>
      {/* Seen, not heard: the step's name has just said where the reader is. */}
      <div aria-hidden="true" className={cx(styles['progress'])}>
        <Progress label={formatPosition(step, total)} hideLabel value={step + 1} min={0} max={total} valueLabel={formatPosition(step, total)} />
      </div>
      <div className={cx(styles['stage'])}>
        <AnimatePresence initial={false}>
          <Page key={pageKey}>{page}</Page>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Page({ children }: { children: ReactNode }): React.JSX.Element {
  const scope = usePresenceMotion('page-in', 'page-out');
  return <div ref={scope as never} className={cx(styles['page'])}>{children}</div>;
}
