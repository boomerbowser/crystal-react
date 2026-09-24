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
 * **On the movement.** Crystal authors `view-push-in` — a view arriving from the
 * inline-end edge — and `view-push-out`, the view it covers travelling a
 * fraction of that distance behind it. Two recipes rather than four, because a
 * pop is a push mirrored and right-to-left is a push mirrored again, which is
 * what `reorient` points.
 *
 * Only the arrival is played here, and that is a consequence of the stack rather
 * than an omission: the covered view is *unmounted*, so there is nothing left to
 * play a departure on. `view-push-out` is for a stack that keeps its views
 * mounted, which is a different component.
 *
 * A push and a pop are the same recipe pointing opposite ways, so there are two
 * hooks with fixed orientations rather than one whose mirror is recomputed. A
 * single hook would have to change its `reorient` as the stack moved, and the
 * value it animates with is the one captured when the hook rendered — so the
 * pop would play with the push's orientation and arrive from the edge it was
 * leaving towards. Inert while the recipe is unavailable, and wrong the day it
 * arrives, which is the worst order for a defect to appear in.
 *
 * Both recipes are Crystal's, published in `@crystal-ui/core` 2.1.0 and
 * required here. There was a `getRecipe` guard while this library was still
 * pinned to `^2.0.0` and the recipes were unreachable; it is gone with the
 * pin, and deliberately, because it was the right shape for exactly one
 * situation and the wrong shape for every other. A missing recipe is now a
 * mistake rather than a version skew, and `useMotion` throwing on one is how a
 * mistake becomes visible. A guard would turn it back into a stack that
 * silently does not move.
 */
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
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
  const rtl = direction === 'rtl';
  /* Forward: from the inline-end edge, mirrored for right-to-left. */
  const [pushScope, playPush] = useMotion({ reorient: { mirrorInline: rtl } });
  /* Back: the same recipe pointing the other way, mirrored again for RTL. */
  const [popScope, playPop] = useMotion({ reorient: { mirrorInline: !rtl } });
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

    void (views.length > was ? playPush : playPop)(ARRIVES);
  }, [views.length, top, playPush, playPop]);

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
        ref={mergeRefs(region, pushScope as never, popScope as never)}
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
