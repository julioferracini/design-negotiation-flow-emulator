/**
 * NuDS V3 — Shared Design Tokens
 *
 * Platform-agnostic design tokens used by both:
 * - Expo (React Native) via theme bridge
 * - Web (Vite + Tailwind) via tailwind.config.ts
 *
 * Source: NuDS V3 Figma tokens
 *   figma.com/design/HwP6UcS4vohkhKDlalkSmz (NuDS V3 Tokens)
 *   figma.com/design/RxzAEZlmQX8Outs7RYQWw2 (NuDS V3 1st Level)
 */

export { color, colors } from './colors';
export { spacing, borderRadius } from './spacing';
export { fontFamily, typography, fontSize, fontWeight, letterSpacing, lineHeight } from './typography';
export { elevation, blur, spring, transition, zIndex } from './elevation';

export type { NuDSColor, Colors } from './colors';
export type { NuDSSpacing, NuDSBorderRadius } from './spacing';
export type { NuDSFontFamily, NuDSTypography } from './typography';
export type { NuDSElevation } from './elevation';
