'use client';

/* GradientText.
 *
 * Text filled with a palette gradient, for the one line of a view that warrants
 * it. It is a `Title` with `gradient`, exported under its own name because the
 * catalogue lists it as its own component and a product looking for it will look
 * for this name.
 *
 * The gradient runs between palette colours that already clear their contrast
 * ratio against the surface, so every point along it clears the floor. A
 * gradient from a passing colour to a failing one would leave the end of the
 * text illegible. The solid colour beneath the clip is one of the same colours,
 * so where the clip is unsupported the text is coloured and not transparent,
 * and forced colours replaces it outright.
 */
import { forwardRef } from 'react';
import { Title, type TitleProps } from '../Title/Title.js';

export type GradientTextProps = Omit<TitleProps, 'gradient'>;

export const GradientText = forwardRef<HTMLHeadingElement, GradientTextProps>(
  function GradientText(props, ref) {
    return <Title {...props} ref={ref} gradient />;
  },
);
