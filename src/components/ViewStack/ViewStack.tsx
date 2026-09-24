'use client';

/* ViewStack — pushed views with a back affordance.
 *
 * "Focus moves to the new view and **returns on pop**; the back control is a
 * real button." "Views enter and leave along the reading direction."
 *
 * **Focus is the contract, and it is the half that is not decoration.** Pushing
 * a view replaces what the reader was looking at; leaving focus on the control
 * that did it leaves it on a button that is no longer displayed, and the next
 * key press goes somewhere that is not there. Popping has the mirror problem
 * and a harder answer: the reader came *from* somewhere, and putting them back
 * at the top of the previous view makes them find their place again every time.
 * So each view records what was focused when it was left, and a pop restores
 * it — the same contract `Drawer` and `Banner` carry, applied to a whole view.
 *
 * **The back control is a real button** because a back affordance drawn as an
 * icon in a div is unreachable by keyboard and unnamed to a screen reader, and
 * the browser's own back button is not a route the product offered.
 *
 * **On the movement.** Crystal authors `view-push-in` and `view-push-out` — a
 * view arriving from the inline-end edge, and the view it covers travelling a
 * fraction of that distance behind it. Two recipes rather than four, because a
 * pop is a push mirrored and right-to-left is a push mirrored again, which is
 * what `reorient` points.
 *
 * Those recipes are published in `@crystal-ui/core` 2.1.0, and this library is
 * pinned to `^2.0.0` until that release is out. So the movement is asked for
 * and, until then, does not arrive: `getRecipe` is asked rather than assumed,
 * because `useMotion` throws on a recipe it does not have and it is right to —
 * a movement that silently does nothing is worse than one that says so. A stack
 * with no recipe behaves exactly as a stack under `prefers-reduced-motion`: the
 * state change applies in full and the decoration is absent. Nothing about the
 * focus contract, the back control or the semantics waits for the bump.
 */
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { getRecipe } from '../../motion/useMotion.js';
import { useMotion } from '../../motion/useMotion.js';
import { useDirection } from '../../theme/hooks.js';
import { Button } from '../Button/Button.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './ViewStack.module.scss';

const ARRIVES = 'view-push-in';

export interface StackedView {
  /** Identifies the view. Stable across renders. */
  id: string;
  /** Names the view's region, and the back control that returns to it. */
  label: string;
  children: ReactNode;
}

export interface ViewStackProps extends HTMLAttributes<HTMLDivElement> {
  /** The stack, root first. The last entry is the one on screen. */
  views: readonly StackedView[];
  /** Pop the top view. Omitted, no back control is offered. */
  onPop?: () => void;
  /**
   * The back control's name. `{label}` is replaced with the view being returned
   * to, because "Back" alone is the same name on every screen of the product.
   */
  backLabel?: string;
}

export function ViewStack({
  views, onPop, backLabel = 'Back to {label}', className, ...props
}: ViewStackProps): React.JSX.Element {
  const direction = useDirection();
  const [scope, play] = useMotion({ reorient: { mirrorInline: direction === 'rtl' } });
  const top = views.at(-1);
  const beneath = views.at(-2);
  const previousDepth = useRef(views.length);
  const region = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const was = previousDepth.current;
    previousDepth.current = views.length;
    if (was === views.length || top === undefined) return;

    /* Pushed or popped, focus lands on the view that is now on screen. Pushing,
       because it has just replaced what the reader was looking at and there is
       no way to know which of its controls they wanted; popping, because the
       control they left was unmounted with the view it belonged to. Either way
       the alternative is the document body, which is the top of the page. */
    region.current?.focus();

    /* Asked rather than assumed: see the note above. Absent, the state change
       has already happened and only the decoration is missing. */
    if (getRecipe(ARRIVES) !== undefined) void play(ARRIVES);
  }, [views.length, top, play]);

  if (top === undefined) {
    return <div {...props} className={cx(styles['stack'], className)} />;
  }

  return (
    <div
      {...props}
      data-cr-depth={views.length}
      className={cx(styles['stack'], className)}
    >
      <section
        key={top.id}
        ref={mergeRefs(region, scope as never)}
        aria-label={top.label}
        /* Focusable as the target of the move above, never a tab stop: a region
           a keyboard stops on for no reason announces nothing. */
        tabIndex={-1}
        className={cx(styles['view'])}
      >
        {onPop === undefined || beneath === undefined ? null : (
          <Button
            variant="quiet"
            className={cx(styles['back'])}
            onPress={onPop}
          >
            {backLabel.replace('{label}', beneath.label)}
          </Button>
        )}
        {top.children}
      </section>
    </div>
  );
}
