'use client';

/* QRCode.
 *
 * `qrcode.react` (ISC) renders the code; Crystal owns the quiet zone, the
 * contrast floor and the status surfaces.
 *
 * The code's two colours are fixed black-on-white and do not follow the palette.
 * Every other surface in Crystal takes its colour from the theme. A scanner reads
 * luminance, and a tinted code scans in good light and fails in bad. The quiet
 * zone around it is a Haze fill, so the component still belongs to the surface
 * it sits on.
 *
 * The text alternative is required. A code is an image of a string, and without
 * the string a screen reader user, or anyone whose camera will not focus, has no
 * route to what it encodes. The encoded value is always available as text.
 */
import { QRCodeSVG } from 'qrcode.react';
import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import styles from './QRCode.module.scss';

/* The one place in this library where a colour is not a token. Crystal's
   catalogue carries the rule, "contrast fixed regardless of palette". These are
   constants so that a theme cannot change them. */
const CODE_DARK = '#000000';  // crystal-allow-literal: scannability, never themed
const CODE_LIGHT = '#ffffff';  // crystal-allow-literal: scannability, never themed

export interface QRCodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What the code encodes. Also the text alternative, unless `alt` overrides it. */
  value: string;
  /** Side length in px. */
  size?: number;
  /**
   * Error correction. Higher survives more damage and holds less data; `M` is the
   * usual choice and `H` is what a code with a logo over it needs.
   */
  level?: 'L' | 'M' | 'Q' | 'H';
  /** A caption below the code. The encoded value is announced regardless. */
  caption?: ReactNode;
  /** Dim the code and say so. A code that has expired must not look scannable. */
  isExpired?: boolean;
  /** Overrides the announced text, for a value that is not human-readable. */
  alt?: string;
}

export function QRCode({
  value, size = 160, level = 'M', caption, isExpired = false, alt, className, ...props
}: QRCodeProps): React.JSX.Element {
  const labelId = useId();

  return (
    <div className={cx(styles['qrCode'], isExpired ? styles['expired'] : undefined, className)} {...props}>
      <div role="img" aria-labelledby={labelId}>
        <QRCodeSVG
          value={value}
          size={size}
          level={level}
          fgColor={CODE_DARK}
          bgColor={CODE_LIGHT}
          /* The quiet zone is the component's Haze padding. The library's own
             white margin would draw a white rectangle inside it. */
          marginSize={0}
          /* The name lives on the wrapper, which has the img role. Visible to
             assistive technology, the inner svg is a second, unnamed image of the
             same thing, and axe reports it. */
          aria-hidden="true"
        />
      </div>
      {/* Always rendered as text: the encoded value is the alternative to the
          image of it. */}
      <span id={labelId} className={cx(styles['caption'])}>
        {alt ?? (isExpired ? `Expired code for ${value}` : value)}
      </span>
      {caption ? <span className={cx(styles['caption'])}>{caption}</span> : null}
    </div>
  );
}
