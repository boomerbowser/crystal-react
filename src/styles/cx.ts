/* Join class names.
 *
 * `noUncheckedIndexedAccess` types every SCSS-module lookup as `string |
 * undefined`, which is correct — a typo in `styles['bttn']` should not compile.
 * This narrows it in one place rather than asserting at every call site, and it
 * is also where a consumer's `className` is merged, so Crystal's own class can
 * never be replaced by one.
 */
export function cx(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part.length > 0).join(' ');
}
