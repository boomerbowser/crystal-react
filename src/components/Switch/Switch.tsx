'use client';

/* Switch.
 *
 * React Aria's Switch gives it `role="switch"` with `aria-checked`. A switch and
 * a checkbox are announced differently because they mean different things. A
 * checkbox is a value in a form that will be submitted; a switch takes effect
 * now. Rendering one as the other tells the reader the wrong thing about when
 * their change applies.
 *
 * State does not rely on position alone. The track changes colour and the thumb
 * changes with it, so the control is readable in greyscale, at a glance, and by
 * somebody who cannot tell which end is which. That is the most common failure
 * in this control, and the one the catalogue names.
 *
 * Crystal's `switch-on` and `switch-off` recipes play on the value, not on the
 * click, so a keyboard user sees what a pointer user sees.
 */
import { forwardRef, useEffect, useRef, type ReactNode } from 'react';
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import styles from './Switch.module.scss';

export interface SwitchProps extends Omit<AriaSwitchProps, 'className' | 'style' | 'children'> {
  /** The label. A switch with no label is a control nobody can name. */
  children?: ReactNode;
  className?: string;
}

export const Switch = forwardRef<HTMLLabelElement, SwitchProps>(function Switch(
  { children, className, ...props },
  ref,
) {
  const [scope, play] = useMotion();

  return (
    <AriaSwitch {...props} ref={mergeRefs(scope as never, ref)} className={cx(styles['switch'], className)}>
      {({ isSelected }) => (
        <>
          <SwitchMotion isSelected={isSelected} play={play} />
          <span className={cx(styles['track'])}>
            <span className={cx(styles['thumb'])} />
          </span>
          <span>{children}</span>
        </>
      )}
    </AriaSwitch>
  );
});

/**
 * Bound to the value rather than to the press, so a switch changed by a form
 * reset or by a server response animates the same way one changed by hand does.
 *
 * It reads the value React Aria resolved. Reading
 * `props.isSelected ?? props.defaultSelected ?? false` does not work, because an
 * uncontrolled switch has neither prop, so the value would stay `false` and an
 * uncontrolled switch would never animate.
 *
 * A component rather than an effect in the parent, because the resolved value
 * arrives through a render function and hooks cannot be called inside one.
 */
function SwitchMotion({ isSelected, play }: {
  isSelected: boolean;
  play: ReturnType<typeof useMotion>[1];
}): null {
  /* Undefined first, so a switch that mounts already on does not animate:
     motion marks the moment a state is entered, and that one was never entered. */
  const previous = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (previous.current !== undefined && previous.current !== isSelected) {
      play(isSelected ? 'switch-on' : 'switch-off');
    }
    previous.current = isSelected;
  }, [isSelected, play]);

  return null;
}
