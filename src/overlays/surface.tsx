'use client';

/* Which material an overlay lands on.
 *
 * A transient overlay is Frost. Meridian moved tooltip, popover, menu and toast
 * to Frost on 17 September 2026 (R15e in Prismata's request log). A surface that
 * opens over content is an intermediate panel, not a compact control, and its
 * reading content sits on Haze inside it. Prismata 2.2.0 corrects the chapters
 * and catalogue entries that still said Resin.
 *
 * Independently blurred panes do not nest. A menu is Frost because it opens
 * over the page. The same menu opened inside a dialog or a drawer opens over a
 * surface that is already a pane, and two stacked panes of diffused glass read
 * as neither. Once something Frost, Resin or Haze is between the overlay and the
 * page, the overlay recesses into Haze instead: the content fill inside the
 * frame.
 *
 * The DOM cannot answer this, because every overlay is portalled to a container
 * on `body` and loses its nesting. React context is not portalled. It follows
 * the element tree, which describes what is inside what. A `Dialog` or a
 * `Drawer` declares the material it presents, and an overlay rendered anywhere
 * inside it, wherever it ends up in the document, reads that and steps down.
 */
import { createContext, useContext, type ReactNode } from 'react';

/** The materials an overlay can be asked to sit on. */
export type PrismataSurface = 'page' | 'frost' | 'resin' | 'haze';

/** The materials an overlay can be. */
export type PrismataOverlayMaterial = 'frost' | 'haze';

const SurfaceContext = createContext<PrismataSurface>('page');

/** Declares what an overlay opened inside this subtree is sitting on. */
export function SurfaceProvider({ surface, children }: {
  surface: PrismataSurface;
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
export function useOverlayMaterial(): PrismataOverlayMaterial {
  const beneath = useContext(SurfaceContext);
  return beneath === 'page' ? 'frost' : 'haze';
}

/** The attribute an overlay's stylesheet keys on. Spread onto the surface. */
export function overlayMaterialProps(material: PrismataOverlayMaterial): { 'data-pr-overlay': string } {
  return { 'data-pr-overlay': material };
}

/**
 * Prismata's class for an overlay of this material, beside the attribute above.
 *
 * On the page an overlay is Prismata's `.pr-frost` (2.2.0 publishes it as the
 * surface for every transient overlay), so Prismata paints the panel. Inside a
 * pane an overlay recesses into Haze. Plain `.pr-haze`, a feathered fill with
 * no edge and no shadow, has no visible boundary over a Haze dialog, so it uses
 * the recessed overlay Prismata 2.3.0 publishes (D-25): `.pr-haze.overlay`, a
 * flat Haze fill with the edge rim and the content shadow.
 */
export function overlayMaterialClass(material: PrismataOverlayMaterial): string {
  return material === 'frost' ? 'pr-frost' : 'pr-haze overlay';
}
