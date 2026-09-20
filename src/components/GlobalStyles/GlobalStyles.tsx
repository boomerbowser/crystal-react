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
 * Crystal's reset itself lives in `@crystal-ui/core`'s stylesheet, which a product
 * imports once — this component does not inline a copy of it, because two
 * descriptions of one reset is the drift CONTRACT §1 is about. What it does is
 * paint the document with the scope's resolved foundation, which a stylesheet
 * cannot do on its own: the values depend on the palette and mode in force.
 *
 * Painting means copying the resolved custom properties onto `documentElement`,
 * not referencing them. The first version set `background: var(--cr-canvas)` on
 * `body` and painted nothing at all: the properties live on the provider's scope
 * element, `body` is *above* it, and custom properties inherit downward only. The
 * values are read from the scope and written to the root, which is the only
 * direction that works.
 */
import { useEffect, useRef } from 'react';
import { useCrystalTheme } from '../../theme/CrystalProvider.js';

export interface GlobalStylesProps {
  /**
   * Paint the document's own background and text colour from the theme. On by
   * default; turn it off when Crystal is an island inside a host application
   * that owns the page.
   */
  paintDocument?: boolean;
}

export function GlobalStyles({ paintDocument = true }: GlobalStylesProps): React.JSX.Element {
  const theme = useCrystalTheme();
  /* A ref rather than a query, so the scope this belongs to is the one that
     rendered it — not whichever provider happens to be first in the document. */
  const marker = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!paintDocument || typeof document === 'undefined') return undefined;
    const scope = marker.current?.closest<HTMLElement>('[data-crystal-scope]');
    if (!scope) return undefined;

    const root = document.documentElement;
    const body = document.body;

    /* Restored on unmount rather than left behind. A component that paints the
       document and never cleans up makes a mounted and unmounted Crystal island
       permanently change a host page. */
    const previousInline = root.getAttribute('style');
    const previousBody = body.getAttribute('style');

    /* Copied, not referenced. The scope's properties do not reach the root on
       their own, and `var(--cr-canvas)` above the element that defines it
       resolves to nothing. */
    for (const name of Array.from(scope.style)) {
      if (name.startsWith('--cr-')) root.style.setProperty(name, scope.style.getPropertyValue(name));
    }
    root.style.colorScheme = theme.mode;
    body.style.background = 'var(--cr-canvas)';
    body.style.color = 'var(--cr-text)';
    body.style.fontFamily = 'var(--cr-font)';

    return () => {
      if (previousInline === null) root.removeAttribute('style');
      else root.setAttribute('style', previousInline);
      if (previousBody === null) body.removeAttribute('style');
      else body.setAttribute('style', previousBody);
    };
  }, [paintDocument, theme]);

  /* A zero-size marker is how the effect finds its own scope. It is hidden from
     assistive technology because it is bookkeeping, not content. */
  return <span ref={marker} aria-hidden="true" style={{ display: 'none' }} />;
}
