'use client';

/* OverlayArrow.
 *
 * Decorative, and hidden from assistive technology: it says where an overlay
 * came from, which a reader already knows because focus moved there.
 *
 * It carries the overlay's material, because a diffusing surface and a flat
 * triangle of a similar colour do not match, and the mismatch lands exactly
 * where the eye is looking. The stylesheet has the details.
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
    /* The class goes on React Aria's own wrapper. React Aria places the wrapper
       along the overlay's edge and supplies the offset that keeps the arrow
       over the trigger. The cross-axis placement, which edge the arrow sits on,
       is the stylesheet's to decide. Styling only the inner element would leave
       the wrapper where the document flow puts it, at the bottom corner of the
       surface. */
    <AriaOverlayArrow className={cx(styles['wrap'], className)}>
      <div aria-hidden="true" {...overlayMaterialProps(material)} className={cx(styles['arrow'])} />
    </AriaOverlayArrow>
  );
}
