/**
 * NuDS V3 — Spacing & Border Radius Tokens
 */

export const spacing = {
  zero: '0px',
  half: '2px',
  x1: '4px',
  x2: '8px',
  x3: '12px',
  x4: '16px',
  x5: '20px',
  x6: '24px',
  x8: '32px',
  x12: '48px',
} as const;

export const borderRadius = {
  none: '0px',
  small: '4px',
  medium: '8px',
  large: '16px',
  xlarge: '24px',
  xxlarge: '28px',
  xxxlarge: '32px',
  full: '9999px',
} as const;

export type NuDSSpacing = typeof spacing;
export type NuDSBorderRadius = typeof borderRadius;
