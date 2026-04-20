/**
 * LinearProgressBar — Linear progress indicator (Web).
 *
 * Web mirror of components/primitives/LinearProgressBar.tsx (React Native).
 * NuDS doesn't ship a linear progress bar, so this primitive builds one with
 * the same anatomy as the Figma "[Magic] Linear Progress Bar" (Loading
 * screens 10883:14556 / 10883:14642):
 *   • track  = NuDS background.subtle (falls back to border.secondary)
 *   • fill   = NuDS color.main (respects the active segment)
 *   • radius = 8px (NuDS medium geometry)
 *   • height = 4px default
 *
 * Progress transitions animate via framer-motion so the caller can just bump
 * `progress` step by step and get smooth interpolation for free.
 */

import { motion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';

export type LinearProgressBarProps = {
  /** Progress, 0..1 (values outside the range are clamped). */
  progress: number;
  /** Fixed width in px. If omitted the bar fills its parent. */
  width?: number | string;
  /** Bar height in px. Default matches Figma (4px). */
  height?: number;
  /** Corner radius. Default 8px to match NuDS medium geometry radius. */
  radius?: number;
  /** Animation duration for progress changes in ms. */
  durationMs?: number;
  /** Override the fill color. Defaults to theme.color.main. */
  fillColor?: string;
  /** Override the track color. Defaults to background.subtle. */
  trackColor?: string;
  /** Optional test id to query the bar in stories / diagnostics. */
  testId?: string;
};

export default function LinearProgressBar({
  progress,
  width,
  height = 4,
  radius = 8,
  durationMs = 700,
  fillColor,
  trackColor,
  testId,
}: LinearProgressBarProps) {
  const { nuds } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  const resolvedTrack =
    trackColor ??
    (nuds.color.background as { subtle?: string }).subtle ??
    nuds.color.border.secondary;

  const resolvedFill = fillColor ?? nuds.color.main;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={clamped}
      data-testid={testId}
      style={{
        position: 'relative',
        width: width ?? '100%',
        height,
        borderRadius: radius,
        background: resolvedTrack,
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={false}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: durationMs / 1000, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: '100%',
          borderRadius: radius,
          background: resolvedFill,
        }}
      />
    </div>
  );
}
