'use client';

/* React Aria's `Popover`, playing its arrival.
 *
 * A popover mounts when it opens and unmounts when it closes, so its mount *is*
 * the opening, and the recipe the catalogue names for it — `menu-in` for a
 * select's list or a picker's calendar, `popover-in` for a combobox's
 * suggestions — plays once, then. The recipe is the caller's to name, at the
 * call site, because it differs by what the popover holds.
 *
 * And its exit — `menu-out`, `popover-out` — as it closes, through
 * `Departure`, which starts the recipe where React Aria's own exit handling
 * will find it running and wait for it.
 */
import { forwardRef, useMemo } from 'react';
import { Popover, type PopoverProps } from 'react-aria-components';
import { useMotion } from '../motion/useMotion.js';
import { Arrival } from '../motion/Arrival.js';
import { Departure } from '../motion/Departure.js';
import { mergeRefs } from '../utils/mergeRefs.js';

export interface ArrivingPopoverProps extends PopoverProps {
  /** The catalogue's arrival for what this popover holds. */
  recipe: 'menu-in' | 'popover-in';
  /** And its departure, held on screen until it has played. */
  exit: 'menu-out' | 'popover-out';
}

export const ArrivingPopover = forwardRef<HTMLElement, ArrivingPopoverProps>(function ArrivingPopover(
  { recipe, exit, children, ...props },
  ref,
) {
  const [scope, play] = useMotion();
  /* Stable, or React detaches the old callback — nulling the scope — on every
     commit and attaches the new one only after the children's layout effects,
     which is exactly when `Departure` reads it. */
  const merged = useMemo(() => mergeRefs(ref, scope as never), [ref, scope]);
  return (
    <Popover {...props} ref={merged as never}>
      {(renderProps) => (
        <>
          <Arrival play={play} recipe={recipe} />
          <Departure isExiting={renderProps.isExiting} play={play} recipe={exit} scope={scope} />
          {typeof children === 'function' ? children(renderProps) : children}
        </>
      )}
    </Popover>
  );
});
