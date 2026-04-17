/**
 * TopBar — Web equivalent of the RN NuDS TopBar (variant="modal").
 *
 * Centered title with optional close/back action on the left.
 * Uses typography and color tokens from the NuDS theme.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { NuDSWebTheme } from '../theme';

export interface TopBarProps {
  title?: string;
  variant?: 'default' | 'modal';
  leading?: ReactNode;
  trailing?: ReactNode;
  onPressLeading?: () => void;
  onPressTrailing?: () => void;
  onClose?: () => void;
  theme: NuDSWebTheme;
  style?: CSSProperties;
}

export function TopBar({
  title,
  variant = 'default',
  leading,
  trailing,
  onPressLeading,
  onPressTrailing,
  onClose,
  theme,
  style,
}: TopBarProps) {
  const typo = theme.typography.subtitleSmallStrong;
  const isModal = variant === 'modal';

  const handleLeadingClick = onPressLeading ?? onClose;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 44px',
        alignItems: 'center',
        padding: `0 ${theme.spacing[2]}px`,
        minHeight: 44,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        {(leading || isModal) && (
          <button
            type="button"
            onClick={handleLeadingClick}
            aria-label="Close"
            style={{
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: theme.radius.lg,
              background: 'transparent',
              cursor: 'pointer',
              color: theme.color.content.secondary,
              fontSize: 22,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.3s',
              padding: 0,
            }}
          >
            {leading ?? '×'}
          </button>
        )}
      </div>

      <span
        style={{
          fontFamily: typo.fontFamily,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: 600,
          textAlign: 'center',
          color: theme.color.content.primary,
          transition: 'color 0.3s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </span>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {trailing && (
          <button
            type="button"
            onClick={onPressTrailing}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: theme.radius.lg,
              background: 'transparent',
              cursor: 'pointer',
              color: theme.color.content.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {trailing}
          </button>
        )}
      </div>
    </div>
  );
}
