/**
 * NuDS Web Tokens — re-exports from @nubank/nuds-vibecode-tokens
 * plus web-specific helpers (elevation → CSS boxShadow, typography → CSSProperties).
 */

import type { CSSProperties } from 'react';

export {
  spacing,
  radius,
  motion,
  zIndex,
  elevation,
  type TypographyVariant,
} from '@nubank/nuds-vibecode-tokens';

import {
  elevation,
  typography as rawTypography,
} from '@nubank/nuds-vibecode-tokens';

/**
 * Browser-safe fallback stack appended to every NuDS composite's fontFamily.
 *
 * The raw tokens report iOS-style PostScript names ("NuSansText-Regular",
 * "NuSansDisplay-Medium", etc.) which only resolve when the Nubank typefaces
 * are installed locally. To keep typography intact for users without those
 * fonts (GitHub Pages visitors, external testers, CI screenshots), we splice
 * a cross-platform chain ending in Inter (loaded via Google Fonts in the HTML
 * entry) and finally the system sans-serif stack.
 */
const FONT_FALLBACK_CHAIN = `, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`;

/**
 * Drop-in replacement for `@nubank/nuds-vibecode-tokens`' `typography`,
 * preserving every field as-is except `fontFamily`, which is rewritten to
 * the compound fallback chain described above.
 *
 * The rewrite preserves the original PostScript name as the first token so
 * the existing `fontWeight` detection in NText (`.includes("Semibold")`)
 * still works.
 */
export const typography = Object.fromEntries(
  Object.entries(rawTypography).map(([key, value]) => [
    key,
    {
      ...(value as Record<string, unknown>),
      fontFamily: `'${(value as { fontFamily: string }).fontFamily}'${FONT_FALLBACK_CHAIN}`,
    },
  ]),
) as typeof rawTypography;

type ElevationKey = keyof typeof elevation;

function parseColor(raw: string): { r: number; g: number; b: number } {
  if (raw.startsWith('rgba')) {
    const m = raw.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  }
  if (raw.startsWith('#') && raw.length === 7) {
    return {
      r: parseInt(raw.slice(1, 3), 16),
      g: parseInt(raw.slice(3, 5), 16),
      b: parseInt(raw.slice(5, 7), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Convert a NuDS RN elevation token to a CSS `box-shadow` string.
 *
 *   elevationToBoxShadow('level1')
 *   → '0px 1px 0px rgba(31, 0, 47, 0.05)'
 */
export function elevationToBoxShadow(key: ElevationKey): string {
  const e = elevation[key];
  if (key === 'none') return 'none';
  const { r, g, b } = parseColor(e.shadowColor);
  const ox = e.shadowOffset.width;
  const oy = e.shadowOffset.height;
  const blur = e.shadowRadius;
  const alpha = e.shadowOpacity;
  return `${ox}px ${oy}px ${blur}px rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Pre-computed CSS box-shadows for every elevation level.
 */
export const boxShadow: Record<ElevationKey, string> = {
  none: elevationToBoxShadow('none'),
  level1: elevationToBoxShadow('level1'),
  level2: elevationToBoxShadow('level2'),
  level3: elevationToBoxShadow('level3'),
  sticky: elevationToBoxShadow('sticky'),
  dropdown: elevationToBoxShadow('dropdown'),
  modal: elevationToBoxShadow('modal'),
};

/**
 * Converts a NuDS typography composite token to a CSSProperties object,
 * mirroring the exact rendering logic used by the NText component.
 *
 * NuDS tokens store `lineHeight` and `letterSpacing` as unitless numbers
 * (RN-oriented) and do not expose `fontWeight` directly (it's inferred
 * from the fontFamily suffix, e.g. "...-Semibold"). Spreading the raw
 * token into an inline CSS style produces a broken visual (no fontWeight,
 * unitless lineHeight acting as a multiplier). Use this helper whenever
 * you need typography on a non-NText element (e.g. `motion.span` for
 * framer-motion animations or a `<button>` with inline styles) without
 * bypassing the design system.
 */
export function typographyToCSS(typo: {
  fontFamily: string;
  fontSize: string | number;
  lineHeight: number;
  letterSpacing?: number;
}): CSSProperties {
  return {
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    lineHeight: `${typo.lineHeight}px`,
    letterSpacing: typo.letterSpacing != null ? `${typo.letterSpacing}px` : undefined,
    fontWeight: typo.fontFamily.includes('Semibold') || typo.fontFamily.includes('Bold')
      ? 600
      : typo.fontFamily.includes('Medium')
        ? 500
        : 400,
  };
}
