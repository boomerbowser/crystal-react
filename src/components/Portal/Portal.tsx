'use client';

/* Portal — render content outside its layout parent, without leaving its tree.
 *
 * Every overlay in this library already portals: React Aria puts popovers,
 * menus, tooltips and dialogs on a container under `body` so that no ancestor's
 * `overflow`, `transform` or stacking context can clip or reposition them. That
 * behaviour is thorough and was easy to mistake for this component existing.
 * It does not: a product with its own content that needs the same escape — a
 * floating toolbar, a banner that must outrank an ancestor's `transform`, a
 * third-party widget that insists on measuring against the viewport — had
 * nothing to reach for, and would have written `createPortal(node,
 * document.body)` by hand.
 *
 * Writing it by hand is where the two hazards are, and both are why this is a
 * component rather than a documentation note.
 *
 * **The material context has to survive.** `SurfaceProvider` is what makes
 * "Resin never contains Resin" enforceable, and it works precisely because
 * React context follows the element tree rather than the document. Content
 * portalled with `createPortal` keeps its context — that is the guarantee — but
 * only if it is rendered inside the tree. A product that portals by rendering
 * into a detached root loses it silently and gets Resin inside Resin with no
 * error anywhere. This portals the React way and says so.
 *
 * **`document` does not exist while rendering on the server.** `createPortal`
 * called during SSR throws, so the container is resolved in an effect and
 * nothing is rendered on the first client pass either — which keeps the server
 * and client markup identical and avoids a hydration mismatch. The cost is one
 * frame; the alternative is a component that cannot be used in the Next.js app
 * this library is gated against.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: ReactNode;
  /**
   * Where to put it. A DOM element, or a function returning one so the lookup
   * happens on the client. Defaults to `document.body`.
   *
   * Prefer `body`. A container inside the page can itself be inside the
   * `transform` or `overflow` the content is trying to escape, which produces a
   * portal that portals nowhere — the defect this component exists to avoid,
   * reintroduced through its own prop.
   */
  container?: Element | (() => Element | null) | null;
  /**
   * Render nothing at all. Present so a caller can keep the component mounted
   * across a state change rather than unmounting and remounting it, which would
   * discard the subtree's state.
   */
  isDisabled?: boolean;
}

export function Portal({ children, container, isDisabled = false }: PortalProps): React.JSX.Element | null {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    if (isDisabled) { setTarget(null); return; }
    const resolved = typeof container === 'function' ? container() : container;
    setTarget(resolved ?? document.body);
  }, [container, isDisabled]);

  if (isDisabled || !target) return null;
  return createPortal(children, target);
}
