/**
 * Stub for @nubank/nuds-vibecode-tokens — GitHub Pages CI builds only.
 *
 * Contains ALL exports needed by the web codebase:
 * - getMagicColorToken (ThemeContext)
 * - semanticLight / semanticDark (nuds/theme.ts)
 * - spacing, radius, typography, elevation, motion, zIndex (nuds/tokens.ts)
 *
 * Values extracted from the real package. Update when the package updates.
 */

// ── Color tokens ────────────────────────────────────────────────────

const magicColorTokens = {
  'surface.accent.primary': { dark: '#5A1D8C', light: '#820AD1', pj: '#714F8F', pjDark: '#643D7C', uv: '#3E1874', uvDark: '#3D1E6F' },
  'surface.accent.selected_subtle': { dark: '#220B35', light: '#FAF6FF', pj: '#F8F6F9', pjDark: '#F8F6F9', uv: '#FAF6FD', uvDark: '#1F0F38' },
  'surface.accent.primary_subtle': { dark: '#31104C', light: '#F6ECFF', pj: '#F5EEF9', pjDark: '#2F183B', uv: '#F3ECFC', uvDark: '#2B154E' },
  'surface.accent.primary_subtle_on_subtle': { dark: '#47176F', light: '#ECD9FF', pj: '#EADBF1', pjDark: '#3E1F4D', uv: '#EADBF9', uvDark: '#3D1E6F' },
  'surface.accent.primary_strong_on_primary': { dark: '#47176F', light: '#610F9B', pj: '#652590', pjDark: '#3E1F4D', uv: '#2A1050', uvDark: '#2B154E' },
  'background.default': { dark: '#000000', light: '#FFFFFF', pj: '#FFFFFF', pjDark: '#000000', uv: '#FFFFFF', uvDark: '#000000' },
  'background.subtle': { dark: '#222222', light: '#F0EEF1', pj: '#F0EEF1', pjDark: '#222222', uv: '#F0EEF1', uvDark: '#222222' },
  'surface.subtle': { dark: '#222222', light: '#F8F6F8', pj: '#F8F6F8', pjDark: '#222222', uv: '#F8F6F8', uvDark: '#222222' },
  'content.default': { light: '#1F0230', pj: '#1F0230', uv: '#1F0230' },
  'content.feedback.success': { dark: '#47B169', light: '#0C7A3A', pj: '#0C7A3A', pjDark: '#47B169', uv: '#0C7A3A', uvDark: '#47B169' },
  'content.on_color': { light: '#FFFFFF', pj: '#FFFFFF', uv: '#FFFFFF' },
  'border.strong': { dark: '#818181', light: '#766380', pj: '#766380', pjDark: '#818181', uv: '#766380', uvDark: '#818181' },
  'border.disabled': { dark: '#222222', light: '#F0EEF1', pj: '#F0EEF1', pjDark: '#222222', uv: '#F0EEF1', uvDark: '#222222' },
} as const;

export type MagicColorMode = 'light' | 'dark' | 'uv' | 'uvDark' | 'pj' | 'pjDark';
export type MagicColorTokenName = keyof typeof magicColorTokens;

export function getMagicColorToken(token: MagicColorTokenName, mode: MagicColorMode): string | undefined {
  return (magicColorTokens[token] as Record<string, string>)[mode];
}

// ── Semantic colors ─────────────────────────────────────────────────

export const semanticLight = {
  main: '#820AD1', mainFeedback: '#610F9B', accent: '#9436E1', accentFeedback: '#820AD1',
  content: { main: '#FFFFFF', mainFeedback: '#FFFFFF', primary: '#1F0230', primaryFeedback: '#766380', secondary: '#766380', secondaryFeedback: '#BDB5C2', disabled: '#BDB5C2', selection: '#ECD9FF', inverse: '#FFFFFF', tertiary: '#766380', decorative01: '#615BCC', decorative02: '#176CB8', decorative03: '#C41397', decorative04: '#567400', decorative05: '#3E62D0', decorative06: '#0D7489' },
  background: { screen: '#FFFFFF', primary: '#FFFFFF', primaryFeedback: '#F0EEF1', secondary: '#F8F6F8', secondaryFeedback: '#E3E0E5', disabled: '#F0EEF1', overlay: '#1F0230', elevated: '#FFFFFF' },
  surface: { overlaySubtle: '#1F0230', decorative01: '#615BCC', decorative01Subtle: '#EEEEFF', decorative02: '#73C1E9', decorative02Subtle: '#E2F2FB', decorative03: '#E063B1', decorative03Subtle: '#FBEBF4', decorative04: '#A0C61B', decorative04Subtle: '#EBF5BA', decorative05: '#284EC1', decorative05Subtle: '#EBEFFC', decorative06: '#4FC9CA', decorative06Subtle: '#DBF4F4', accentSubtle: '#FAF6FF', accent: '#F6ECFF', accentStrong: '#ECD9FF', success: '#DDF5E5', successStrong: '#BCEBCC', warning: '#FFECD6', warningStrong: '#FFDAB1', critical: '#FFEAE8', criticalStrong: '#FFD8D5', neutral: '#F0EEF1', neutralStrong: '#E3E0E5', overlay: 'rgba(31, 2, 48, 0.62)' },
  border: { primary: '#766380', primaryFeedback: '#BDB5C2', secondary: '#F0EEF1', secondaryFeedback: '#BDB5C2', focus: '#820AD1' },
  positive: '#0C7A3A', positiveFeedback: '#57CE7F', warning: '#AF4D0E', warningFeedback: '#FEA44B', negative: '#D01D1C', negativeFeedback: '#FF9D98',
} as const;

export const semanticDark = {
  main: '#5A1D8C', mainFeedback: '#8132C5', accent: '#8132C5', accentFeedback: '#8132C5',
  content: { main: '#000000', mainFeedback: '#000000', primary: '#F2F2F2', primaryFeedback: '#818181', secondary: '#818181', secondaryFeedback: '#5D5D5D', disabled: '#3F3F3F', selection: '#241F26', inverse: '#000000', tertiary: '#818181', decorative01: '#9595EB', decorative02: '#5DA6CF', decorative03: '#E07DB7', decorative04: '#84AA2B', decorative05: '#829CE4', decorative06: '#49ABB4' },
  background: { screen: '#000000', primary: '#000000', primaryFeedback: '#222222', secondary: '#222222', secondaryFeedback: '#313131', disabled: '#222222', overlay: '#000000', elevated: '#222222' },
  surface: { overlaySubtle: '#000000', decorative01: '#7A77D4', decorative01Subtle: '#1E1B4E', decorative02: '#4D87B1', decorative02Subtle: '#002246', decorative03: '#D051A6', decorative03Subtle: '#3E0E31', decorative04: '#84AA2B', decorative04Subtle: '#1C2409', decorative05: '#1E3592', decorative05Subtle: '#0C1E51', decorative06: '#49ABB4', decorative06Subtle: '#0B252B', accentSubtle: '#220B35', accent: '#31104C', accentStrong: '#47176F', success: '#0B2715', successStrong: '#10381D', warning: '#311D13', warningStrong: '#482919', critical: '#4D0000', criticalStrong: '#6A0000', neutral: '#222222', neutralStrong: '#313131', overlay: 'rgba(0, 0, 0, 0.62)' },
  border: { primary: '#818181', primaryFeedback: '#5D5D5D', secondary: '#222222', secondaryFeedback: '#3F3F3F', focus: '#8132C5' },
  positive: '#1E6B38', positiveFeedback: '#47B169', warning: '#934824', warningFeedback: '#E4863F', negative: '#AD2D2D', negativeFeedback: '#EE7C7A',
} as const;

// ── Spacing ─────────────────────────────────────────────────────────

export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 16: 64, 20: 80, 24: 96 } as const;

// ── Radius ──────────────────────────────────────────────────────────

export const radius = { none: 0, sm: 4, md: 8, lg: 16, xl: 24, xxl: 32, full: 64 } as const;

// ── Typography ──────────────────────────────────────────────────────

const fd = 'NuSansDisplay-Medium';
const ftr = 'NuSansText-Regular';
const fts = 'NuSansText-Semibold';

export const typography = {
  titleXLarge: { fontFamily: fd, fontSize: 44, lineHeight: 48.4 },
  titleLarge: { fontFamily: fd, fontSize: 36, lineHeight: 39.6 },
  titleMedium: { fontFamily: fd, fontSize: 28, lineHeight: 33.6 },
  titleSmall: { fontFamily: fd, fontSize: 24, lineHeight: 28.8 },
  titleXSmall: { fontFamily: fd, fontSize: 20, lineHeight: 24 },
  subtitleMediumDefault: { fontFamily: ftr, fontSize: 18, lineHeight: 23.4 },
  subtitleMediumStrong: { fontFamily: fts, fontSize: 18, lineHeight: 23.4 },
  subtitleSmallDefault: { fontFamily: ftr, fontSize: 16, lineHeight: 20.8 },
  subtitleSmallStrong: { fontFamily: fts, fontSize: 16, lineHeight: 20.8 },
  paragraphMediumDefault: { fontFamily: ftr, fontSize: 16, lineHeight: 24 },
  paragraphMediumStrong: { fontFamily: fts, fontSize: 16, lineHeight: 24 },
  paragraphSmallDefault: { fontFamily: ftr, fontSize: 14, lineHeight: 21 },
  paragraphSmallStrong: { fontFamily: fts, fontSize: 14, lineHeight: 21 },
  labelMediumDefault: { fontFamily: ftr, fontSize: 16, lineHeight: 20.8 },
  labelMediumStrong: { fontFamily: fts, fontSize: 16, lineHeight: 20.8 },
  labelSmallDefault: { fontFamily: ftr, fontSize: 14, lineHeight: 18.2 },
  labelSmallStrong: { fontFamily: fts, fontSize: 14, lineHeight: 18.2 },
  labelXSmallDefault: { fontFamily: ftr, fontSize: 12, lineHeight: 15.6, letterSpacing: 0.12 },
  labelXSmallStrong: { fontFamily: fts, fontSize: 12, lineHeight: 15.6, letterSpacing: 0.12 },
  label2XSmallDefault: { fontFamily: ftr, fontSize: 10, lineHeight: 13, letterSpacing: 0.1 },
  label2XSmallStrong: { fontFamily: fts, fontSize: 10, lineHeight: 13, letterSpacing: 0.1 },
} as const;

export type TypographyVariant = keyof typeof typography;

// ── Elevation ───────────────────────────────────────────────────────

export const elevation = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  level1: { shadowColor: 'rgba(31, 0, 47, 1)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 0, elevation: 1 },
  level2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 4, elevation: 2 },
  level3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  sticky: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  dropdown: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
  modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
} as const;

// ── Motion ──────────────────────────────────────────────────────────

export const motion = {
  linear: { quick: 100, medium: 200, slow: 300 },
  main: { quick: 200, medium: 300, slow: 400 },
  entering: { quick: 200, medium: 300, slow: 400 },
  exiting: { quick: 100, medium: 200, slow: 300 },
} as const;

// ── Z-Index ─────────────────────────────────────────────────────────

export const zIndex = {
  base: 0, sticky: 100, dropdown: 200, popover: 300, overlay: 1000, sheet: 1500, modal: 2000, toast: 3000, tooltip: 4000,
} as const;

// ── Web CSS vars helper ─────────────────────────────────────────────

export const createCssVariables = (_mode: 'light' | 'dark' = 'light'): string => ':root {}';
