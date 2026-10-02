'use client';

/* Stepper. An ordered sequence with a position and per-step state.
 *
 * Every state is announced as well as drawn. A tick, a number and a warning
 * glyph mean nothing to a reader who does not see them. Each step carries its
 * state as text in its accessible name, such as "Step 2 of 4: Details, current".
 * Without it the list would differ from step to step only in colour and a
 * symbol, which fails the same way Crystal's status colours would if they were
 * not paired with a label and a shape.
 *
 * The current step takes `aria-current="step"`, the value defined for this.
 * `page` is where you are in a site, and `aria-selected` belongs to a widget
 * with a selection model.
 *
 * It is an ordered list, because the order is the meaning. A stepper whose
 * steps are `div`s tells a screen reader nothing about how many there are or
 * which one this is. `<ol>` says both, and the "of 4" in the name says it again
 * where a reader hears it.
 *
 * There are two geometries because the catalogue names two. `stepper` is
 * "circular markers; connector 2px" on a Haze track; `checkout-steps` is "steps
 * are pills; connectors are hairlines". Everything above this paragraph is
 * identical between them, and a second component would be a second place for
 * `aria-current` and the state wording to drift. So the shape is a prop, and
 * `CheckoutSteps` is this with that prop set and a commerce default for its
 * name.
 *
 * A step is navigable only where navigation is real. A step with an
 * `onNavigate` is a button; one without is not focusable at all. A
 * disabled-looking control that takes focus and does nothing is worse than one
 * that is plainly inert.
 */
import { Button } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import styles from './Stepper.module.scss';

export type StepState = 'upcoming' | 'current' | 'complete' | 'error';

export interface StepperStep {
  id: string;
  label: string;
  /** A line under the label. Part of the accessible name. */
  description?: string;
  state?: StepState;
  /** Whether this step can be returned to. */
  isDisabled?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Told which step was chosen. A step with no handler is not a control. */
  onNavigate?: (id: string) => void;
  /** Laid out down the block axis rather than across. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * `marker` is the catalogue's `stepper`, with circular markers on a Haze track.
   * `pill` is its `checkout-steps`, with pills and hairline connectors.
   */
  shape?: 'marker' | 'pill';
  /** Names the list, so two steppers are distinguishable. */
  'aria-label'?: string;
  /**
   * How each state is said. Overridable because it is user-facing text, and a
   * product in another language needs it to be.
   */
  stateLabels?: Record<StepState, string>;
  className?: string;
}

const DEFAULT_STATE_LABELS: Record<StepState, string> = {
  upcoming: 'not started',
  current: 'current',
  complete: 'complete',
  error: 'needs attention',
};

export function Stepper({
  steps, onNavigate, orientation = 'horizontal', shape = 'marker',
  stateLabels = DEFAULT_STATE_LABELS, className, ...props
}: StepperProps): React.JSX.Element {
  return (
    <ol
      aria-label={props['aria-label'] ?? 'Progress'}
      data-orientation={orientation}
      data-shape={shape}
      className={cx(styles['stepper'], className)}
    >
      {steps.map((step, index) => {
        const state: StepState = step.state ?? 'upcoming';
        /* The whole state, in words, in the name. A reader hears the position,
           the label and where it stands without seeing the marker. */
        const name = `Step ${String(index + 1)} of ${String(steps.length)}: ${step.label}`
          + (step.description ? `, ${step.description}` : '')
          + `, ${stateLabels[state]}`;
        const isNavigable = Boolean(onNavigate) && !step.isDisabled;

        const body = (
          <>
            <span className={cx(styles['marker'])} aria-hidden="true">
              {state === 'complete' ? '✓' : state === 'error' ? '!' : index + 1}
            </span>
            <span className={cx(styles['text'])}>
              <span className={cx(styles['label'])}>{step.label}</span>
              {step.description ? <span className={cx(styles['description'])}>{step.description}</span> : null}
            </span>
          </>
        );

        return (
          <StepItem
            key={step.id}
            isCurrent={state === 'current'}
            data-state={state}
            {...(state === 'current' ? { 'aria-current': 'step' as const } : {})}
            className={cx(styles['step'])}
          >
            {isNavigable ? (
              <Button aria-label={name} onPress={() => onNavigate?.(step.id)} className={cx(styles['control'], shape === 'marker' && 'cr-bare')}>
                {body}
              </Button>
            ) : (
              /* Not focusable. A control that takes focus and does nothing is
                 worse than one that is plainly inert. */
              <span className={cx(styles['control'])} aria-label={name} role="text">{body}</span>
            )}
          </StepItem>
        );
      })}
    </ol>
  );
}

/* A step. It plays `selection` when it becomes the current one because the flow
   moved on or back, and not on the render that first shows it current. */
function StepItem({ isCurrent, ...props }: React.LiHTMLAttributes<HTMLLIElement> & { isCurrent: boolean; 'data-state'?: string }): React.JSX.Element {
  const scope = useChangeMotion(isCurrent, entered('selection'));
  return <li ref={scope as never} {...props} />;
}
