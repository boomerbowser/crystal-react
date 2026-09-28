'use client';

/* Which material an overlay lands on.
 *
 * **A transient overlay is Frost.** Meridian moved tooltip, popover, menu and
 * toast to Frost on 17 September 2026 (R15e in Crystal's request log), and the
 * documentation site has rendered them so since: a surface that opens over
 * content is an intermediate panel, not a compact control, and its reading
 * content sits on Haze inside it. This library had them as Resin, from a reading
 * of the specification that predated the decision — Crystal 2.2.0 corrects the
 * chapters and the catalogue entries that still said Resin.
 *
 * **Independently blurred panes do not nest.** A menu is Frost because it opens
 * over the page; the same menu opened inside a dialog or a drawer is opening
 * over a surface that is already a pane, and two panes of diffused glass stacked
 * read as neither. So once something Frost, Resin or Haze is between the overlay
 * and the page, the overlay recesses into Haze instead — the content fill inside
 * the frame, which is what a menu inside a panel is.
 *
 * The DOM cannot answer this, because every overlay is portalled to a container
 * on `body` and loses its nesting on the way. React context is not portalled: it
 * follows the element tree, which is the tree that actually describes what is
 * inside what. So a `Dialog` or a `Drawer` declares the material it presents, and
 * an overlay rendered anywhere inside it — however far away it ends up in the
 * document — reads that and steps down.
 */
import { createContext, useContext, type ReactNode } from 'react';

/** The materials an overlay can be asked to sit on. */
export type CrystalSurface = 'page' | 'frost' | 'resin' | 'haze';

/** The materials an overlay can be. */
export type CrystalOverlayMaterial = 'frost' | 'haze';

const SurfaceContext = createContext<CrystalSurface>('page');

/** Declares what an overlay opened inside this subtree is sitting on. */
export function SurfaceProvider({ surface, children }: {
  surface: CrystalSurface;
  children: ReactNode;
}): React.JSX.Element {
  return <SurfaceContext.Provider value={surface}>{children}</SurfaceContext.Provider>;
}

/**
 * The material an overlay opening here should use.
 *
 * On the page an overlay is a transient panel: Frost. Once something Frost,
 * Resin or Haze is already between it and the page, it recesses into Haze.
 */
export function useOverlayMaterial(): CrystalOverlayMaterial {
  const beneath = useContext(SurfaceContext);
  return beneath === 'page' ? 'frost' : 'haze';
}

/** The attribute an overlay's stylesheet keys on. Spread onto the surface. */
export function overlayMaterialProps(material: CrystalOverlayMaterial): { 'data-cr-overlay': string } {
  return { 'data-cr-overlay': material };
}

/**
 * Crystal's class for an overlay of this material, beside the attribute above.
 *
 * On the page an overlay is Crystal's `.cr-frost` (2.2.0 publishes it as the
 * surface every transient overlay is), and wearing it makes Crystal the painter
 * of the panel. Inside a pane an overlay is Haze, and there is deliberately no
 * class: Crystal's `.cr-haze` is a feathered fill with no edge and no shadow, and
 * a menu drawn that way over a Haze dialog has no visible boundary at all. The
 * library keeps its own recessed Haze there — an edge and the content shadow —
 * until Crystal says what a transient surface inside a pane should be.
 */
export function overlayMaterialClass(material: CrystalOverlayMaterial): string | undefined {
  return material === 'frost' ? 'cr-frost' : undefined;
}
