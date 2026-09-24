'use client';

/* The ring, and the one thing in this library that turns.
 *
 * `RingProgress` and `Loader` draw the same object: a track, an arc on it, and
 * — when nobody knows how far along the work is — that arc going round. They are
 * one component rather than two that agree, for the reason
 * `--cr-progress-ring-stroke` exists at all: a loader and a ring progress that
 * were built separately end up two different sizes of the same idea, and then
 * the difference has to be explained instead of just being absent.
 *
 * `fraction` is what separates them. A number means "this far", drawn still. Its
 * absence means "we do not know", drawn turning. That is the same distinction
 * `Progress` makes by having no `indeterminate` flag, and it is made the same
 * way here so it cannot be made differently.
 *
 * **The canvas turns, not the arc.** An SVG arc rotated with `transform-origin`
 * does not turn about the circle it was drawn on: `transform-box: view-box`
 * resolves the origin against the SVG viewport rather than against the user
 * space `arcPath` draws in, and every combination of the two was measured
 * sending the arc into orbit around its own ring — by 15px at best and 103px at
 * worst. An `<svg>` root is an ordinary CSS box, where `50% 50%` means the
 * middle of the drawing. The full-circle track turns with it and cannot be seen
 * to. `verify:appearance` holds it.
 */
import { type ReactNode } from 'react';
import { arcPath } from '../charts/Radial.js';
import { chartGeometry } from '../theme/chartGeometry.js';
import { cx } from '../styles/cx.js';
import styles from './ActivityArc.module.scss';

const TURN = Math.PI * 2;

/** How much of the circle a turning arc occupies. A sixth: enough to read as a
 *  mark rather than a dot, short enough that nobody mistakes it for a value. */
const BUSY_SWEEP = TURN / 6;

export interface ActivityArcProps {
  /** Diameter in pixels. */
  size: number;
  /** How far along, from 0 to 1. **Omit it to turn.** */
  fraction?: number;
  /** Stopped, or failed. Neither is a colour alone where it is used. */
  state?: 'at-rest' | 'error' | 'paused';
  className?: string | undefined;
}

export function ActivityArc({
  size, fraction, state = 'at-rest', className,
}: ActivityArcProps): ReactNode {
  const stroke = chartGeometry.ringStroke;
  const radius = size / 2;
  const determinate = fraction !== undefined;

  return (
    <svg
      className={cx(styles['canvas'], className)}
      width={size}
      height={size}
      /* Centred on the origin, because `arcPath` draws around (0,0) and a `<g>`
         translating them into a corner-origin box would put the element's user
         space and the view box a radius apart. */
      viewBox={`${-radius} ${-radius} ${size} ${size}`}
      aria-hidden="true"
      data-determinate={determinate ? '' : undefined}
      data-state={state}
    >
      <path className={styles['track']} d={arcPath(radius, stroke, 0, TURN)} />
      <path
        className={styles['arc']}
        d={arcPath(radius, stroke, 0, determinate ? TURN * Math.min(1, Math.max(0, fraction)) : BUSY_SWEEP)}
      />
    </svg>
  );
}
