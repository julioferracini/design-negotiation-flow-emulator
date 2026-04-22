/**
 * NuDS Web Theme — builds a theme object with the same shape as
 * the RN NuDSTheme from @nubank/nuds-vibecode-theme.
 *
 * Supports segments (standard, uv, pj) and modes (light, dark).
 */

import {
  semanticLight,
  semanticDark,
  spacing,
  radius,
  elevation,
  motion,
  zIndex,
  getMagicColorToken,
  type MagicColorMode,
} from '@nubank/nuds-vibecode-tokens';
// `typography` comes from our local tokens module instead of the raw package
// so every composite gains the browser-safe fontFamily fallback chain (Inter
// via Google Fonts, then system sans-serif). See `./tokens.ts` for details.
import { typography } from './tokens';

export type NuDSSegment = 'standard' | 'uv' | 'pj';
export type ThemeMode = 'light' | 'dark';

type SemanticColor = typeof semanticLight;

export interface NuDSWebTheme {
  mode: ThemeMode;
  color: SemanticColor;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  elevation: typeof elevation;
  motion: typeof motion;
  zIndex: typeof zIndex;
}

const SEGMENT_ACCENTS: Record<NuDSSegment, {
  light: string; dark: string;
  lightFb: string; darkFb: string;
  lightAccent: string; darkAccent: string;
}> = {
  standard: { light: '#820AD1', dark: '#5A1D8C', lightFb: '#610F9B', darkFb: '#8132C5', lightAccent: '#9436E1', darkAccent: '#8132C5' },
  uv: { light: '#3E1874', dark: '#3D1E6F', lightFb: '#2A1050', darkFb: '#4E268D', lightAccent: '#53209C', darkAccent: '#4E268D' },
  pj: { light: '#714F8F', dark: '#643D7C', lightFb: '#652590', darkFb: '#785296', lightAccent: '#886A9E', darkAccent: '#785296' },
};

function resolveMagicMode(segment: NuDSSegment, mode: ThemeMode): MagicColorMode {
  if (segment === 'uv') return mode === 'light' ? 'uv' : 'uvDark';
  if (segment === 'pj') return mode === 'light' ? 'pj' : 'pjDark';
  return mode;
}

function safeToken(name: string, magicMode: MagicColorMode): string | undefined {
  try {
    return getMagicColorToken(name as any, magicMode);
  } catch {
    return undefined;
  }
}

function buildSegmentColors(
  base: SemanticColor,
  segment: NuDSSegment,
  mode: ThemeMode,
): SemanticColor {
  if (segment === 'standard') return base;

  const magicMode = resolveMagicMode(segment, mode);
  const acc = SEGMENT_ACCENTS[segment];
  const main = mode === 'light' ? acc.light : acc.dark;
  const fb = mode === 'light' ? acc.lightFb : acc.darkFb;
  const accent = mode === 'light' ? acc.lightAccent : acc.darkAccent;

  const accentSubtle = safeToken('surface.accent.selected_subtle', magicMode) ?? base.surface.accentSubtle;
  const accentSurface = safeToken('surface.accent.primary_subtle', magicMode) ?? base.surface.accent;
  const accentStrong = safeToken('surface.accent.primary_subtle_on_subtle', magicMode) ?? base.surface.accentStrong;

  return {
    ...base,
    main,
    mainFeedback: fb,
    accent,
    accentFeedback: fb,
    border: { ...base.border, focus: main },
    surface: {
      ...base.surface,
      accentSubtle,
      accent: accentSurface,
      accentStrong,
    },
  } as SemanticColor;
}

/**
 * Build a NuDS web theme with the same structure as the RN NuDSTheme.
 * This is the main entry point for the web theme system.
 */
export function buildNuDSWebTheme(
  segment: NuDSSegment = 'standard',
  mode: ThemeMode = 'light',
): NuDSWebTheme {
  const baseColor = mode === 'light' ? semanticLight : semanticDark;
  const color = buildSegmentColors(baseColor, segment, mode);

  return {
    mode,
    color,
    spacing,
    radius,
    typography,
    elevation,
    motion,
    zIndex,
  };
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CSS Custom Property Injection                                     */
/*                                                                    */
/*  Bridges the JS theme object → CSS custom properties so that       */
/*  prototype.css BEM classes can reference NuDS tokens via var().     */
/* ═══════════════════════════════════════════════════════════════════ */

function elevToCSS(e: typeof elevation[keyof typeof elevation]): string {
  if (!e.shadowOpacity) return 'none';
  const raw = e.shadowColor;
  let r = 0, g = 0, b = 0;
  if (raw.startsWith('rgba')) {
    const m = raw.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
  } else if (raw.startsWith('#') && raw.length === 7) {
    r = parseInt(raw.slice(1, 3), 16);
    g = parseInt(raw.slice(3, 5), 16);
    b = parseInt(raw.slice(5, 7), 16);
  }
  return `${e.shadowOffset.width}px ${e.shadowOffset.height}px ${e.shadowRadius}px rgba(${r},${g},${b},${e.shadowOpacity})`;
}

/**
 * Write NuDS token values as CSS custom properties on a DOM element.
 * Call this once on the prototype viewport wrapper so that
 * prototype.css classes can reference `var(--nuds-*)`.
 */
export function injectNuDSCSSVars(el: HTMLElement, theme: NuDSWebTheme): void {
  const s = el.style;
  const c = theme.color;

  s.setProperty('--nuds-accent', c.main);
  s.setProperty('--nuds-accent-50', `${c.main}50`);
  s.setProperty('--nuds-accent-feedback', c.mainFeedback);
  s.setProperty('--nuds-positive', c.positive);
  s.setProperty('--nuds-negative', c.negative);
  s.setProperty('--nuds-warning', c.warning);

  s.setProperty('--nuds-text-primary', c.content.primary);
  s.setProperty('--nuds-text-secondary', c.content.secondary);
  s.setProperty('--nuds-text-on-accent', c.content.main);

  s.setProperty('--nuds-bg-primary', c.background.primary);
  s.setProperty('--nuds-bg-secondary', c.background.secondary);
  s.setProperty('--nuds-bg-screen', c.background.screen);

  s.setProperty('--nuds-border-secondary', c.border.secondary);
  s.setProperty('--nuds-border-focus', c.border.focus);

  s.setProperty('--nuds-surface-accent-subtle', c.surface.accentSubtle);
  s.setProperty('--nuds-surface-accent', c.surface.accent);
  s.setProperty('--nuds-surface-accent-strong', c.surface.accentStrong);
  s.setProperty('--nuds-surface-success', c.surface.success);
  s.setProperty('--nuds-surface-neutral', c.surface.neutral);
  s.setProperty('--nuds-overlay', c.surface.overlay);

  s.setProperty('--nuds-radius-sm', `${theme.radius.sm}px`);
  s.setProperty('--nuds-radius-md', `${theme.radius.md}px`);
  s.setProperty('--nuds-radius-lg', `${theme.radius.lg}px`);
  s.setProperty('--nuds-radius-xl', `${theme.radius.xl}px`);
  s.setProperty('--nuds-radius-xxl', `${theme.radius.xxl}px`);
  s.setProperty('--nuds-radius-full', `${theme.radius.full}px`);

  for (const [k, v] of Object.entries(theme.spacing)) {
    s.setProperty(`--nuds-spacing-${k}`, `${v}px`);
  }

  s.setProperty('--nuds-elevation-level1', elevToCSS(theme.elevation.level1));
  s.setProperty('--nuds-elevation-level2', elevToCSS(theme.elevation.level2));
  s.setProperty('--nuds-elevation-level3', elevToCSS(theme.elevation.level3));
  s.setProperty('--nuds-elevation-modal', elevToCSS(theme.elevation.modal));

  s.setProperty('--nuds-z-overlay', String(theme.zIndex.overlay));
  s.setProperty('--nuds-z-sheet', String(theme.zIndex.sheet));
  s.setProperty('--nuds-z-modal', String(theme.zIndex.modal));
}
