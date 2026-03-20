/**
 * NuDS V3 — Elevation, Blur & Motion Tokens
 */

export const elevation = {
  level1: '0px 1px 0px 0px #E5E0E8',
  level2: '0px 2px 8px rgba(0, 0, 0, 0.08)',
  level3: '0px 8px 24px rgba(0, 0, 0, 0.12)',
  bottomSheet: '0px -4px 24px rgba(0, 0, 0, 0.10)',
  cta: '0px 2px 12px rgba(130, 10, 209, 0.28)',
} as const;

export const blur = {
  blur1: '24px',
  blur2: '24px',
} as const;

export const spring = {
  default: { type: 'spring' as const, stiffness: 300, damping: 30 },
  tight: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 },
  smooth: { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.5 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 380, damping: 44, mass: 0.85 },
} as const;

export const transition = {
  fast: { duration: 0.2 },
  normal: { duration: 0.3 },
  slow: { duration: 0.4 },
} as const;

export const zIndex = {
  base: 1,
  sticky: 10,
  dropdown: 20,
  overlay: 40,
  modal: 50,
  safeArea: 60,
} as const;

export type NuDSElevation = typeof elevation;
