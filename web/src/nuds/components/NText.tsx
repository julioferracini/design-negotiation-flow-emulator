/**
 * NText — Web equivalent of the RN NuDS NText primitive.
 *
 * Applies typography tokens (fontFamily, fontSize, lineHeight, letterSpacing)
 * and semantic color tones from the NuDS theme.
 */

import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';
import type { TypographyVariant } from '@nubank/nuds-vibecode-tokens';
import type { NuDSWebTheme } from '../theme';

type TextTone = 'primary' | 'secondary' | 'inverse' | 'positive' | 'warning' | 'negative';

export interface NTextProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  tone?: TextTone;
  color?: string;
  tabularNumbers?: boolean;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'label';
  numberOfLines?: number;
  children?: ReactNode;
  theme: NuDSWebTheme;
}

export function NText({
  variant = 'paragraphMediumDefault',
  tone = 'primary',
  color,
  tabularNumbers,
  as: Tag = 'span',
  numberOfLines,
  theme,
  style,
  children,
  ...rest
}: NTextProps) {
  const typo = theme.typography[variant];

  const toneColorMap: Record<TextTone, string> = {
    primary: theme.color.content.primary,
    secondary: theme.color.content.secondary,
    inverse: theme.color.content.main,
    positive: theme.color.positive,
    warning: theme.color.warning,
    negative: theme.color.negative,
  };

  const isLabel = variant.startsWith('label');
  const useTabular = tabularNumbers ?? isLabel;

  const baseStyle: CSSProperties = {
    margin: 0,
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    lineHeight: `${typo.lineHeight}px`,
    letterSpacing: 'letterSpacing' in typo ? `${(typo as any).letterSpacing}px` : undefined,
    fontWeight: typo.fontFamily.includes('Semibold') || typo.fontFamily.includes('Bold')
      ? 600
      : typo.fontFamily.includes('Medium')
        ? 500
        : 400,
    color: color ?? toneColorMap[tone],
    fontVariantNumeric: useTabular ? 'tabular-nums lining-nums' : undefined,
    transition: 'color 0.3s ease',
  };

  if (numberOfLines) {
    Object.assign(baseStyle, {
      display: '-webkit-box',
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    });
  }

  return (
    <Tag style={{ ...baseStyle, ...(style as CSSProperties) }} {...rest}>
      {children}
    </Tag>
  );
}
