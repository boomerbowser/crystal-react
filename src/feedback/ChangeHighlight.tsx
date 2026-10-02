'use client';

/* Crystal's `highlight`: "a brief update cue paired with actual content".
 *
 * Put it inside the element whose content changes, which must be positioned. It
 * paints nothing at rest and plays once each time that element's text changes
 * after the first render, such as a figure replaced or a count moved on. It
 * compares the text and not a prop, because the content is usually a React
 * element, which is a new object on every render whether anything changed or
 * not. Comparing those would flash the cue every time a parent re-rendered.
 *
 * The content has already changed when it plays. The cue marks the change and
 * does not delay it. Under reduced motion it plays nothing, and the new value is
 * there. It is `aria-hidden` because it is decoration. Anything a reader needs
 * to know about the change is the caller's to say, in the content or a live
 * region.
 */
import { useEffect, useRef } from 'react';
import { useMotion } from '../motion/useMotion.js';
import { cx } from '../styles/cx.js';
import styles from './ChangeHighlight.module.scss';

export function ChangeHighlight(): React.JSX.Element {
  const [scope, play] = useMotion();
  const previous = useRef<string | null>(null);
  /* Runs on every render. The text is read after React has written it, and
     reading one string is cheaper than any check that would skip it. */
  useEffect(() => {
    const text = (scope.current as HTMLElement | null)?.parentElement?.textContent ?? '';
    if (previous.current !== null && previous.current !== text) void play('highlight');
    previous.current = text;
  });
  return <span ref={scope as never} aria-hidden="true" className={cx(styles['layer'])} />;
}
