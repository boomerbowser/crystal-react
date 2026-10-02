'use client';

/* Portal: render content outside its layout parent, without leaving its tree.
 *
 * Every overlay in this library already portals. React Aria puts popovers,
 * menus, tooltips and dialogs on a container under `body` so that no ancestor's
 * `overflow`, `transform` or stacking context can clip or reposition them. This
 * component is for a product's own content that needs the same escape, such as
 * a floating toolbar, a banner that must outrank an ancestor's `transform`, or
 * a third-party widget that insists on measuring against the viewport. Without
 * it the product would write `createPortal(node, document.body)` by hand.
 *
 * Writing it by hand has two hazards, which is why this is a component and not
 * a documentation note.
 *
 * The material context has to survive. `SurfaceProvider` makes "Resin never
 * contains Resin" enforceable, and it works because React context follows the
 * element tree rather than the document. Content portalled with `createPortal`
 * keeps its context only if it is rendered inside the tree. A product that
 * portals by rendering into a detached root loses the context silently and gets
 * Resin inside Resin with no error. This component portals inside the tree.
 *
 * `document` does not exist while rendering on the server. `createPortal`
 * called during SSR throws, so the container is resolved in an effect and
 * nothing is rendered on the first client pass either. That keeps the server
 * and client markup identical and avoids a hydration mismatch. It costs one
 * frame, and without it the component could not be used in the Next.js app
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
   * `transform` or `overflow` the content is trying to escape, and then the
   * content is still clipped or repositioned by it.
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
