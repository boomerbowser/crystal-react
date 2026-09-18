'use client';

/* SSRProvider.
 *
 * Keeps generated ids stable across server and client, so the `aria-labelledby`
 * and `aria-describedby` wiring that names and describes a control survives
 * hydration. An id that differs between the two renders does not merely warn — it
 * silently unlabels a field, because the attribute points at an element that no
 * longer has that id.
 *
 * **On React 18 and later this does nothing, deliberately.** React's own `useId`
 * generates ids that match across server and client, and every id in this library
 * comes from it. React Aria's provider is a no-op on those versions too. It is
 * re-exported rather than dropped so the name exists where somebody looks for it,
 * and so the reason it is unnecessary is written down somewhere rather than
 * being folklore — this library's React floor is 18, so mounting it is harmless
 * and omitting it is correct.
 */
export { SSRProvider } from 'react-aria';
