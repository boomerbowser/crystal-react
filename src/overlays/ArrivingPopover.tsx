'use client';

/* React Aria's `Popover`, playing its arrival.
 *
 * A popover mounts when it opens and unmounts when it closes, so its mount *is*
 * the opening, and the recipe the catalogue names for it — `menu-in` for a
 * select's list or a picker's calendar, `popover-in` for a combobox's
 * suggestions — plays once, then. The recipe is the caller's to name, at the
 * call site, because it differs by what the popover holds.
 *
 * The exit (`menu-out`, `popover-out`) is not played here: React Aria unmounts
 * the popover as it closes, and holding it for an exit is the structural change
 * R-24 records rather than something a wrapper can do.
 */
import { forwardRef } from 'react';
import { Popover, type PopoverProps } from 'react-aria-components';
import { useMotion } from '../motion/useMotion.js';
import { Arrival } from '../motion/Arrival.js';
import { mergeRefs } from '../utils/mergeRefs.js';

export interface ArrivingPopoverProps extends PopoverProps {
  /** The catalogue's arrival for what this popover holds. */
  recipe: 'menu-in' | 'popover-in';
}

export const ArrivingPopover = forwardRef<HTMLElement, ArrivingPopoverProps>(function ArrivingPopover(
  { recipe, children, ...props },
  ref,
) {
  const [scope, play] = useMotion();
  return (
    <Popover {...props} ref={mergeRefs(ref, scope as never) as never}>
      {(renderProps) => (
        <>
          <Arrival play={play} recipe={recipe} />
          {typeof children === 'function' ? children(renderProps) : children}
        </>
      )}
    </Popover>
  );
});
