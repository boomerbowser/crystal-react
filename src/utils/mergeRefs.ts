/* Merge several refs onto one element.
 *
 * Needed wherever a component has both its own ref (a Motion scope, a
 * measurement) and a consumer's forwarded one. Motion's `AnimationScope` types
 * `current` as read-only because it owns the value, so assigning through it needs
 * one narrow cast, kept here rather than repeated at every call site.
 */
import type { Ref, RefCallback } from 'react';

type AnyRef<T> = Ref<T> | { current: T | null } | null | undefined;

export function mergeRefs<T>(...refs: readonly AnyRef<T>[]): RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else (ref as { current: T | null }).current = node;
    }
  };
}
