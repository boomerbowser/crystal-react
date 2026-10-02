'use client';

/* Scrim.
 *
 * The Mirage layer between an overlay and the scene beneath it. It is its own
 * component because a dialog, a drawer and a command palette all need it, so
 * the material recipe exists once rather than in three copies.
 *
 * The catalogue asks: "content beneath is inert; the scrim is not a focus
 * target; clicking it dismisses only when dismissal is safe". This component
 * cannot supply that on its own. Inertness belongs to whatever put the overlay
 * up. React Aria's `ModalOverlay` does it, with `aria-hidden` on the rest of the
 * document and focus contained. This renders the wash and nothing else, and is
 * documented as not being a modality mechanism, because a scrim that looked
 * modal without being modal would be the worse failure.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { usePresetMotion } from '../../motion/usePresetMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Scrim.module.scss';

export interface ScrimProps {
  /** Centre what is inside it. A drawer's scrim holds its panel against an edge instead. */
  isCentred?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Scrim({ isCentred = true, children, className }: ScrimProps): React.JSX.Element {
  /* The catalogue's `mirage` plays as the scrim arrives and `mirage-out` as it
     goes, computed by Crystal's preset module, as the dialog and the drawer
     play them. The exit plays only when a product shows and hides the scrim
     inside `AnimatePresence`, where Motion can hold it. */
  const wash = usePresetMotion('mirage', 'mirage-out');
  return (
    <motion.div
      {...wash}
      /* Not `aria-hidden`. The scrim usually wraps the overlay it separates, and
         hiding the wrapper hides the dialog inside it, which would make every
         modal in the library invisible to a screen reader. It needs no hiding:
         a div with no role and nothing focusable has nothing to announce. */
      className={cx(styles['scrim'], isCentred ? styles['centred'] : undefined, className)}
    >
      {children}
    </motion.div>
  );
}
