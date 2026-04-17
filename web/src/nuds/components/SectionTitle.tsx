/**
 * SectionTitle — Web equivalent of the RN NuDS SectionTitle component.
 *
 * Row with title on the left and optional secondary action on the right.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { NuDSWebTheme } from '../theme';
import { NText } from './NText';

export interface SectionTitleProps {
  title?: string;
  compact?: boolean;
  secondary?: string;
  secondaryTone?: 'secondary' | 'accent';
  onSecondaryPress?: () => void;
  trailing?: ReactNode;
  onTrailingPress?: () => void;
  theme: NuDSWebTheme;
  style?: CSSProperties;
}

export function SectionTitle({
  title = 'Section title',
  compact = true,
  secondary,
  secondaryTone = 'secondary',
  onSecondaryPress,
  trailing,
  onTrailingPress,
  theme,
  style,
}: SectionTitleProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingLeft: theme.spacing[5],
        paddingRight: theme.spacing[2],
        ...style,
      }}
    >
      <NText
        variant={compact ? 'labelSmallStrong' : 'titleXSmall'}
        tone={compact ? 'secondary' : 'primary'}
        theme={theme}
        style={{ flex: 1 }}
        numberOfLines={1}
      >
        {title}
      </NText>

      {secondary && (
        <button
          type="button"
          onClick={onSecondaryPress}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: onSecondaryPress ? 'pointer' : 'default',
            paddingRight: !trailing ? theme.spacing[3] : 0,
            padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
          }}
        >
          <NText
            variant="labelSmallDefault"
            tone={secondaryTone === 'accent' ? undefined : 'secondary'}
            color={secondaryTone === 'accent' ? theme.color.main : undefined}
            theme={theme}
          >
            {secondary}
          </NText>
        </button>
      )}

      {trailing && (
        <button
          type="button"
          onClick={onTrailingPress}
          style={{
            width: 48,
            height: 48,
            borderRadius: theme.radius.full,
            border: 'none',
            background: 'transparent',
            cursor: onTrailingPress ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing[2],
          }}
        >
          {trailing}
        </button>
      )}
    </div>
  );
}
