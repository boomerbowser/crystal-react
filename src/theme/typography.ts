'use client';

/* Typography context.
 *
 * Crystal specifies a reading rhythm — Manrope at 16/24 — rather than a full type
 * scale, so that is what this exposes: the family, the reading size and the
 * leading, all from tokens, plus the steps derived from them.
 *
 * The steps are *derived*, not invented. Each is a ratio of the reading size, so
 * changing `typography.readingSize` upstream moves the whole scale rather than
 * leaving six hard-coded sizes behind. That is the same argument CONTRACT §1
 * makes about values generally: a number that cannot be changed centrally is a
 * defect, and a scale written as six literals is six of them.
 */
import { useMemo } from 'react';
import { useCrystalTheme } from './CrystalProvider.js';
import { crystalTokens } from './tokens.generated.js';

/** Named steps, largest to smallest. `body` is Crystal's reading size exactly. */
export type TypographyStep = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'caption';

/* Ratios against the reading size. A modest scale on purpose: Crystal's
   hierarchy is carried by weight and material as much as by size, and a
   dramatic scale fights that. */
const RATIO: Record<TypographyStep, number> = {
  display: 2.0,
  title: 1.5,
  heading: 1.25,
  subheading: 1.0625,
  body: 1,
  caption: 0.8125,
};

/* Larger text needs proportionally tighter leading to stay a block rather than a
   list of lines; small text needs more. */
const LEADING: Record<TypographyStep, number> = {
  display: 1.1,
  title: 1.2,
  heading: 1.3,
  subheading: 1.45,
  body: 1.5,
  caption: 1.45,
};

/* Display and title are set tighter: at large sizes default tracking reads loose. */
const TRACKING: Record<TypographyStep, string> = {
  display: '-0.055em',
  title: '-0.04em',
  heading: '-0.03em',
  subheading: '-0.01em',
  body: '0',
  caption: '0',
};

export interface TypographyStepValues {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface CrystalTypography {
  /** The resolved font family stack. */
  family: string;
  /** Crystal's reading size in px. */
  readingSize: number;
  /** Crystal's reading leading in px — the 16/24 rhythm. */
  readingLeading: number;
  /** Every step, resolved. */
  steps: Record<TypographyStep, TypographyStepValues>;
  /** One step, resolved. */
  step: (name: TypographyStep) => TypographyStepValues;
}

const px = (value: string): number => Number.parseFloat(value) || 0;

/**
 * The resolved typography for this scope.
 *
 * Density is honoured: `compact` tightens leading, never the size. Shrinking text
 * at higher density would trade legibility for space, which Crystal does not do —
 * density tightens spacing, and never touches a 44px target or a reading size.
 */
export function useTypography(): CrystalTypography {
  const { density } = useCrystalTheme();

  return useMemo(() => {
    const family = crystalTokens['typography.family'];
    const readingSize = px(crystalTokens['typography.readingSize']);
    const readingLeading = px(crystalTokens['typography.readingLeading']);
    const leadingScale = density === 'compact' ? 0.92 : 1;

    const steps = {} as Record<TypographyStep, TypographyStepValues>;
    for (const name of Object.keys(RATIO) as TypographyStep[]) {
      const size = readingSize * RATIO[name];
      steps[name] = {
        fontSize: `${Math.round(size * 100) / 100}px`,
        lineHeight: String(Math.round(LEADING[name] * leadingScale * 1000) / 1000),
        letterSpacing: TRACKING[name],
      };
    }

    return {
      family,
      readingSize,
      readingLeading,
      steps,
      step: (name: TypographyStep) => steps[name],
    };
  }, [density]);
}
