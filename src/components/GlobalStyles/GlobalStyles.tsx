'use client';

/* GlobalStyles.
 *
 * Applies Crystal's foundation to the document: the Plastic canvas, the reading
 * rhythm, and the token surface. It is what `CssBaseline` is in MUI — the
 * difference being what it deliberately does *not* touch.
 *
 * It never changes focus visibility and never changes motion preferences. Both
 * are stated in the catalogue and both are the same kind of rule: a global
 * stylesheet that resets `outline` removes the only affordance a keyboard user
 * has, and one that disables transitions "for performance" overrules a preference
 * the person expressed to their operating system. A reset is allowed to normalise
 * appearance; it is not allowed to remove an affordance.
 *
 * Crystal's reset itself lives in `@crystal/core`'s stylesheet, which a product
 * imports once — this component does not inline a copy of it, because two
 * descriptions of one reset is the drift CONTRACT §1 is about. What it does is
 * paint the document with the scope's resolved foundation, which a stylesheet
 * cannot do on its own: the values depend on the palette and mode in force.
 */
import { useEffect } from 'react';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';

export interface GlobalStylesProps {
  /**
   * Paint the document's own background and text colour from the theme. On by
   * default; turn it off when Crystal is an island inside a host application
   * that owns the page.
   */
  paintDocument?: boolean;
}

export function GlobalStyles({ paintDocument = true }: GlobalStylesProps): null {
  const theme = useCrystalTheme();

  useEffect(() => {
    if (!paintDocument || typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const body = document.body;

    /* Restored on unmount rather than left behind. A component that paints the
       document and never cleans up makes a mounted/unmounted Crystal island
       permanently change a host page. */
    const previous = {
      colorScheme: root.style.colorScheme,
      background: body.style.background,
      color: body.style.color,
      font: body.style.fontFamily,
    };

    root.style.colorScheme = theme.mode;
    body.style.background = 'var(--cr-canvas)';
    body.style.color = 'var(--cr-text)';
    body.style.fontFamily = 'var(--cr-font)';

    return () => {
      root.style.colorScheme = previous.colorScheme;
      body.style.background = previous.background;
      body.style.color = previous.color;
      body.style.fontFamily = previous.font;
    };
  }, [paintDocument, theme.mode]);

  return null;
}
