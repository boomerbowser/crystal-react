'use client';

/* Which material an overlay lands on.
 *
 * **Resin never contains Resin.** A menu is Resin because it floats above the
 * page; the same menu opened inside a dialog is floating above Haze, and Resin
 * over Resin — or Resin inside the frame of something already floating — is the
 * one arrangement the contract forbids outright.
 *
 * The DOM cannot answer this, because every overlay is portalled to a container
 * on `body` and loses its nesting on the way. React context is not portalled: it
 * follows the element tree, which is the tree that actually describes what is
 * inside what. So a `Dialog` or a `Drawer` declares the material it presents, and
 * an overlay rendered anywhere inside it — however far away it ends up in the
 * document — reads that and steps down.
 *
 * Stepping *down* rather than up is deliberate. Haze inside Resin reads as a
 * recess, which is what a menu inside a floating panel is; Resin inside Resin
 * reads as two panes of the same glass stacked, which reads as neither.
 */
import { createContext, useContext, type ReactNode } from 'react';

/** The materials an overlay can be asked to sit on. */
export type CrystalSurface = 'page' | 'frost' | 'resin' | 'haze';

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
 * On the page or on Frost, an overlay is the floating control plane: Resin. Once
 * something Resin or Haze is already between it and the page, it recesses into
 * Haze instead.
 */
export function useOverlayMaterial(): 'resin' | 'haze' {
  const beneath = useContext(SurfaceContext);
  return beneath === 'resin' || beneath === 'haze' ? 'haze' : 'resin';
}

/** The attribute an overlay's stylesheet keys on. Spread onto the surface. */
export function overlayMaterialProps(material: 'resin' | 'haze'): { 'data-cr-overlay': string } {
  return { 'data-cr-overlay': material };
}
