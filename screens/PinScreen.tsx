import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  NText,
  Box,
  ArrowBackIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';

const PIN_LENGTH = 4;

function Dot({ filled, theme }: { filled: boolean; theme: ReturnType<typeof useNuDSTheme> }) {
  return (
    <View style={{
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: filled ? theme.color.main : theme.color.border.primary,
      backgroundColor: filled ? theme.color.main : 'transparent',
    }} />
  );
}

function NumKey({
  label,
  sub,
  onPress,
  theme,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
  theme: ReturnType<typeof useNuDSTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 52,
        borderRadius: 5,
        backgroundColor: pressed ? theme.color.background.secondaryFeedback : theme.color.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.color.content.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 0,
        elevation: 1,
      })}
    >
      <NText variant="titleMedium" tone="secondary" style={{ lineHeight: 26 }}>{label}</NText>
      {sub ? (
        <NText variant="label2XSmallStrong" tone="secondary" style={{ letterSpacing: 1.9, lineHeight: 12 }}>{sub}</NText>
      ) : null}
    </Pressable>
  );
}

function KeypadRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>{children}</View>;
}

export default function PinScreen({
  locale = 'pt-BR',
  onBack,
  onConfirm,
}: {
  locale?: Locale;
  onBack?: () => void;
  onConfirm?: (pin: string) => void;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const p = t.pin;

  const [digits, setDigits] = useState('');

  const handleDigit = useCallback((d: string) => {
    setDigits((prev) => {
      const next = prev.length < PIN_LENGTH ? prev + d : prev;
      if (next.length === PIN_LENGTH) {
        setTimeout(() => onConfirm?.(next), 120);
      }
      return next;
    });
  }, [onConfirm]);

  const handleBackspace = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />
      <TopBar
        title={p.title}
        variant="default"
        showStatusBar={false}
        leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
        onPressLeading={onBack}
        show1stAction={false}
        show2ndAction={false}
      />

      <View style={s.body}>
        <View style={{ flex: 1 }} />
        <View style={s.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <Dot key={i} filled={i < digits.length} theme={theme} />
          ))}
        </View>
        <View style={{ flex: 1 }} />
      </View>

      <View style={[s.keypad, { backgroundColor: theme.color.background.secondary }]}>
        <KeypadRow>
          <NumKey label="1" onPress={() => handleDigit('1')} theme={theme} />
          <NumKey label="2" sub="ABC" onPress={() => handleDigit('2')} theme={theme} />
          <NumKey label="3" sub="DEF" onPress={() => handleDigit('3')} theme={theme} />
        </KeypadRow>
        <KeypadRow>
          <NumKey label="4" sub="GHI" onPress={() => handleDigit('4')} theme={theme} />
          <NumKey label="5" sub="JKL" onPress={() => handleDigit('5')} theme={theme} />
          <NumKey label="6" sub="MNO" onPress={() => handleDigit('6')} theme={theme} />
        </KeypadRow>
        <KeypadRow>
          <NumKey label="7" sub="PQRS" onPress={() => handleDigit('7')} theme={theme} />
          <NumKey label="8" sub="TUV" onPress={() => handleDigit('8')} theme={theme} />
          <NumKey label="9" sub="WXYZ" onPress={() => handleDigit('9')} theme={theme} />
        </KeypadRow>
        <KeypadRow>
          <View style={{ flex: 1, height: 52 }} />
          <NumKey label="0" onPress={() => handleDigit('0')} theme={theme} />
          <Pressable
            onPress={handleBackspace}
            style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' }}
          >
            <NText variant="titleSmall" tone="secondary">⌫</NText>
          </Pressable>
        </KeypadRow>
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  body: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 20 },
  keypad: {
    padding: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 6,
  },
});
