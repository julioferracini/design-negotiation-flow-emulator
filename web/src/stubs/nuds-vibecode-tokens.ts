/**
 * Stub for @nubank/nuds-vibecode-tokens — GitHub Pages CI builds only.
 *
 * Extracted from the real package (v0.4.1) with only the token subset
 * used by web/src/context/ThemeContext.tsx. The real package is used
 * locally and in Expo via root node_modules.
 *
 * To update: copy values from node_modules/@nubank/nuds-vibecode-tokens/dist/color.d.ts
 */

const magicColorTokens = {
  'surface.accent.primary': {
    dark: '#5A1D8C', light: '#820AD1', pj: '#714F8F', pjDark: '#643D7C', uv: '#3E1874', uvDark: '#3D1E6F',
  },
  'surface.accent.selected_subtle': {
    dark: '#220B35', light: '#FAF6FF', pj: '#F8F6F9', pjDark: '#F8F6F9', uv: '#FAF6FD', uvDark: '#1F0F38',
  },
  'background.default': {
    dark: '#000000', light: '#FFFFFF', pj: '#FFFFFF', pjDark: '#000000', uv: '#FFFFFF', uvDark: '#000000',
  },
  'background.subtle': {
    dark: '#222222', light: '#F0EEF1', pj: '#F0EEF1', pjDark: '#222222', uv: '#F0EEF1', uvDark: '#222222',
  },
  'surface.subtle': {
    dark: '#222222', light: '#F8F6F8', pj: '#F8F6F8', pjDark: '#222222', uv: '#F8F6F8', uvDark: '#222222',
  },
  'content.default': {
    light: '#1F0230', pj: '#1F0230', uv: '#1F0230',
  },
  'border.strong': {
    dark: '#818181', light: '#766380', pj: '#766380', pjDark: '#818181', uv: '#766380', uvDark: '#818181',
  },
  'border.disabled': {
    dark: '#222222', light: '#F0EEF1', pj: '#F0EEF1', pjDark: '#222222', uv: '#F0EEF1', uvDark: '#222222',
  },
} as const;

export type MagicColorMode = 'light' | 'dark' | 'uv' | 'uvDark' | 'pj' | 'pjDark';
export type MagicColorTokenName = keyof typeof magicColorTokens;

export function getMagicColorToken(
  token: MagicColorTokenName,
  mode: MagicColorMode,
): string | undefined {
  return (magicColorTokens[token] as Record<string, string>)[mode];
}
