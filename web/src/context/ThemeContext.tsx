/**
 * ThemeContext — NuDS-driven segment and mode state for web emulator.
 *
 * Official NuDS segments:
 * - standard
 * - uv
 * - pj
 *
 * Official NuDS modes:
 * - light
 * - dark
 *
 * Note: Many NuDS magicColorTokens don't have all modes defined.
 * We use hardcoded fallbacks for dark mode to ensure proper contrast.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  getMagicColorToken,
  type MagicColorMode,
  type MagicColorTokenName,
} from '@nubank/nuds-vibecode-tokens';

export type NuDSSegment = 'standard' | 'uv' | 'pj';
export type ThemeMode = 'light' | 'dark';

type SegmentPalette = {
  accent: string;
  accentFeedback: string;
  accentSubtle: string;
  positive: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textOnAccent: string;
  border: string;
  overlay: string;
};

export interface SegmentDef {
  id: NuDSSegment;
  label: string;
  description: string;
  swatchToken: MagicColorTokenName;
}

export const SEGMENTS: SegmentDef[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'NuDS standard',
    swatchToken: 'surface.accent.primary',
  },
  {
    id: 'uv',
    label: 'UV',
    description: 'NuDS Ultravioleta',
    swatchToken: 'surface.accent.primary',
  },
  {
    id: 'pj',
    label: 'PJ',
    description: 'NuDS Pessoa Juridica',
    swatchToken: 'surface.accent.primary',
  },
];

function resolveMagicMode(segment: NuDSSegment, mode: ThemeMode): MagicColorMode {
  if (segment === 'uv') return mode === 'light' ? 'uv' : 'uvDark';
  if (segment === 'pj') return mode === 'light' ? 'pj' : 'pjDark';
  return mode;
}

function safeGetToken(name: MagicColorTokenName, magicMode: MagicColorMode): string | undefined {
  try {
    return getMagicColorToken(name, magicMode);
  } catch {
    return undefined;
  }
}

function buildPalette(segment: NuDSSegment, mode: ThemeMode): SegmentPalette {
  const magicMode = resolveMagicMode(segment, mode);
  const isDark = mode === 'dark';

  const accentFromToken = safeGetToken('surface.accent.primary', magicMode) ?? (isDark ? '#A35EEB' : '#820AD1');

  if (isDark) {
    return {
      accent: accentFromToken,
      accentFeedback: `${accentFromToken}CC`,
      accentSubtle: `${accentFromToken}20`,
      positive: '#34D399',
      background: '#0D0D0D',
      surface: '#161616',
      surfaceSecondary: '#1C1C1C',
      textPrimary: '#FFFFFF',
      textSecondary: '#A0A0A0',
      textOnAccent: '#000000',
      border: '#2A2A2A',
      overlay: 'rgba(0, 0, 0, 0.62)',
    };
  }

  return {
    accent: accentFromToken,
    accentFeedback: safeGetToken('surface.accent.primary_strong_on_primary', magicMode) ?? '#610F9B',
    accentSubtle: safeGetToken('surface.accent.selected_subtle', magicMode) ?? '#FAF6FF',
    positive: safeGetToken('content.feedback.success', magicMode) ?? '#0c7a3a',
    background: safeGetToken('background.default', magicMode) ?? '#FFFFFF',
    surface: safeGetToken('background.subtle', magicMode) ?? '#F0EEF1',
    surfaceSecondary: safeGetToken('surface.subtle', magicMode) ?? '#F8F6F8',
    textPrimary: safeGetToken('content.default', magicMode) ?? '#1F0230',
    textSecondary: safeGetToken('border.strong', magicMode) ?? '#766380',
    textOnAccent: safeGetToken('content.on_color', magicMode) ?? '#FFFFFF',
    border: safeGetToken('border.disabled', magicMode) ?? '#F0EEF1',
    overlay: 'rgba(31, 2, 48, 0.62)',
  };
}

export function getSegmentSwatchColor(segment: NuDSSegment, mode: ThemeMode): string {
  const magicMode = resolveMagicMode(segment, mode);
  return safeGetToken('surface.accent.primary', magicMode) ?? '#820AD1';
}

interface ThemeContextValue {
  segment: NuDSSegment;
  setSegment: (s: NuDSSegment) => void;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
  palette: SegmentPalette;
  segmentDef: SegmentDef;
  swatchColor: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [segment, setSegment] = useState<NuDSSegment>('standard');
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo<ThemeContextValue>(() => {
    const segmentDef = SEGMENTS.find((s) => s.id === segment) ?? SEGMENTS[0];
    const magicMode = resolveMagicMode(segment, mode);
    return {
      segment,
      setSegment,
      mode,
      setMode,
      toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
      palette: buildPalette(segment, mode),
      segmentDef,
      swatchColor: safeGetToken(segmentDef.swatchToken, magicMode) ?? '#820AD1',
    };
  }, [segment, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
