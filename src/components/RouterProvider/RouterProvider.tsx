'use client';

/* RouterProvider.
 *
 * Hands the library the host application's navigation function, so every link
 * and navigable item in Crystal routes through the host router instead of
 * reloading the page. Without it a link inside a menu, a tab, a breadcrumb or a
 * card does a full document navigation, and a single-page application silently
 * stops being one. It looks like a slow app rather than a bug, so it is easy to
 * ship without this.
 *
 * React Aria's `RouterProvider` is the mechanism, and this is a re-export with
 * Crystal's reason attached. It is not wrapped, because the shape React Aria
 * expects (a `navigate` function and an optional `useHref`) is the shape every
 * router adapter is already written against.
 */
import type { ComponentProps } from 'react';
import { RouterProvider as AriaRouterProvider } from 'react-aria-components';

export { RouterProvider } from 'react-aria-components';
export type RouterProviderProps = ComponentProps<typeof AriaRouterProvider>;
