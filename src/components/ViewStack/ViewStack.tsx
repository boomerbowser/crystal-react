'use client';

/* ViewStack shows pushed views with a back affordance.
 *
 * "Focus moves to the new view and **returns on pop**; the back control is a
 * real button." "Views enter and leave along the reading direction."
 *
 * Focus is the contract. The movement is decoration. Pushing a view replaces
 * what the reader was looking at. Focus left on the control that pushed would
 * sit on a button that is no longer displayed, and the next key press would go
 * nowhere. Popping has the mirror problem: the reader came from somewhere, and
 * leaving focus on the document body sends them to the top of the page. So on a
 * push and on a pop, focus moves to the region of the view now on screen. On a
 * pop, the control the reader left was unmounted with its view, so the view
 * they return to is where focus returns. `Drawer` and `Banner` carry the same
 * contract, here applied to a whole view.
 *
 * The back control is a real button. A back affordance drawn as an icon in a
 * div is unreachable by keyboard and unnamed to a screen reader, and the
 * browser's own back button is not a route the product offered.
 *
 * Movement. Crystal authors `view-push-in` (a view arriving from the inline-end
 * edge) and `view-push-out` (the view it covers travelling a fraction of that
 * distance behind it). Two recipes instead of four, because a pop is a push
 * mirrored and right-to-left is a push mirrored again, which is what `reorient`
 * points.
 *
 * On a push both are played: the arriving view takes `view-push-in`, and the
 * view it covers stays mounted, inert and hidden from assistive technology,
 * long enough to take `view-push-out` and travel a fraction of the distance
 * behind it, so the two read as one stack. It keeps its React key while it
 * leaves, so it is the same instance rather than a copy, and it unmounts when
 * the movement ends (at once under reduced motion). A pop plays the arrival
 * mirrored on the view that returns; the view it leaves is gone at once, as
 * the view a person is going back from no longer matters.
 *
 * A push and a pop are the same recipe pointing opposite ways, so there are two
 * hooks with fixed orientations instead of one whose mirror is recomputed. A
 * single hook would have to change its `reorient` as the stack moved, but it
 * animates with the value captured when the hook rendered. The pop would then
 * play with the push's orientation and arrive from the edge it was leaving
 * towards.
 *
 * Both recipes are Crystal's, published in `@crystal-ui/core` 2.1.0 and
 * required here. Do not add a `getRecipe` guard. A missing recipe is a mistake,
 * not a version skew, and `useMotion` throws on one so the mistake is visible.
 * A guard would turn it into a stack that silently does not move.
 */
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { useDirection } from '../../theme/hooks.js';
import { Button } from '../Button/Button.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import styles from './ViewStack.module.scss';

const ARRIVES = 'view-push-in';
const COVERED = 'view-push-out';

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
  /* The covered view travels towards the inline-start edge, mirrored for
     right-to-left. */
  const [coveredScope, playCovered] = useMotion({ reorient: { mirrorInline: rtl } });
  const top = views.at(-1);
  const beneath = views.at(-2);
  const previousDepth = useRef(views.length);
  const region = useRef<HTMLElement | null>(null);
  const [leaving, setLeaving] = useState<StackedView | null>(null);
  /* Which view a push covered is worked out while rendering, not in an effect,
     so the commit that mounts the arrival still holds the covered view under
     its own key and React keeps the instance. An effect would run after that
     commit had already unmounted it. */
  const [seen, setSeen] = useState({ depth: views.length, top });
  if (seen.depth !== views.length || seen.top?.id !== top?.id) {
    const pushed = views.length > seen.depth;
    setSeen({ depth: views.length, top });
    setLeaving(pushed && seen.top !== undefined && top !== undefined && seen.top.id !== top.id ? seen.top : null);
  }

  useEffect(() => {
    const was = previousDepth.current;
    previousDepth.current = views.length;
    if (was === views.length || top === undefined) return;

    /* Pushed or popped, focus lands on the view that is now on screen. On a
       push, the view has replaced what the reader was looking at and there is
       no way to know which of its controls they want. On a pop, the control
       they left was unmounted with its view. Otherwise focus would fall to the
       document body, which is the top of the page. */
    region.current?.focus();

    void (views.length > was ? playPush : playPop)(ARRIVES);
  }, [views.length, top, playPush, playPop]);

  /* Once the covered view is on screen beneath the arrival, it leaves. */
  useEffect(() => {
    if (leaving === null) return;
    let current = true;
    void playCovered(COVERED).finally(() => { if (current) setLeaving(null); });
    return () => { current = false; };
  }, [leaving, playCovered]);

  if (top === undefined) {
    return <div {...props} className={cx(styles['stack'], className)} />;
  }

  return (
    <div
      {...props}
      data-cr-depth={views.length}
      className={cx(styles['stack'], className)}
    >
      {leaving === null || leaving.id === top.id ? null : (
        <section
          key={leaving.id}
          ref={coveredScope as never}
          aria-hidden="true"
          inert
          className={cx(styles['view'], styles['covered'])}
        >
          {leaving.children}
        </section>
      )}
      <section
        key={top.id}
        ref={mergeRefs(region, pushScope as never, popScope as never)}
        aria-label={top.label}
        /* Focusable as the target of the move above, never a tab stop. A region
           the keyboard stops on for no reason announces nothing. */
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
