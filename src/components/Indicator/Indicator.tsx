'use client';

/* Indicator — a small circular mark attached to a control, carrying state.
 *
 * Every word of "the real control supplies the state; the mark only shows it" is
 * load-bearing. The indicator is `aria-hidden` and is never a click target: it
 * sits on a navigation entry, a busy control or a field, and that control already
 * carries `aria-current`, `aria-busy`, `required` or `aria-invalid`. A mark that
 * announced anything would say it twice, and a mark that could be pressed would
 * be a second control for the same thing.
 *
 * **It is Crystal's `.cr-indicator`, and its host decides what it shows.** A
 * 20px Haze disc with a feathered fill at the host's top end corner, carrying a
 * glyph rather than a colour: ● on a host that is `aria-current`, … on one that
 * is `aria-busy`, and nothing otherwise; on a field shell ○ at rest, ● focused,
 * * required and ! invalid, read from the field inside it. Shape rather than
 * colour, so the state never rests on colour alone — and because the host's own
 * attributes switch it, the mark cannot disagree with the control it describes.
 * It must be the host's own child for that to work.
 *
 * Until Crystal React adopted 2.3.0 (R-25) this was a colour dot whose fill was
 * the state, set by a `state` prop, and it had a `selection` kind. Selection in
 * Crystal is label weight and nothing drawn beside the label, so that kind is
 * gone rather than renamed.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../styles/cx.js';

/** What the host's state is shown as. There is no selection kind: selection is weight. */
export type IndicatorKind = 'current' | 'busy' | 'field';

export interface IndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * `current` shows on a host that is `aria-current`; `busy` on one that is
   * `aria-busy`; `field` inside a `.cr-field-shell`, reading its field.
   */
  kind: IndicatorKind;
}

export const Indicator = forwardRef<HTMLSpanElement, IndicatorProps>(function Indicator(
  { kind, className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      /* The control says what this means. The mark only shows it. */
      aria-hidden="true"
      data-kind={kind}
      className={cx('cr-indicator', className)}
    />
  );
});
