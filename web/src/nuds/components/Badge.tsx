/**
 * Badge — Web equivalent of the RN NuDS Badge component.
 *
 * Uses surface.* and content.* tokens for color mapping,
 * radius.md for border radius, spacing[2] for horizontal padding.
 */

import type { CSSProperties, HTMLAttributes } from 'react';
import type { NuDSWebTheme } from '../theme';

type BadgeColor = 'accent' | 'neutral' | 'success' | 'attention' | 'critical';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  color?: BadgeColor;
  enabled?: boolean;
  onSubtle?: boolean;
  theme: NuDSWebTheme;
}

export function Badge({
  label,
  color = 'accent',
  enabled = true,
  onSubtle = false,
  theme,
  style,
  ...rest
}: BadgeProps) {
  const surfaces = {
    accent:    { bg: theme.color.surface.accent,   bgStrong: theme.color.surface.accentStrong },
    neutral:   { bg: theme.color.surface.neutral,   bgStrong: theme.color.surface.neutralStrong },
    success:   { bg: theme.color.surface.success,   bgStrong: theme.color.surface.successStrong },
    attention: { bg: theme.color.surface.warning,   bgStrong: theme.color.surface.warningStrong },
    critical:  { bg: theme.color.surface.critical,  bgStrong: theme.color.surface.criticalStrong },
    disabled:  { bg: theme.color.surface.neutral,   bgStrong: theme.color.surface.neutralStrong },
  } as const;

  const resolved = enabled ? color : 'disabled';
  const s = surfaces[resolved];
  const bg = onSubtle ? s.bgStrong : s.bg;

  const textColor = enabled
    ? ({
        accent: theme.color.main,
        neutral: theme.color.content.secondary,
        success: theme.color.positive,
        attention: theme.color.warning,
        critical: theme.color.negative,
      })[color]
    : theme.color.content.disabled;

  const typo = theme.typography.labelXSmallStrong;

  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.spacing[2],
    paddingRight: theme.spacing[2],
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: theme.radius.md,
    backgroundColor: bg,
    minHeight: 20,
    maxWidth: 359,
    overflow: 'hidden',
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    lineHeight: `${typo.lineHeight}px`,
    letterSpacing: 'letterSpacing' in typo ? `${(typo as any).letterSpacing}px` : undefined,
    fontWeight: 600,
    color: textColor,
    whiteSpace: 'nowrap',
    transition: 'background-color 0.3s, color 0.3s',
    ...(style as CSSProperties),
  };

  return (
    <span style={badgeStyle} {...rest}>
      {label}
    </span>
  );
}
