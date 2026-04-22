/**
 * PinCode — Web Building Block (pixel-perfect from Figma [Magic] PIN Code).
 *
 * Renders 4 PIN digit slots (48x48 pill) with three visual states:
 *   - empty    → small 8px subtle dot (placeholder)
 *   - filled   → 16px primary dot (purple)
 *   - error    → 16px negative dot (red)
 *
 * Shake animation on error is handled by the parent via motion.
 *
 * Dual-platform twin: screens/PinCodeSheet.tsx (Expo).
 */

import { motion } from 'motion/react';
import type { NuDSWebTheme } from '../nuds';

const PIN_LENGTH = 4;

export type PinCodeState = 'idle' | 'validating' | 'error';

export interface PinCodeProps {
  value: string;
  length?: number;
  state: PinCodeState;
  theme: NuDSWebTheme;
}

function PinDigit({
  filled,
  error,
  theme,
}: {
  filled: boolean;
  error: boolean;
  theme: NuDSWebTheme;
}) {
  const t = theme;
  const size = filled || error ? 16 : 8;
  const color = error
    ? t.color.negative
    : filled
      ? t.color.content.primary
      : t.color.content.secondary;

  return (
    <div
      className="nf-proto__pin-dot"
      style={{
        width: 48,
        height: 48,
        borderRadius: t.radius.full,
        background: t.color.background.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <motion.div
        initial={false}
        animate={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
        style={{
          borderRadius: t.radius.full,
        }}
      />
    </div>
  );
}

export function PinCode({ value, length = PIN_LENGTH, state, theme }: PinCodeProps) {
  const digits = Array.from({ length });
  const isError = state === 'error';
  const filledCount = value.length;

  return (
    <motion.div
      key={isError ? 'shake' : 'still'}
      animate={{ x: isError ? [0, -6, 6, -4, 4, 0] : 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        display: 'flex',
        gap: theme.spacing[6],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {digits.map((_, i) => (
        <PinDigit
          key={i}
          filled={i < filledCount}
          error={isError && i < filledCount}
          theme={theme}
        />
      ))}
    </motion.div>
  );
}
