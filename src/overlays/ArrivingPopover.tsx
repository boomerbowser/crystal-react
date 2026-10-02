'use client';

/* React Aria's `Popover`, playing its arrival.
 *
 * A popover mounts when it opens and unmounts when it closes, so its mount is
 * the opening. The recipe the catalogue names for it plays once, then: `menu-in`
 * for a select's list or a picker's calendar, `popover-in` for a combobox's
 * suggestions. The caller names the recipe at the call site, because it
 * depends on what the popover holds.
 *
 * The exit (`menu-out`, `popover-out`) plays as it closes, through `Departure`,
 * which starts the recipe where React Aria's exit handling finds it running and
 * waits for it.
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
  /* Kept stable. Otherwise React detaches the old callback on every commit,
     nulling the scope, and attaches the new one only after the children's
     layout effects, which is when `Departure` reads it. */
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
