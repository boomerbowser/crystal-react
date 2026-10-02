'use client';

/* LoadingOverlay. A scrim over a region, with a centred activity mark.
 *
 * "Blocked content is **inert**; focus does not enter it; the reason is
 * announced." All three apply, and the first is the one usually missed. A
 * scrim drawn over a region hides it and stops the mouse. It does nothing about
 * the tab key, so a keyboard reader walks straight into a form they cannot see
 * and fills in fields that are about to be replaced. `inert` takes the subtree
 * out of the tab order, out of hit testing and out of the accessibility tree in
 * one attribute. This component wraps its region so that it can reach the
 * content and make it inert.
 *
 * `Mirage` is the material, at region scope. It is the same layer a dialog puts
 * between itself and the scene, doing the same job one level down. It inherits
 * the region's radius, because this region is what is blocked, and a square
 * wash over a rounded panel says the page is.
 *
 * The mark is a `Loader`, so the reason is in words, such as "Saving changes".
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
            two do two thirds of the job and leave the tab key alone. */}
        {/* `data-cr-blocked` is always present and says which state it is in.
            A gate that found the region by its `inert` attribute would crash
            when the attribute went missing, instead of reporting a failed
            check. */}
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
