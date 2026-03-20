/**
 * NuDS V3 — Typography Tokens
 *
 * Font families, composite typography tokens, font sizes, weights, and letter spacing.
 */

export const fontFamily = {
  text: "'Nu Sans Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  display: "'Nu Sans Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
} as const;

export const typography = {
  title: {
    xlarge:  { family: 'display' as const, size: '44px', weight: '500', lineHeight: '1.1', letterSpacing: '0px' },
    large:   { family: 'display' as const, size: '36px', weight: '500', lineHeight: '1.1', letterSpacing: '0px' },
    medium:  { family: 'display' as const, size: '28px', weight: '500', lineHeight: '1.2', letterSpacing: '0px' },
    small:   { family: 'display' as const, size: '24px', weight: '500', lineHeight: '1.2', letterSpacing: '0px' },
    xsmall:  { family: 'display' as const, size: '20px', weight: '500', lineHeight: '1.2', letterSpacing: '0px' },
  },
  subtitle: {
    medium: {
      default: { family: 'text' as const, size: '18px', weight: '400', lineHeight: '1.3', letterSpacing: '0px' },
      strong:  { family: 'text' as const, size: '18px', weight: '600', lineHeight: '1.3', letterSpacing: '0px' },
    },
    small: {
      default: { family: 'text' as const, size: '16px', weight: '400', lineHeight: '1.3', letterSpacing: '0px' },
      strong:  { family: 'text' as const, size: '16px', weight: '600', lineHeight: '1.3', letterSpacing: '0px' },
    },
  },
  paragraph: {
    medium: {
      default: { family: 'text' as const, size: '16px', weight: '400', lineHeight: '1.5', letterSpacing: '0px' },
      strong:  { family: 'text' as const, size: '16px', weight: '600', lineHeight: '1.5', letterSpacing: '0px' },
    },
    small: {
      default: { family: 'text' as const, size: '14px', weight: '400', lineHeight: '1.5', letterSpacing: '0px' },
      strong:  { family: 'text' as const, size: '14px', weight: '600', lineHeight: '1.5', letterSpacing: '0px' },
    },
  },
  label: {
    medium: {
      default: { family: 'text' as const, size: '16px', weight: '400', lineHeight: '1.3', letterSpacing: '0px' },
      strong:  { family: 'text' as const, size: '16px', weight: '600', lineHeight: '1.3', letterSpacing: '0px' },
    },
    small: {
      default: { family: 'text' as const, size: '14px', weight: '400', lineHeight: '1.3', letterSpacing: '0px' },
      strong:  { family: 'text' as const, size: '14px', weight: '600', lineHeight: '1.3', letterSpacing: '0px' },
    },
    xsmall: {
      default: { family: 'text' as const, size: '12px', weight: '400', lineHeight: '1.3', letterSpacing: '1px' },
      strong:  { family: 'text' as const, size: '12px', weight: '600', lineHeight: '1.3', letterSpacing: '1px' },
    },
    xxsmall: {
      default: { family: 'text' as const, size: '10px', weight: '400', lineHeight: '1.3', letterSpacing: '1px' },
      strong:  { family: 'text' as const, size: '10px', weight: '600', lineHeight: '1.3', letterSpacing: '1px' },
    },
  },
} as const;

export const fontSize = {
  '2xs': '11px',
  xs: '12px',
  sm: '13px',
  base: '14px',
  md: '15px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '22px',
  '4xl': '24px',
  '5xl': '28px',
  '6xl': '32px',
  '7xl': '36px',
  '8xl': '40px',
  '9xl': '44px',
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const letterSpacing = {
  tight: '-0.14px',
  snug: '-0.16px',
  normal: '-0.24px',
  dense: '-0.4px',
  compact: '-0.54px',
  heading: '-0.6px',
  display: '-0.72px',
  displayLg: '-0.84px',
  displayXl: '-0.96px',
  displayHero: '-1.2px',
  value: '-2px',
} as const;

export const lineHeight = {
  none: '1',
  tight: '1.1',
  snug: '1.2',
  normal: '1.3',
  relaxed: '1.5',
} as const;

export type NuDSFontFamily = typeof fontFamily;
export type NuDSTypography = typeof typography;
