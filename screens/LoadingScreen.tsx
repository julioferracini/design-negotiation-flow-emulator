import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NText,
  Box,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';

const STEP_DURATION = 1400;

export default function LoadingScreen({
  locale = 'pt-BR',
  onDone,
}: {
  locale?: Locale;
  onDone?: () => void;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const l = t.loading;

  const steps = [l.processing, l.step1, l.step2];
  const [stepIndex, setStepIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      const timer = setTimeout(() => onDone?.(), STEP_DURATION);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setStepIndex((i) => i + 1);
        opacity.setValue(0);
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    }, STEP_DURATION);
    return () => clearTimeout(timer);
  }, [stepIndex, steps.length, onDone, opacity]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />
      <View style={s.center}>
        <Animated.View style={[s.spinner, { borderTopColor: theme.color.main, transform: [{ rotate: spin }] }]} />
        <View style={{ height: 32 }} />
        <NText variant="titleSmall" style={{ textAlign: 'center' }}>{l.title}</NText>
        <View style={{ height: 8 }} />
        <Animated.View style={{ opacity }}>
          <NText variant="paragraphSmallDefault" tone="secondary" style={{ textAlign: 'center' }}>
            {steps[stepIndex]}
          </NText>
        </Animated.View>
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
});
