'use client';

/* LoadingOverlay — a scrim over a region, with a centred activity mark.
 *
 * "Blocked content is **inert**; focus does not enter it; the reason is
 * announced." All three, and the first is the one that is usually faked. A
 * scrim drawn over a region hides it and stops the mouse; it does nothing at all
 * about the tab key, so a keyboard reader walks straight into a form they cannot
 * see and fills in fields that are about to be replaced. `inert` is the platform
 * answer — it takes the subtree out of the tab order, out of hit testing and out
 * of the accessibility tree in one attribute — and it is why this component
 * wraps its region rather than being dropped on top of it. A component that
 * could not reach the content could not make it inert.
 *
 * `Mirage` is the material, at region scope rather than page scope: it is the
 * same layer a dialog puts between itself and the scene, doing the same job one
 * level down. It inherits the region's radius, because it is *this* region that
 * is blocked and a square wash over a rounded panel says the page is.
 *
 * The mark is a `Loader`, which means the reason is in words: "Saving changes",
 * not a spinner and a guess.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Loader, type LoaderSize } from '../Loader/Loader.js';
import { cx } from '../../styles/cx.js';
import styles from './LoadingOverlay.module.scss';

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Blocked. */
  loading: boolean;
  /** Why. Announced, and shown beside the mark. */
  label: ReactNode;
  /** The region being blocked. */
  children: ReactNode;
  size?: LoaderSize;
  /** Keep the reason for assistive technology only. It is still announced. */
  hideLabel?: boolean;
}

export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay({
    loading, label, children, size = 'medium', hideLabel = false, className, ...props
  }, ref): ReactNode {
    return (
      <div {...props} ref={ref} className={cx(styles['region'], className)} data-loading={loading ? '' : undefined}>
        {/* `inert` rather than `aria-hidden` and `pointer-events: none`: those
            are two thirds of the job and leave the tab key alone. */}
        {/* `data-cr-blocked` is always present and says which state it is in.
            A gate that had to find the region by its `inert` attribute could
            only ever crash when the attribute went missing, and a crash is not
            a failing check. */}
        <div
          className={styles['content']}
          data-cr-blocked={loading ? 'true' : 'false'}
          inert={loading}
        >
          {children}
        </div>
        {loading ? (
          <div className={styles['scrim']}>
            <Loader label={label} size={size} hideLabel={hideLabel} />
          </div>
        ) : null}
      </div>
    );
  },
);
