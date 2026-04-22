/**
 * LinearProgressBar — Linear progress indicator (React Native).
 *
 * NuDS does not export a linear progress bar (only CircularLoader / LimitBar),
 * so this primitive fills the gap using NuDS design tokens:
 *   • track  = theme.color.background.subtle  (#efefef in light mode)
 *   • fill   = theme.color.main               (accent, respects theme segment)
 *   • radius = 8px (border.radius.geometry.medium)
 *   • height = 4px default
 *
 * Anatomy matches Figma "[Magic] Linear Progress Bar" spec from the Loading
 * screens (nodes 10883:14556 and 10883:14642).
 *
 * Usage:
 *   <LinearProgressBar progress={0.33} width={327} />
 *
 * Progress updates are animated between renders with Animated.timing so the
 * caller can just bump `progress` step by step.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useNuDSTheme } from '@nubank/nuds-vibecode-react-native';

export type LinearProgressBarProps = {
  /** Progress, 0..1 (values outside the range are clamped). */
  progress: number;
  /** Fixed width in px. If omitted the bar fills its parent. */
  width?: number;
  /** Bar height in px. Default matches Figma (4px). */
  height?: number;
  /** Corner radius. Default 8px to match NuDS medium geometry radius. */
  radius?: number;
  /** Animation duration for progress changes in ms. */
  durationMs?: number;
  /** Override the fill color. Defaults to theme.color.main. */
  fillColor?: string;
  /** Override the track color. Defaults to theme.color.background.subtle. */
  trackColor?: string;
};

export default function LinearProgressBar({
  progress,
  width,
  height = 4,
  radius = 8,
  durationMs = 700,
  fillColor,
  trackColor,
}: LinearProgressBarProps) {
  const theme = useNuDSTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  const anim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: durationMs,
      useNativeDriver: false,
    }).start();
  }, [clamped, durationMs, anim]);

  const widthPct = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const resolvedTrack =
    trackColor ??
    (theme.color.background as { subtle?: string }).subtle ??
    theme.color.border.secondary;

  const resolvedFill = fillColor ?? theme.color.main;

  /*
   * React Native (Fabric / iOS) requires integer values in accessibilityValue
   * — passing 0.1 directly triggers "Loss of precision during arithmetic
   * conversion: (long long) 0.1". We scale 0..1 to 0..100 and provide a
   * human-readable `text` for screen readers.
   */
  const pct = Math.round(clamped * 100);

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: radius, backgroundColor: resolvedTrack },
        width !== undefined ? { width } : styles.fullWidth,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct, text: `${pct}%` }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthPct,
            height,
            borderRadius: radius,
            backgroundColor: resolvedFill,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  fill: {
    alignSelf: 'flex-start',
  },
});
