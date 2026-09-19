'use client';

/* OverlayArrow.
 *
 * Decorative, and hidden from assistive technology: it says where an overlay
 * came from, which a reader already knows because focus moved there.
 *
 * It carries the overlay's material rather than a colour that resembles it. See
 * the stylesheet for why that matters — the short version is that a diffusing
 * surface and a flat triangle do not match, and the mismatch lands exactly where
 * the eye is looking.
 */
import { OverlayArrow as AriaOverlayArrow } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useOverlayMaterial, overlayMaterialProps } from '../../overlays/surface.js';
import styles from './OverlayArrow.module.scss';

export interface OverlayArrowProps {
  className?: string;
}

export function OverlayArrow({ className }: OverlayArrowProps): React.JSX.Element {
  const material = useOverlayMaterial();
  return (
    /* The class goes on React Aria's own wrapper, not on a div inside it. React
       Aria places the wrapper along the overlay's edge — it supplies the offset
       that keeps the arrow over the trigger — but the cross-axis placement, which
       edge the arrow sits on, is the stylesheet's to decide. Styling only the
       inner element left the wrapper where the document flow put it: the bottom
       corner of the surface. */
    <AriaOverlayArrow className={cx(styles['wrap'], className)}>
      <div aria-hidden="true" {...overlayMaterialProps(material)} className={cx(styles['arrow'])} />
    </AriaOverlayArrow>
  );
}
