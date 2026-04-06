import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  NText,
  Avatar,
  Button,
  Box,
  ArrowBackIcon,
  CalculatorIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import { getUseCaseForLocale } from '../config/useCases';
import { formatCurrency, interpolate } from '../config/formatters';

const TIP_INTERVAL = 4000;
const TIP_SLIDE = 20;
const MIN_AMOUNT = 50;
const ERROR_DEBOUNCE = 1000;

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
        backgroundColor: pressed ? theme.color.background.secondaryFeedback : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
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

function RouletteTip({
  tips,
  tipIndex,
  fmtMinAmount,
  theme,
}: {
  tips: string[];
  tipIndex: number;
  fmtMinAmount: string;
  theme: ReturnType<typeof useNuDSTheme>;
}) {
  const slideY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevIndex = useRef(tipIndex);

  useEffect(() => {
    if (tipIndex === prevIndex.current) return;
    prevIndex.current = tipIndex;
    Animated.parallel([
      Animated.timing(slideY, { toValue: -TIP_SLIDE, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      slideY.setValue(TIP_SLIDE);
      Animated.parallel([
        Animated.timing(slideY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }, [tipIndex, slideY, opacity]);

  const text = tips[tipIndex].includes('{amount}')
    ? interpolate(tips[tipIndex], { amount: fmtMinAmount })
    : tips[tipIndex];

  return (
    <Animated.View style={{ transform: [{ translateY: slideY }], opacity }}>
      <NText variant="labelXSmallStrong" color={theme.color.main} style={{ flex: 1 }}>
        {text}
      </NText>
    </Animated.View>
  );
}

function RouletteValue({ text, theme }: { text: string; theme: ReturnType<typeof useNuDSTheme> }) {
  const slideY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevText = useRef(text);

  useEffect(() => {
    if (text === prevText.current) return;
    prevText.current = text;
    Animated.parallel([
      Animated.timing(slideY, { toValue: -14, duration: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      slideY.setValue(14);
      Animated.parallel([
        Animated.timing(slideY, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    });
  }, [text, slideY, opacity]);

  return (
    <Animated.View style={{ transform: [{ translateY: slideY }], opacity }}>
      <NText variant="labelMediumStrong" color="#FFFFFF">{text}</NText>
    </Animated.View>
  );
}

function KeypadRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>{children}</View>;
}

export default function InstallmentValueScreen({
  locale = 'pt-BR',
  onBack,
}: {
  locale?: Locale;
  onBack?: () => void;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const iv = t.installmentValue;
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const [rawDigits, setRawDigits] = useState('');
  const [tipIndex, setTipIndex] = useState(0);
  const [showError, setShowError] = useState(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasValue = rawDigits.length > 0;
  const numericValue = hasValue ? parseInt(rawDigits, 10) / 100 : 0;
  const displayAmount = hasValue ? formatCurrency(numericValue, curr, { showSymbol: false }) : '';
  const isBelowMin = hasValue && numericValue > 0 && numericValue < MIN_AMOUNT;

  const suggestions = [59.90, 100, 150, 200];

  useEffect(() => {
    setShowError(false);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    if (isBelowMin) {
      errorTimer.current = setTimeout(() => setShowError(true), ERROR_DEBOUNCE);
    }
    return () => { if (errorTimer.current) clearTimeout(errorTimer.current); };
  }, [rawDigits, isBelowMin]);

  const errorOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(errorOpacity, {
      toValue: showError ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [showError, errorOpacity]);

  const crossfade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(crossfade, {
      toValue: hasValue ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [hasValue, crossfade]);

  useEffect(() => {
    if (hasValue) return;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % iv.tips.length);
    }, TIP_INTERVAL);
    return () => clearInterval(interval);
  }, [hasValue, iv.tips.length]);

  const handleDigit = useCallback((d: string) => {
    setRawDigits((prev) => prev.length >= 10 ? prev : prev + d);
  }, []);

  const handleBackspace = useCallback(() => {
    setRawDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleSuggestion = useCallback((amount: number) => {
    setRawDigits(Math.round(amount * 100).toString());
  }, []);

  const tipOpacity = crossfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const tipTranslateY = crossfade.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const btnOpacity = crossfade.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const btnTranslateY = crossfade.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });

  const simulateLabel = interpolate(iv.simulateWith, { symbol: curr.symbol, amount: displayAmount || '0' });
  const errorMsg = interpolate(iv.minimumError, { amount: fmtAmount(MIN_AMOUNT) });

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />

      <TopBar
        title={iv.title}
        variant="default"
        showStatusBar={false}
        leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
        onPressLeading={onBack}
        show1stAction={false}
        show2ndAction={false}
      />

      <View style={s.body}>
        <NText variant="titleMedium" style={s.heading}>{iv.heading}</NText>

        <View style={s.inputArea}>
          <View style={s.amountRow}>
            <NText
              variant="titleMedium"
              style={{ color: hasValue ? theme.color.content.secondary : theme.color.content.disabled }}
            >
              {curr.symbol}
            </NText>
            {hasValue && (
              <NText variant="titleMedium" style={{ marginLeft: 12 }}>{displayAmount}</NText>
            )}
          </View>
          <View style={[s.divider, {
            backgroundColor: showError ? theme.color.negative : theme.color.border.secondary,
          }]} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.suggestionsScroll}
          contentContainerStyle={s.suggestionsContent}
        >
          {suggestions.map((amt) => (
            <Button
              key={amt}
              label={fmtAmount(amt)}
              variant="secondary"
              compact
              onPress={() => handleSuggestion(amt)}
            />
          ))}
        </ScrollView>

        {/* Error feedback */}
        <Animated.View style={{ opacity: errorOpacity, marginTop: 8, marginBottom: 4 }}>
          <NText variant="labelXSmallDefault" color={theme.color.negative}>
            {errorMsg}
          </NText>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Crossfade: Tip Box ↔ Simulate Button */}
        <View style={{ position: 'relative', minHeight: 56, marginBottom: 16 }}>
          <Animated.View style={[s.tipBanner, {
            backgroundColor: theme.color.surface.accent,
            borderColor: theme.color.surface.accentStrong,
            opacity: tipOpacity,
            transform: [{ translateY: tipTranslateY }],
            position: 'absolute', left: 0, right: 0, top: 0,
          }]}>
            <Avatar variant="icon" size="small" icon={<CalculatorIcon size={16} color={theme.color.main} />} />
            <View style={{ flex: 1, marginLeft: 8, overflow: 'hidden' }}>
              <RouletteTip tips={iv.tips} tipIndex={tipIndex} fmtMinAmount={fmtAmount(MIN_AMOUNT)} theme={theme} />
            </View>
          </Animated.View>

          <Animated.View style={{
            opacity: btnOpacity,
            transform: [{ translateY: btnTranslateY }],
            position: 'absolute', left: 0, right: 0, top: 0,
            overflow: 'hidden',
          }}>
            <Pressable
              onPress={() => {}}
              disabled={isBelowMin}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: 24,
                backgroundColor: isBelowMin ? theme.color.background.disabled : (pressed ? theme.color.mainFeedback : theme.color.main),
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              })}
            >
              <NText variant="labelMediumStrong" color="#FFFFFF" style={{ marginRight: 4 }}>
                {iv.simulate}{' '}
              </NText>
              <View style={{ overflow: 'hidden', height: 20 }}>
                <RouletteValue text={hasValue ? `${curr.symbol} ${displayAmount}` : ''} theme={theme} />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <View style={[s.keypad, { backgroundColor: '#D1D1D6' }]}>
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
  body: { flex: 1, paddingHorizontal: 24 },
  heading: { marginBottom: 24 },
  inputArea: { marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', minHeight: 40 },
  divider: { height: 2, marginTop: 8 },
  suggestionsScroll: { flexGrow: 0, marginBottom: 0 },
  suggestionsContent: { gap: 8, paddingRight: 8 },
  tipBanner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 8,
    borderRadius: 24, borderWidth: 1,
  },
  keypad: {
    padding: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 6,
  },
});
