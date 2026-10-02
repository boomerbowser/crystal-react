'use client';

/* Collapse is a region that opens and closes.
 *
 * "Hidden content is genuinely hidden from assistive technology." That rules out
 * the usual `max-height: 0` trick, which leaves a zero-height region full of
 * focusable links that a keyboard user can still tab into and a screen reader
 * still reads. So a collapsed region is not rendered at all.
 *
 * That affects the exit recipe. `accordion-out` marks a region closing, and a
 * region that unmounted the moment the state changed would play it into a node
 * that is no longer in the document. `useMotion`'s `play` returns a promise that
 * settles when the movement finishes, so the content stays for exactly as long
 * as the recipe runs and then goes. Under reduced motion the promise settles
 * immediately and the region disappears, which is the correct behaviour.
 *
 * The trigger is not here. A disclosure's button carries `aria-expanded` and
 * `aria-controls`, and both have to name this region, so the caller owns the
 * button and passes the `id`.
 *
 * `Accordion` is not built on this, and the difference is the exit. It uses
 * React Aria's `DisclosurePanel`, which hides the panel with
 * `hidden="until-found"`, so a collapsed accordion row is still reachable by
 * find-in-page. The catalogue asks for that there, and this component
 * deliberately does not do it. In exchange, React Aria owns the hiding and
 * applies it as soon as the panel's own animations settle, so `accordion-out`
 * cannot run there. It runs here because this component owns the unmount.
 */
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Collapse.module.scss';

export interface CollapseProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the region is open. */
  isExpanded: boolean;
  children: ReactNode;
  /** The id the trigger's `aria-controls` points at. */
  id: string;
}

export function Collapse({ isExpanded, children, id, className, ...props }: CollapseProps): ReactNode {
  const [scope, play] = useMotion();
  /* Lags `isExpanded` on the way closed, by exactly the length of the recipe. */
  const [rendered, setRendered] = useState(isExpanded);
  const settled = useRef(false);

  useEffect(() => { if (isExpanded) setRendered(true); }, [isExpanded]);

  useEffect(() => {
    /* The first pass is not a change. Nothing moves at rest, so a region that is
       open when the page loads has not just opened. */
    if (!settled.current) { settled.current = true; return undefined; }

    if (isExpanded) {
      if (rendered) void play('accordion-in');
      return undefined;
    }

    if (!rendered) return undefined;
    let live = true;
    void play('accordion-out').then(() => { if (live) setRendered(false); });
    return () => { live = false; };
  }, [isExpanded, rendered, play]);

  if (!rendered) return null;

  return (
    <div
      {...props}
      id={id}
      ref={scope as never}
      data-expanded={isExpanded ? '' : undefined}
      className={cx(styles['collapse'], className)}
    >
      {children}
    </div>
  );
}
