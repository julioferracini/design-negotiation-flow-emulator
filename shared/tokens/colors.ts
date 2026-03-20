/**
 * NuDS V3 — Semantic Color Tokens
 *
 * Platform-agnostic. Used by both Expo (via theme bridge) and Web (via Tailwind).
 * Values sourced from NuDS V3 Figma tokens.
 */

export const color = {
  content: {
    accent: { primary: '#820ad1' },
    default: '#1f0230',
    subtle: 'rgba(0, 0, 0, 0.64)',
    on: { color: '#ffffff' },
    disabled: 'rgba(0, 0, 0, 0.32)',
    placeholder: 'rgba(0, 0, 0, 0.4)',
    feedback: {
      success: '#0c7a3a',
      error: '#d4183d',
      critical: '#d01d1c',
      attention: '#af4d0e',
    },
  },

  surface: {
    accent: {
      primary: '#820ad1',
      active: '#820ad1',
      primarySubtleOnSubtle: '#ecd9ff',
    },
    default: '#ffffff',
    glass: 'rgba(255, 255, 255, 0.67)',
    glassStrong: 'rgba(255, 255, 255, 0.92)',
    glassMedium: 'rgba(255, 255, 255, 0.84)',
    feedback: {
      success: '#ddf5e5',
      error: '#FEF0F0',
    },
  },

  background: {
    default: '#ffffff',
    subtle: '#f0eef1',
  },

  border: {
    default: '#efefef',
    subtle: 'rgba(31, 2, 48, 0.06)',
    strong: 'rgba(31, 2, 48, 0.1)',
  },

  overlay: {
    dark: 'rgba(0, 0, 0, 0.4)',
    medium: 'rgba(0, 0, 0, 0.18)',
    light: 'rgba(0, 0, 0, 0.12)',
    subtle: 'rgba(0, 0, 0, 0.04)',
  },
} as const;

export const colors = {
  primary: {
    purple: color.content.accent.primary,
    purpleLight: 'rgba(130, 10, 209, 0.05)',
    purpleHover: 'rgba(130, 10, 209, 0.06)',
    purplePressed: 'rgba(130, 10, 209, 0.12)',
    purpleShadow: 'rgba(130, 10, 209, 0.25)',
    purpleShadowStrong: 'rgba(130, 10, 209, 0.28)',
    purpleRing: 'rgba(130, 10, 209, 0.3)',
    purpleMuted: 'rgba(130, 10, 209, 0.5)',
  },

  purpleTint: {
    subtle: '#faf6ff',
    light: '#f6ecff',
    medium: color.surface.accent.primarySubtleOnSubtle,
  },

  text: {
    primary: color.content.default,
    primaryAlt: '#1f002f',
    secondary: 'rgba(31, 2, 48, 0.62)',
    muted: color.content.subtle,
    subtle: 'rgba(0, 0, 0, 0.52)',
    hint: 'rgba(0, 0, 0, 0.44)',
    placeholder: color.content.placeholder,
    disabled: color.content.disabled,
    inverse: color.content.on.color,
    inverseSecondary: 'rgba(255, 255, 255, 0.72)',
  },

  success: {
    background: color.surface.feedback.success,
    text: color.content.feedback.success,
    textAlt: '#2eab57',
    border: 'rgba(30, 165, 84, 0.1)',
    borderAlt: 'rgba(30, 165, 84, 0.2)',
  },

  error: {
    text: color.content.feedback.error,
    critical: color.content.feedback.critical,
    background: color.surface.feedback.error,
    icon: '#E53E3E',
    border: 'rgba(212, 24, 61, 0.2)',
  },

  neutral: {
    white: color.surface.default,
    gray: '#e3e0e5',
    grayLight: '#efefef',
    grayMid: '#f8f6f8',
    grayDark: 'rgba(31, 2, 48, 0.62)',
    disabled: '#c7c7cc',
    disabledText: 'rgba(255, 255, 255, 0.72)',
  },

  border: {
    default: 'rgba(31, 2, 48, 0.08)',
    subtle: color.border.subtle,
    light: 'rgba(31, 2, 48, 0.07)',
    strong: color.border.strong,
    divider: color.border.default,
  },

  overlay: {
    dark: color.overlay.dark,
    medium: color.overlay.medium,
    light: color.overlay.light,
    subtle: color.overlay.subtle,
  },

  surface: {
    glass: color.surface.glass,
    glassStrong: color.surface.glassStrong,
    glassMedium: color.surface.glassMedium,
    card: color.surface.default,
  },
} as const;

export type NuDSColor = typeof color;
export type Colors = typeof colors;
