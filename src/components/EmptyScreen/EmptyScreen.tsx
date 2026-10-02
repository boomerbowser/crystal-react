'use client';

/* EmptyScreen: a whole view with nothing in it yet.
 *
 * "Says what would be here and offers the action that creates it."
 *
 * The catalogue lists this beside `empty-state`. `EmptyState` is a region that
 * has come up empty, and this is a view that has. So the card is `EmptyState`,
 * unchanged, and this file adds the frame: the view's height, its safe areas,
 * and a cap at the reading measure, so a wide display does not put the sentence
 * and its button at opposite ends of a line too long to track across.
 *
 * It does not paint. `EmptyState` already carries the Haze fill and the content
 * radius the catalogue asks for here. Painting them again would put a Haze pad
 * inside a Haze pad, two materials deep for one piece of content, with the outer
 * one showing as a slightly wrong rectangle behind the inner one.
 *
 * It does not claim the heading either. A view whose content region is empty is
 * still that view. The page header goes on naming it, and `EmptyState` labels
 * its own group instead of competing for the `h1`. The screens that replace a
 * view outright (error, not found, permission) do take a heading, at level 1 by
 * default, because nothing else is left on the page to hold one.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { EmptyState, type EmptyStateKind } from '../EmptyState/EmptyState.js';
import { cx } from '../../styles/cx.js';
import styles from './EmptyScreen.module.scss';

export interface EmptyScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Which kind of empty. Required, as it is on `EmptyState`. */
  state?: EmptyStateKind;
  /** What would be here. Required, because an illustration is not text. */
  title: ReactNode;
  children?: ReactNode;
  /** The action that creates the first one. */
  actions?: ReactNode;
  /** Decoration. Always hidden from assistive technology. */
  illustration?: ReactNode;
}

export function EmptyScreen({
  state = 'empty', title, children, actions, illustration, className, ...props
}: EmptyScreenProps): React.JSX.Element {
  return (
    <div {...props} className={cx(styles['screen'], className)}>
      <EmptyState
        state={state}
        title={title}
        className={cx(styles['card'])}
        {...(actions === undefined ? {} : { actions })}
        {...(illustration === undefined ? {} : { illustration })}
      >
        {children}
      </EmptyState>
    </div>
  );
}
