/**
 * Button — Web equivalent of the RN NuDS Button component.
 *
 * Supports primary, secondary, ghost, destructive variants.
 * Uses theme tokens for sizing, radius, colors, and elevation.
 */

import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react';
import type { NuDSWebTheme } from '../theme';
import { elevationToBoxShadow } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  label?: string;
  variant?: ButtonVariant;
  compact?: boolean;
  expanded?: boolean;
  loading?: boolean;
  onColor?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  theme: NuDSWebTheme;
  style?: CSSProperties;
}

export function Button({
  label,
  variant = 'primary',
  compact = false,
  expanded = false,
  loading = false,
  onColor = false,
  disabled,
  leadingIcon,
  trailingIcon,
  theme,
  style,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const height = compact ? 40 : 48;
  const py = compact ? theme.spacing[2] : theme.spacing[3];
  const px = compact ? theme.spacing[4] : theme.spacing[6];

  const bgMap: Record<ButtonVariant, string> = {
    primary: onColor ? theme.color.background.primary : theme.color.main,
    secondary: theme.color.background.primary,
    ghost: 'transparent',
    destructive: theme.color.negative,
  };

  const borderMap: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: `1px solid ${theme.color.border.secondary}`,
    ghost: undefined,
    destructive: undefined,
  };

  const labelColorMap: Record<ButtonVariant, string> = {
    primary: onColor ? theme.color.content.primary : theme.color.content.main,
    secondary: theme.color.content.primary,
    ghost: onColor ? theme.color.content.main : theme.color.main,
    destructive: theme.color.content.main,
  };

  const shadow = variant !== 'ghost' && !isDisabled
    ? elevationToBoxShadow('level1')
    : undefined;

  const typo = theme.typography.labelSmallStrong;

  const btnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    height,
    paddingTop: py,
    paddingBottom: py,
    paddingLeft: px,
    paddingRight: px,
    borderRadius: theme.radius.full,
    border: borderMap[variant] ?? 'none',
    background: bgMap[variant],
    color: labelColorMap[variant],
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    lineHeight: `${typo.lineHeight}px`,
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    boxShadow: shadow,
    width: expanded ? '100%' : undefined,
    transition: 'background 0.2s, opacity 0.2s, box-shadow 0.2s',
    ...style,
  };

  return (
    <button type="button" disabled={isDisabled} style={btnStyle} {...rest}>
      {leadingIcon}
      {loading ? '...' : (label ?? children)}
      {trailingIcon}
    </button>
  );
}
