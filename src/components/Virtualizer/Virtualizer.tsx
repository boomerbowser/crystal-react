'use client';

/* Virtualizer.
 *
 * Renders only what is near the viewport, for lists, grids and tables.
 *
 * This is React Aria's `Virtualizer`, re-exported with its layouts. It is a
 * re-export instead of a wrapper for the same reason the catalogue gives it only
 * two `crystal` obligations. The hard part is keeping `aria-setsize` and
 * `aria-posinset` correct across recycling and never dropping focus when a
 * focused row is reused. React Aria's virtualizer is integrated with its
 * collections, so it does both. A general-purpose windowing library is not, and
 * the product has to add the accessibility back.
 *
 * Crystal's half is the scroll surface it sits on (`ScrollArea`, with the scroll
 * contract and the right scrollbar) and the requirement that focus survives
 * recycling, which React Aria delivers.
 *
 * Nothing here supplies the scroll surface. A `Virtualizer` windows a
 * collection, and whoever assembles them puts the collection inside a
 * `ScrollArea`. `Virtualizer.stories.tsx` shows that assembly, because the
 * Crystal half of this component cannot be reviewed from its signature.
 *
 * It takes a layout: `ListLayout` for rows of a known or estimated height,
 * `GridLayout` for a grid of cells, `TableLayout` for a table. Row sizing strategy
 * and the data are the product's.
 */
export { Virtualizer } from 'react-aria-components';
export { ListLayout, GridLayout, TableLayout, WaterfallLayout } from 'react-stately';
