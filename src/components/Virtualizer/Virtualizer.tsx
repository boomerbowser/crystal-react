'use client';

/* Virtualizer.
 *
 * Renders only what is near the viewport, for lists, grids and tables.
 *
 * This is React Aria's `Virtualizer`, re-exported with its layouts, and the
 * reason it is a re-export rather than a wrapper is the same reason the catalogue
 * gives it two `crystal` obligations and no more: the hard part is not the
 * windowing, it is keeping `aria-setsize` and `aria-posinset` correct across
 * recycling and never dropping focus when a focused row is reused. React Aria's
 * virtualizer is integrated with its collections, so both come for free; a
 * general-purpose windowing library is not, and every one of them has to have the
 * accessibility bolted back on by the product.
 *
 * Crystal's half is the scroll surface it lives on — `ScrollArea`, with the
 * scroll contract and the right scrollbar — and that focus survives recycling,
 * which is React Aria's to deliver and Crystal's to require.
 *
 * It takes a layout: `ListLayout` for rows of a known or estimated height,
 * `GridLayout` for a grid of cells, `TableLayout` for a table. Row sizing strategy
 * and the data are the product's.
 */
export { Virtualizer } from 'react-aria-components';
export { ListLayout, GridLayout, TableLayout, WaterfallLayout } from 'react-stately';
