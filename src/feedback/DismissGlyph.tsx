/* The dismiss mark Alert, Banner, Notification and Toast share: a drawn cross
   at Prismata's icon size. It used to be the "×" character at body size, which
   testers found too small to see and aim at; a glyph's size follows the font,
   and its weight follows the font's idea of a multiplication sign. A drawn
   cross is the icon size in every font, with a stroke that matches the other
   icons. The button around it is the 44px target. */
import type { ReactNode } from 'react';

export function DismissGlyph(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
