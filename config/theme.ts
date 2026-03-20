/**
 * Centralized design tokens.
 *
 * NuDS integration: use the `useNuDSTheme` hook inside components wrapped by
 * `NuDSThemeProvider` to access the canonical token set:
 *
 *   theme.color.*        → semantic colors (main, content, background, border, feedback)
 *   theme.spacing[n]     → spacing scale (0-24, maps to 0-96px)
 *   theme.radius.*       → border radii (none, sm, md, lg, xl, xxl, full)
 *   theme.typography[v]  → 22 font variants (title, subtitle, paragraph, label)
 *   theme.elevation.*    → shadow presets (none, level1-3, sticky, dropdown, modal)
 *   theme.zIndex.*       → layer ordering (base, sticky, dropdown, overlay, sheet, modal, toast, tooltip)
 *   theme.motion.*       → animation durations and curves
 *
 * The static `colors` object below is kept as a fallback for files that cannot
 * use hooks (config helpers, pure functions, etc.). Prefer theme tokens for
 * any component rendered inside <NuDSThemeProvider>.
 *
 * NuDS token mapping (local name → NuDS equivalent):
 *   purple            → theme.color.main
 *   textPrimary       → theme.color.content.primary
 *   textSecondary     → theme.color.content.secondary
 *   textOnPurple      → theme.color.content.main
 *   background        → theme.color.background.primary
 *   surfaceSecondary  → theme.color.background.secondary
 *   border            → theme.color.border.primary
 *   successText       → theme.color.positive
 *   shadow            → theme.color.content.primary (for shadowColor)
 */

export { useNuDSTheme } from '@nubank/nuds-vibecode-react-native';

export const colors = {
  /* ── Brand ── */
  purple: '#820ad1',
  purpleLight: '#d2a5ff',
  purpleBg: '#faf6ff',
  purpleBadgeBg: '#f6ecff',

  /* ── Text ── */
  textPrimary: '#1f0230',
  textSecondary: '#6B6B6B',
  textDisabled: '#C4C4C4',
  textOnPurple: '#FFFFFF',

  /* ── Success / Discount ── */
  successBg: '#ddf5e5',
  successText: '#0c7a3a',

  /* ── Highlight card ── */
  highlightBg: '#faf6ff',
  highlightBorder: '#d2a5ff',
  highlightBadgeBg: '#f6ecff',
  highlightBadgeText: '#820ad1',

  /* ── Surfaces ── */
  background: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',
  surfaceTabs: '#F0F0F0',
  border: '#EFEFEF',
  borderLight: '#F2F2F2',
  divider: '#EEEEEE',

  /* ── Misc ── */
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.64)',
  modalOverlay: 'rgba(0,0,0,0.32)',
  shimmer: '#E8E8E8',
  amountSymbol: '#9E9E9E',
  bottomBar: '#F2F2F2',
  bottomBarIcon: '#E0E0E0',
  soonBadgeBg: '#F5F5F5',
  soonBadgeText: '#B0B0B0',
  tabInactive: '#9a8aab',
} as const;

export type ThemeColors = typeof colors;
