/**
 * NuDS Web Adapter — barrel export.
 *
 * Provides the same semantic tokens and component abstractions as
 * @nubank/nuds-vibecode-react-native but for Vite/web.
 */

// Theme
export { buildNuDSWebTheme, injectNuDSCSSVars } from './theme';
export type { NuDSWebTheme, NuDSSegment, ThemeMode } from './theme';

// Tokens
export {
  spacing,
  radius,
  typography,
  motion,
  zIndex,
  elevation,
  elevationToBoxShadow,
  boxShadow,
} from './tokens';
export type { TypographyVariant } from './tokens';

// Components
export { NText } from './components/NText';
export type { NTextProps } from './components/NText';

export { Badge } from './components/Badge';
export type { BadgeProps } from './components/Badge';

export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Box } from './components/Box';
export type { BoxProps } from './components/Box';

export { TopBar } from './components/TopBar';
export type { TopBarProps } from './components/TopBar';

export { SectionTitle } from './components/SectionTitle';
export type { SectionTitleProps } from './components/SectionTitle';
