/**
 * Box — Web equivalent of the RN NuDS Box primitive.
 *
 * Provides a themed container div with background from the NuDS theme.
 */

import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';
import type { NuDSWebTheme } from '../theme';

type BoxSurface = 'screen' | 'primary' | 'secondary' | 'elevated';

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  surface?: BoxSurface;
  theme: NuDSWebTheme;
  children?: ReactNode;
}

export function Box({ surface = 'screen', theme, style, children, ...rest }: BoxProps) {
  const bgMap: Record<BoxSurface, string> = {
    screen: theme.color.background.screen,
    primary: theme.color.background.primary,
    secondary: theme.color.background.secondary,
    elevated: theme.color.background.elevated,
  };

  const boxStyle: CSSProperties = {
    backgroundColor: bgMap[surface],
    transition: 'background-color 0.3s ease',
    ...(style as CSSProperties),
  };

  return <div style={boxStyle} {...rest}>{children}</div>;
}
