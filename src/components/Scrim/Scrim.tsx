'use client';

/* Scrim.
 *
 * The Mirage layer between an overlay and the scene beneath it, as its own
 * component because three things need it — a dialog, a drawer, a command palette
 * — and three copies of a material recipe is three chances to get one wrong.
 *
 * What the catalogue asks of it, and what this cannot supply on its own:
 * "content beneath is inert; the scrim is not a focus target; clicking it
 * dismisses only when dismissal is safe". Inertness belongs to whatever put the
 * overlay up — React Aria's `ModalOverlay` does it properly, with `aria-hidden`
 * on the rest of the document and focus contained — so this renders the wash and
 * nothing else, and is documented as not being a modality mechanism. A scrim that
 * looked modal without being modal would be the worse failure of the two.
 */
import type { ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './Scrim.module.scss';

export interface ScrimProps {
  /** Centre what is inside it. A drawer's scrim holds its panel against an edge instead. */
  isCentred?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Scrim({ isCentred = true, children, className }: ScrimProps): React.JSX.Element {
  return (
    <div
      /* Deliberately **not** `aria-hidden`. The scrim usually wraps the overlay
         it separates, and hiding the wrapper hides the dialog inside it — which
         would make every modal in the library invisible to a screen reader. It
         needs no hiding anyway: a div with no role and nothing focusable is
         already nothing to announce. */
      className={cx(styles['scrim'], isCentred ? styles['centred'] : undefined, className)}
    >
      {children}
    </div>
  );
}
