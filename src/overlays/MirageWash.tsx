'use client';

/* The Mirage wash of a modal overlay, drawn on its own layer (R-37).
 *
 * React Aria's `Modal` sits inside its `ModalOverlay`. When the overlay itself
 * wore `.cr-mirage`, it became a backdrop root. A `backdrop-filter` on a
 * surface inside it, such as a drawer's Frost or a palette's Haze, then sees
 * only the overlay's own layer, not the page, so it blurred nothing and the
 * page read through the panel sharp.
 *
 * So the overlay carries layout only, and the wash is this layer, its first
 * child and the panel's sibling. Every backdrop filter now reaches the page:
 * the wash diffuses it, and the panel above diffuses the wash and the page
 * together. The overlay is a stacking context (`isolation`), and the wash sits
 * at the bottom of it, so it paints under the panel whatever the panel's
 * positioning. It is decoration and is hidden from assistive technology.
 *
 * Inside Motion's `AnimatePresence` the wash plays `mirage` in and
 * `mirage-out` away, and Motion keeps the overlay mounted until it has. Pass
 * nothing for a wash that does not move.
 */
import { motion } from 'motion/react';
import type { PresetMotionProps } from '../motion/usePresetMotion.js';
import { cx } from '../styles/cx.js';
import styles from './MirageWash.module.scss';

export function MirageWash(wash: PresetMotionProps): React.JSX.Element {
  return <motion.div aria-hidden="true" data-cr-wash="" className={cx('cr-mirage', styles['wash'])} {...wash} />;
}

/** The class an overlay that holds a `MirageWash` needs, so the wash paints under its panel. */
export const washHolder: string = styles['holder'] ?? '';
