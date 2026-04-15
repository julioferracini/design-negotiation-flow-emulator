/**
 * NuDS Web Tokens — re-exports from @nubank/nuds-vibecode-tokens
 * plus web-specific helpers (elevation → CSS boxShadow).
 */

export {
  spacing,
  radius,
  typography,
  motion,
  zIndex,
  elevation,
  type TypographyVariant,
} from '@nubank/nuds-vibecode-tokens';

import { elevation } from '@nubank/nuds-vibecode-tokens';

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
