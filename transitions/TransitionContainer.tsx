import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PRESETS } from './presets';
import type { TransitionPresetName } from './presets';

type Props = {
  preset: TransitionPresetName;
  showForeground: boolean;
  background: React.ReactNode;
  foreground: React.ReactNode;
  onForegroundClosed?: () => void;
};

export default function TransitionContainer({
  preset,
  showForeground,
  background,
  foreground,
  onForegroundClosed,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const config = PRESETS[preset];
  const isVisibleRef = useRef(false);

  const open = useCallback(() => {
    if (isVisibleRef.current) return;
    isVisibleRef.current = true;
    Animated.timing(anim, {
      toValue: 1,
      duration: config.enterDuration,
      useNativeDriver: true,
    }).start();
  }, [anim, config.enterDuration]);

  const close = useCallback(() => {
    if (!isVisibleRef.current) return;
    Animated.timing(anim, {
      toValue: 0,
      duration: config.exitDuration,
      useNativeDriver: true,
    }).start(() => {
      isVisibleRef.current = false;
      onForegroundClosed?.();
    });
  }, [anim, config.exitDuration, onForegroundClosed]);

  React.useEffect(() => {
    if (showForeground) {
      open();
    } else {
      close();
    }
  }, [showForeground, open, close]);

  const bg = config.background;
  const fg = config.foreground;

  const bgScale = anim.interpolate(bg.scale);
  const bgTranslateY = anim.interpolate(bg.translateY);
  const bgTranslateX = anim.interpolate(bg.translateX);
  const bgOpacity = anim.interpolate(bg.opacity);

  const fgTranslateY = anim.interpolate(fg.translateY);
  const fgTranslateX = anim.interpolate(fg.translateX);
  const fgOpacity = anim.interpolate(fg.opacity);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [
              { scale: bgScale },
              { translateY: bgTranslateY },
              { translateX: bgTranslateX },
            ],
            opacity: bgOpacity,
            borderRadius: bg.borderRadius,
            overflow: 'hidden',
          },
        ]}
      >
        {background}
      </Animated.View>

      {(showForeground || isVisibleRef.current) && (
        <Animated.View
          style={[
            styles.foreground,
            {
              transform: [
                { translateY: fgTranslateY },
                { translateX: fgTranslateX },
              ],
              opacity: fgOpacity,
            },
          ]}
        >
          {foreground}
        </Animated.View>
      )}
    </View>
  );
}

export { PRESETS } from './presets';
export type { TransitionPresetName, TransitionConfig } from './presets';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  layer: {
    flex: 1,
  },
  foreground: {
    ...StyleSheet.absoluteFillObject,
  },
});
