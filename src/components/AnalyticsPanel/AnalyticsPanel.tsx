'use client';

/* AnalyticsPanel: a chart with its controls, legend and range picker.
 *
 * "The chart carries a table equivalent; controls are real controls."
 * States: `at-rest`, `loading`, `empty`, `error`.
 *
 * The table equivalent is not this component's to add. `ChartSurface` takes
 * `table` as a required prop, so a chart in this library cannot exist without
 * the same data as text. A panel that accepted a bare `<svg>` as its chart
 * would be a way around that requirement, so the chart is passed through as a
 * node and the requirement stays where it is enforced.
 *
 * Four states, and three of them are where panels go wrong. A chart that is
 * loading, empty or failed is usually drawn as an empty plot with axes. It
 * says "zero" to anyone reading it, and "zero" is a number. So each of the
 * three replaces the chart rather than decorating it, and each says which it
 * is in words: `Loader` for a wait, `EmptyState` for nothing to draw, `Result`
 * for a failure. The panel's frame, heading and controls stay, because they
 * are how the reader changes the range that might fix it.
 *
 * `error` is `role="alert"` where `empty` is not, for the same reason
 * `ErrorScreen` is and `EmptyScreen` is not: one is a failure and one is a fact.
 */
import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { Loader } from '../Loader/Loader.js';
import { EmptyState } from '../EmptyState/EmptyState.js';
import { Result } from '../Result/Result.js';
import { cx } from '../../styles/cx.js';
import styles from './AnalyticsPanel.module.scss';

export type AnalyticsPanelState = 'at-rest' | 'loading' | 'empty' | 'error';

export interface AnalyticsPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** What the panel is of. The panel's heading, and its region's name. */
  title: ReactNode;
  /** Which heading level this is in the page it sits in. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The range picker and anything else that changes what is drawn. */
  controls?: ReactNode;
  /** A `ChartSurface`, which carries its own table equivalent and legend. */
  children?: ReactNode;
  state?: AnalyticsPanelState;
  /** What is missing, when there is nothing to draw. */
  emptyLabel?: ReactNode;
  /** What failed, when it did. Never only a code. */
  errorLabel?: ReactNode;
  /** What to try. */
  errorActions?: ReactNode;
}

export function AnalyticsPanel({
  title, headingLevel = 2, controls, children, state = 'at-rest',
  emptyLabel = 'Nothing to chart for this range',
  errorLabel = 'The chart could not be drawn',
  errorActions, className, ...props
}: AnalyticsPanelProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const id = useId();

  return (
    <section
      {...props}
      aria-labelledby={`${id}-title`}
      aria-busy={state === 'loading' || undefined}
      data-cr-state={state}
      className={cx(styles['panel'], className)}
    >
      <div className={cx(styles['top'])}>
        <Heading id={`${id}-title`} className={cx(styles['heading'])}>{title}</Heading>
        {controls ? <div className={cx(styles['controls'])}>{controls}</div> : null}
      </div>

      {/* Each of the three replaces the chart. An empty plot with axes reads as
          zero, and zero is a number the data did not say. */}
      {state === 'loading' ? <Loader label="Drawing the chart" /> : null}
      {state === 'empty' ? <EmptyState state="no-results" title={emptyLabel} /> : null}
      {state === 'error' ? (
        <div role="alert">
          <Result outcome="error" title={errorLabel} headingLevel={Math.min(headingLevel + 1, 6) as 3} {...(errorActions === undefined ? {} : { actions: errorActions })} />
        </div>
      ) : null}
      {state === 'at-rest' ? children : null}
    </section>
  );
}
