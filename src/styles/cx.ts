/* Join class names.
 *
 * `noUncheckedIndexedAccess` types every SCSS-module lookup as `string |
 * undefined`, which is correct, because a typo in `styles['bttn']` should not
 * compile. This narrows the type in one place instead of asserting at every call
 * site. It is also where a consumer's `className` is merged, so a consumer's
 * class can never replace Crystal's own.
 */
export function cx(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part.length > 0).join(' ');
}
