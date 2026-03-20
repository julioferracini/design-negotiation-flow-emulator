import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  TopBar,
  NText,
  Box,
  ArrowBackIcon,
  HelpIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import {
  calculate,
  getRules,
  getSimDebtData,
  findBestInstallmentsForMonthly,
  type CalculateResult,
  type FinancialRules,
} from '../config/financialCalculator';
import { formatCurrency, interpolate } from '../config/formatters';
import { getUseCaseForLocale } from '../config/useCases';

const { width: SW } = Dimensions.get('window');

/* ═══════════════════════════════════════════════════════════════════ */
/*  AnimatedNumber — Roulette (basic Animated API)                   */
/* ═══════════════════════════════════════════════════════════════════ */

function RNAnimatedNumber({
  value,
  fontSize = 44,
  color = '#1f0230',
  letterSpacing = -1,
}: {
  value: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: any;
  color?: string;
  letterSpacing?: number;
}) {
  const prevRef = useRef(value);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [displayValue, setDisplayValue] = useState(value);
  const lineHeight = Math.ceil(fontSize * 1.2);
  const travel = lineHeight;

  useEffect(() => {
    if (value === prevRef.current) return;
    const prevNum = parseFloat(prevRef.current.replace(/[^0-9.-]/g, '')) || 0;
    const currNum = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    const dir = currNum >= prevNum ? 1 : -1;
    prevRef.current = value;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0.3, duration: 120, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -dir * travel * 0.4, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setDisplayValue(value);
      translateY.setValue(dir * travel * 0.4);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  }, [value, travel, translateY, opacity]);

  return (
    <View style={{ height: lineHeight, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY }], opacity }}>
        <NText
          variant="titleMedium"
          style={{ fontSize, fontWeight: '500', color, letterSpacing, lineHeight, textAlign: 'center' } as any}
        >
          {displayValue}
        </NText>
      </Animated.View>
    </View>
  );
}

function CurrencyValueRN({
  symbol,
  value,
  fontSize,
  color = '#1f002f',
}: {
  symbol: string;
  value: string;
  delay?: number;
  fontSize: number;
  color?: string;
}) {
  const lineHeight = Math.ceil(fontSize * 1.2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <NText variant="titleMedium" style={{ fontSize, color, lineHeight, fontWeight: '500' } as any}>
        {symbol}
      </NText>
      <RNAnimatedNumber value={value} fontSize={fontSize} color={color} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  InstallmentsSlider (PanResponder + basic Animated)               */
/* ═══════════════════════════════════════════════════════════════════ */

function InstallmentsSlider({
  value,
  min,
  max,
  onChange,
  labelLeft,
  labelRight,
  accentColor,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  labelLeft: string;
  labelRight: string;
  accentColor: string;
}) {
  const trackWidth = SW - 40;
  const thumbW = 32;
  const containerH = 40;
  const trackTop = (containerH - 4) / 2;
  const thumbTop = (containerH - thumbW) / 2;

  const pct = (value - min) / (max - min);
  const thumbPosAnim = useRef(new Animated.Value(pct * (trackWidth - thumbW))).current;
  const progressWAnim = useRef(new Animated.Value(pct * (trackWidth - thumbW) + thumbW / 2)).current;
  const lastVal = useRef(value);

  useEffect(() => {
    const p = (value - min) / (max - min);
    const pos = p * (trackWidth - thumbW);
    Animated.parallel([
      Animated.spring(thumbPosAnim, { toValue: pos, stiffness: 600, damping: 35, mass: 0.5, useNativeDriver: false }),
      Animated.spring(progressWAnim, { toValue: pos + thumbW / 2, stiffness: 600, damping: 35, mass: 0.5, useNativeDriver: false }),
    ]).start();
  }, [value, min, max, trackWidth, thumbW, thumbPosAnim, progressWAnim]);

  const emitTick = useCallback((newVal: number) => {
    if (newVal !== lastVal.current) {
      lastVal.current = newVal;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(newVal);
  }, [onChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = Math.max(0, Math.min(evt.nativeEvent.pageX - 20, trackWidth));
        const p = x / trackWidth;
        thumbPosAnim.setValue(p * (trackWidth - thumbW));
        progressWAnim.setValue(p * (trackWidth - thumbW) + thumbW / 2);
        const newVal = Math.round(min + p * (max - min));
        emitTick(newVal);
      },
      onPanResponderMove: (evt) => {
        const x = Math.max(0, Math.min(evt.nativeEvent.pageX - 20, trackWidth));
        const p = x / trackWidth;
        thumbPosAnim.setValue(p * (trackWidth - thumbW));
        progressWAnim.setValue(p * (trackWidth - thumbW) + thumbW / 2);
        const newVal = Math.round(min + p * (max - min));
        emitTick(newVal);
      },
      onPanResponderRelease: () => {},
    }),
  ).current;

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <View style={{ height: containerH }} {...panResponder.panHandlers}>
        <View style={{ position: 'absolute', left: 0, right: 0, height: 4, top: trackTop, backgroundColor: '#e3e0e5', borderRadius: 8 }} />
        <Animated.View style={{ position: 'absolute', left: 0, height: 4, top: trackTop, backgroundColor: accentColor, borderRadius: 8, width: progressWAnim }} />
        <Animated.View style={{
          position: 'absolute', width: thumbW, height: thumbW, borderRadius: thumbW / 2,
          backgroundColor: accentColor, top: thumbTop,
          transform: [{ translateX: thumbPosAnim }],
          ...Platform.select({ ios: { shadowColor: accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 }, android: { elevation: 6 } }),
        }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 }}>
        <NText variant="labelSmallStrong" color="rgba(31,2,48,0.62)">{labelLeft}</NText>
        <NText variant="labelSmallStrong" color="rgba(31,2,48,0.62)">{labelRight}</NText>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SavingsBanner                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function SavingsBanner({ savings, symbol, locale }: { savings: number; symbol: string; locale: Locale }) {
  const t = useTranslation(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const formatted = formatCurrency(savings, curr, { showSymbol: false });
  const scale = useRef(new Animated.Value(0.92)).current;
  const opac = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, stiffness: 260, damping: 20, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [scale, opac]);

  const prevRef = useRef(savings);
  useEffect(() => {
    if (savings === prevRef.current) return;
    prevRef.current = savings;
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.045, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.98, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }, 280);
    return () => clearTimeout(timer);
  }, [savings, scale]);

  return (
    <Animated.View style={{
      backgroundColor: '#ddf5e5', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16,
      borderWidth: 1, borderColor: 'rgba(30,165,84,0.1)',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
      transform: [{ scale }], opacity: opac,
    }}>
      <NText variant="paragraphSmallDefault" color="#0c7a3a">{t.simulation.totalSavings} </NText>
      <NText variant="labelSmallStrong" color="#0c7a3a">{symbol} {formatted}</NText>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CheckoutBottomBar                                                */
/* ═══════════════════════════════════════════════════════════════════ */

function CheckoutBar({
  total,
  originalDebt,
  symbol,
  ctaLabel,
  onContinue,
}: {
  total: string;
  originalDebt: string;
  symbol: string;
  ctaLabel: string;
  onContinue: () => void;
}) {
  const theme = useNuDSTheme();
  return (
    <View style={[es.checkoutBar, { borderTopColor: 'rgba(31,2,48,0.08)', backgroundColor: theme.color.background.primary }]}>
      <View style={es.checkoutContent}>
        <View style={{ flex: 1, gap: 4 }}>
          <NText variant="subtitleSmallStrong">Total: {symbol} {total}</NText>
          <NText variant="paragraphSmallDefault" tone="secondary" style={{ textDecorationLine: 'line-through' } as any}>{symbol} {originalDebt}</NText>
        </View>
        <Pressable onPress={onContinue} style={({ pressed }) => [es.ctaBtn, { backgroundColor: theme.color.main, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <NText variant="labelSmallStrong" color="#fff">{ctaLabel}</NText>
        </Pressable>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  RN Bottom Sheet                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

function RNBottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={es.sheetOverlay}>
          <TouchableWithoutFeedback>
            <View style={es.sheetContainer}>
              <View style={es.sheetHandle} />
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CalcSummarySheet                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function CalcSummarySheet({
  visible,
  onClose,
  values,
  rules,
  locale,
  installments,
}: {
  visible: boolean;
  onClose: () => void;
  values: CalculateResult;
  rules: FinancialRules;
  locale: Locale;
  installments: number;
}) {
  const t = useTranslation(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const fmt = (v: number) => formatCurrency(v, curr);
  const sim = t.simulation;
  const theme = useNuDSTheme();

  type Row = { label: string; value: string; highlight?: boolean; negative?: boolean; savings?: boolean };
  const rows: Row[] = [{ label: sim.total, value: fmt(getSimDebtData(locale).originalBalance) }];
  if (values.needsDownpayment && values.downpayment > 0) rows.push({ label: sim.downPayment, value: fmt(values.downpayment) });
  if (values.effectiveRate > 0) rows.push({ label: rules.taxLabel, value: `${values.effectiveRate.toFixed(2)}% a.m.` });
  rows.push({ label: sim.installments, value: `${installments}x` });
  rows.push({ label: sim.monthlyPayment, value: fmt(values.monthlyPayment), highlight: true });
  if (values.totalInterest > 0) rows.push({ label: t.summary.totalInterest, value: fmt(values.totalInterest), negative: true });
  if (values.savings > 0.01) rows.push({ label: t.summary.totalAmountToPay, value: `- ${fmt(values.savings)}`, savings: true });
  rows.push({ label: sim.total, value: fmt(values.total), highlight: true });

  return (
    <RNBottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <NText variant="subtitleMediumStrong">{sim.subtitle}</NText>
        <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}>
          <NText variant="labelSmallStrong">✕</NText>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 300, paddingHorizontal: 20 }}>
        {rows.map((row, i) => (
          <View key={i}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 }}>
              <NText variant="paragraphSmallDefault" color={row.savings ? '#1f0230' : 'rgba(0,0,0,0.52)'}>{row.label}</NText>
              <NText variant="labelSmallStrong" color={row.negative ? '#c0392b' : row.savings ? '#2eab57' : row.highlight ? '#1f0230' : 'rgba(0,0,0,0.78)'}>{row.value}</NText>
            </View>
            {i < rows.length - 1 && <View style={{ height: 1, backgroundColor: 'rgba(31,2,48,0.07)' }} />}
          </View>
        ))}
      </ScrollView>
      <View style={{ padding: 20 }}>
        <Pressable onPress={onClose} style={({ pressed }) => [es.sheetCta, { backgroundColor: theme.color.main, opacity: pressed ? 0.9 : 1 }]}>
          <NText variant="labelSmallStrong" color="#fff">{sim.close}</NText>
        </Pressable>
      </View>
    </RNBottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DownpaymentAlertSheet                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function DownpaymentAlertSheet({ visible, onClose, locale }: { visible: boolean; onClose: () => void; locale: Locale }) {
  const sim = useTranslation(locale).simulation;
  const theme = useNuDSTheme();
  const parts = sim.downPaymentRequiredMessage.split(/<\/?strong>/);

  return (
    <RNBottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: 24, alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(130,10,209,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <HelpIcon size={32} color={theme.color.main} />
        </View>
        <NText variant="titleSmall" style={{ textAlign: 'center', marginBottom: 12 } as any}>{sim.downPaymentRequired}</NText>
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ textAlign: 'center', marginBottom: 24, lineHeight: 22 } as any}>
          {parts.map((p, i) => i % 2 === 1 ? <NText key={i} variant="labelSmallStrong">{p}</NText> : p)}
        </NText>
        <Pressable onPress={onClose} style={({ pressed }) => [es.sheetCta, { backgroundColor: theme.color.main, opacity: pressed ? 0.9 : 1, width: '100%' as any }]}>
          <NText variant="labelSmallStrong" color="#fff">{sim.gotIt}</NText>
        </Pressable>
      </View>
    </RNBottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  BottomSheetEditor — ATM keypad                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function BottomSheetEditorRN({
  visible,
  onClose,
  type,
  title,
  currentValue,
  minValue,
  maxValue,
  locale,
  onValueChange,
  downpaymentFixed,
  onToggleFixed,
}: {
  visible: boolean;
  onClose: () => void;
  type: 'downpayment' | 'monthly' | 'installments';
  title: string;
  currentValue: number;
  minValue?: number;
  maxValue?: number;
  locale: Locale;
  onValueChange: (v: number) => void;
  downpaymentFixed?: boolean;
  onToggleFixed?: () => void;
}) {
  const curr = getUseCaseForLocale(locale).currency;
  const sim = useTranslation(locale).simulation;
  const theme = useNuDSTheme();
  const isCurrency = type !== 'installments';
  const [inputValue, setInputValue] = useState(() => isCurrency ? String(Math.round(currentValue * 100)) : String(currentValue));
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (visible) {
      setInputValue(isCurrency ? String(Math.round(currentValue * 100)) : String(currentValue));
      setHasStarted(false);
    }
  }, [visible, currentValue, isCurrency]);

  const numericValue = isCurrency ? parseInt(inputValue || '0', 10) / 100 : parseInt(inputValue || '0', 10);
  const isBelowMin = minValue !== undefined && numericValue < minValue && numericValue > 0;
  const isAboveMax = maxValue !== undefined && numericValue > maxValue;
  const isOutOfRange = isBelowMin || isAboveMax;

  const displayValue = isCurrency ? formatCurrency(numericValue, curr, { showSymbol: false }) : inputValue || '0';

  const handleKey = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'back') {
      setInputValue((prev) => prev.length > 1 ? prev.slice(0, -1) : '0');
      setHasStarted(true);
      return;
    }
    if (!hasStarted) { setInputValue(key); setHasStarted(true); return; }
    if (isCurrency && inputValue.length >= 8) return;
    if (!isCurrency && inputValue.length >= 3) return;
    setInputValue((prev) => (prev === '0' ? key : prev + key));
  };

  const handleConfirm = () => {
    if (isOutOfRange) return;
    let final = numericValue;
    if (minValue) final = Math.max(minValue, final);
    if (maxValue) final = Math.min(maxValue, final);
    onValueChange(final);
    onClose();
  };

  const hintText = minValue !== undefined && maxValue !== undefined
    ? `${interpolate(sim.downPaymentMinimum, { amount: formatCurrency(minValue, curr) })} · ${interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) })}`
    : undefined;

  const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'back']];

  return (
    <RNBottomSheet visible={visible} onClose={onClose}>
      <View style={{ padding: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <NText variant="subtitleSmallStrong">{title}</NText>
        <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}>
          <NText variant="labelSmallStrong">✕</NText>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {isCurrency && <NText variant="titleMedium" color={isOutOfRange ? '#d4183d' : '#1f0230'}>{curr.symbol}</NText>}
          <NText variant="titleMedium" style={{ color: isOutOfRange ? '#d4183d' : '#1f0230' } as any}>{displayValue}</NText>
          {!isCurrency && <NText variant="paragraphSmallDefault" tone="secondary">x</NText>}
        </View>
        {isOutOfRange && isBelowMin && minValue !== undefined && (
          <NText variant="labelSmallDefault" color="#d4183d" style={{ marginTop: 6 } as any}>
            {interpolate(sim.downPaymentBelowMinimum, { amount: formatCurrency(minValue, curr) })}
          </NText>
        )}
        {!isOutOfRange && hintText && (
          <NText variant="labelSmallDefault" tone="secondary" style={{ marginTop: 4 } as any}>{hintText}</NText>
        )}

        {type === 'downpayment' && onToggleFixed && (
          <Pressable onPress={onToggleFixed} style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: downpaymentFixed ? 'rgba(130,10,209,0.06)' : 'rgba(0,0,0,0.03)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <NText variant="labelSmallStrong" color={downpaymentFixed ? theme.color.main : 'rgba(0,0,0,0.56)'}>{sim.keepForAllInstallments}</NText>
              <NText variant="labelSmallDefault" color={downpaymentFixed ? 'rgba(130,10,209,0.5)' : 'rgba(0,0,0,0.32)'}>{sim.keepForAllInstallmentsSubtitle}</NText>
            </View>
            <View style={{ width: 40, height: 24, borderRadius: 12, backgroundColor: downpaymentFixed ? theme.color.main : 'rgba(0,0,0,0.16)', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', left: downpaymentFixed ? 18 : 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 }, android: { elevation: 2 } }) }} />
            </View>
          </Pressable>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: 'rgba(31,2,48,0.07)', marginHorizontal: 20 }} />

      <View style={{ padding: 16, paddingBottom: 8 }}>
        {keys.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', marginBottom: 4 }}>
            {row.map((k, ci) => (
              <View key={ci} style={{ flex: 1, marginHorizontal: 4 }}>
                {k === '' ? <View style={{ height: 52 }} /> : (
                  <Pressable
                    onPress={() => handleKey(k)}
                    style={({ pressed }) => ({
                      height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: pressed ? 'rgba(130,10,209,0.12)' : k === 'back' ? 'rgba(130,10,209,0.06)' : 'rgba(31,2,48,0.04)',
                      transform: [{ scale: pressed ? 0.92 : 1 }],
                    })}
                  >
                    <NText variant="subtitleSmallStrong" color={k === 'back' ? theme.color.main : '#1f0230'}>
                      {k === 'back' ? '⌫' : k}
                    </NText>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={{ padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
        <Pressable
          onPress={handleConfirm}
          disabled={isOutOfRange}
          style={({ pressed }) => [es.sheetCta, {
            backgroundColor: isOutOfRange ? '#c7c7cc' : theme.color.main,
            opacity: pressed && !isOutOfRange ? 0.9 : 1,
          }]}
        >
          <NText variant="labelSmallStrong" color={isOutOfRange ? 'rgba(255,255,255,0.72)' : '#fff'}>{sim.confirm}</NText>
        </Pressable>
      </View>
    </RNBottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main SimulationScreen                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SimulationScreen({
  locale = 'pt-BR',
  onBack,
  onContinue,
  initialInstallments = 10,
  initialDownpayment,
  initialDownpaymentFixed,
  skipDownpaymentThreshold = false,
}: {
  locale?: Locale;
  onBack?: () => void;
  onContinue?: (data: any) => void;
  initialInstallments?: number;
  initialDownpayment?: number;
  initialDownpaymentFixed?: boolean;
  skipDownpaymentThreshold?: boolean;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const sim = t.simulation;
  const rules = getRules(locale);
  const debtData = getSimDebtData(locale);
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtNum = useCallback((v: number) => formatCurrency(v, curr, { showSymbol: false }), [curr]);

  const [installments, setInstallments] = useState(initialInstallments);
  const [downpayment, setDownpayment] = useState(initialDownpayment ?? 0);
  const [downpaymentFixed, setDownpaymentFixed] = useState(initialDownpaymentFixed ?? false);

  const [showDownpaymentAlert, setShowDownpaymentAlert] = useState(false);
  const [hasShownAlertOnce, setHasShownAlertOnce] = useState(false);
  const [showCalcSummary, setShowCalcSummary] = useState(false);
  const [sheetState, setSheetState] = useState<{ isOpen: boolean; type: 'downpayment' | 'monthly' | 'installments'; title: string }>({ isOpen: false, type: 'monthly', title: '' });

  const [displayedSavings, setDisplayedSavings] = useState(0);
  const savingsDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const values: CalculateResult = useMemo(
    () => calculate({ installments, downpayment, totalDebt: debtData.originalBalance, downpaymentFixed }, locale),
    [installments, downpayment, debtData.originalBalance, downpaymentFixed, locale],
  );

  useEffect(() => {
    if (savingsDebounceRef.current) clearTimeout(savingsDebounceRef.current);
    savingsDebounceRef.current = setTimeout(() => setDisplayedSavings(values.savings), 520);
    return () => { if (savingsDebounceRef.current) clearTimeout(savingsDebounceRef.current); };
  }, [values.savings]);

  useEffect(() => {
    if (skipDownpaymentThreshold) return;
    if (initialInstallments > rules.downPaymentThreshold && downpayment === 0 && !initialDownpayment) {
      setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstallmentsChange = useCallback((newN: number) => {
    const prevNeeds = installments > rules.downPaymentThreshold;
    const nowNeeds = newN > rules.downPaymentThreshold;
    setInstallments(newN);
    if (skipDownpaymentThreshold) return;
    if (!prevNeeds && nowNeeds) {
      if (!hasShownAlertOnce) { setShowDownpaymentAlert(true); setHasShownAlertOnce(true); }
      if (!downpaymentFixed) setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
    }
    if (prevNeeds && !nowNeeds && !downpaymentFixed) setDownpayment(0);
  }, [installments, rules, skipDownpaymentThreshold, hasShownAlertOnce, downpaymentFixed, debtData]);

  const handleMonthlyChange = useCallback((newMonthly: number) => {
    const bestN = findBestInstallmentsForMonthly(newMonthly, downpayment, debtData.originalBalance, downpaymentFixed, locale);
    handleInstallmentsChange(bestN);
  }, [downpayment, debtData, downpaymentFixed, locale, handleInstallmentsChange]);

  const handleDownpaymentChange = useCallback((newDp: number) => {
    const minDp = debtData.originalBalance * rules.downPaymentMinPercent;
    const maxDp = debtData.originalBalance * rules.downPaymentMaxPercent;
    setDownpayment(Math.max(minDp, Math.min(maxDp, newDp)));
  }, [debtData, rules]);

  const handleContinue = () => {
    onContinue?.({ installments, monthlyPayment: values.monthlyPayment, savings: values.savings, total: values.total, downpayment: skipDownpaymentThreshold ? 0 : downpayment, hasDownpayment: skipDownpaymentThreshold ? false : values.needsDownpayment, downpaymentFixed: skipDownpaymentThreshold ? false : downpaymentFixed });
  };

  const paddedInstallments = installments < 10 ? `0${installments}` : String(installments);

  const openEditor = (type: 'downpayment' | 'monthly' | 'installments') => {
    const titles: Record<string, string> = { downpayment: sim.downPayment, monthly: sim.monthlyPayment, installments: sim.installments };
    setSheetState({ isOpen: true, type, title: titles[type] });
  };

  const handleEditorConfirm = (v: number) => {
    switch (sheetState.type) {
      case 'monthly': handleMonthlyChange(v); break;
      case 'downpayment': handleDownpaymentChange(v); break;
      case 'installments': handleInstallmentsChange(Math.max(rules.minInstallments, Math.min(rules.maxInstallments, v))); break;
    }
  };

  const editorMin = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMinPercent : sheetState.type === 'installments' ? rules.minInstallments : undefined;
  const editorMax = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMaxPercent : sheetState.type === 'installments' ? rules.maxInstallments : undefined;

  return (
    <Box surface="screen" style={es.screen}>
      <StatusBar style="dark" />

      <TopBar
        title={sim.title}
        variant="default"
        showStatusBar={false}
        leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
        onPressLeading={onBack}
        show1stAction={true}
        action1Icon={<HelpIcon size={24} color={theme.color.content.primary} />}
        onPress1stAction={() => setShowCalcSummary(true)}
        show2ndAction={false}
      />

      <ScrollView style={es.scroll} contentContainerStyle={es.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Input zone */}
        {values.needsDownpayment ? (
          <View style={es.inputsHorizontal}>
            <Pressable onPress={() => openEditor('downpayment')} style={es.inputField}>
              <CurrencyValueRN symbol={curr.symbol} value={fmtNum(values.downpayment)} fontSize={24} color="#1f002f" />
              <View style={es.dividerLine} />
              <NText variant="paragraphSmallDefault" tone="secondary">{sim.downPayment}</NText>
            </Pressable>
            <View style={es.verticalDivider} />
            <Pressable onPress={() => openEditor('monthly')} style={es.inputField}>
              <CurrencyValueRN symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} fontSize={24} color="#1f002f" />
              <View style={es.dividerLine} />
              <NText variant="paragraphSmallDefault" tone="secondary">{sim.monthlyPayment}</NText>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => openEditor('monthly')} style={es.inputLarge}>
            <CurrencyValueRN symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} fontSize={44} color="#1f002f" />
            <View style={[es.dividerLine, { width: Math.min(220, SW * 0.6) }]} />
            <NText variant="paragraphSmallDefault" tone="secondary">{sim.monthlyPayment}</NText>
          </Pressable>
        )}

        <View style={{ height: 8 }} />

        {/* Installments */}
        <View style={es.installmentsBlock}>
          <Pressable onPress={() => openEditor('installments')}>
            <RNAnimatedNumber value={paddedInstallments} fontSize={44} color="#1f0230" letterSpacing={-1.32} />
          </Pressable>
          <View style={[es.dividerLine, { width: Math.min(160, SW * 0.45) }]} />
          <NText variant="paragraphSmallDefault" tone="secondary">{sim.installments}</NText>

          {displayedSavings > 0.01 && (
            <View style={{ paddingHorizontal: 20, width: '100%', marginTop: 8 }}>
              <SavingsBanner savings={displayedSavings} symbol={curr.symbol} locale={locale} />
            </View>
          )}
        </View>

        {/* Slider */}
        <InstallmentsSlider
          value={installments}
          min={rules.minInstallments}
          max={rules.maxInstallments}
          onChange={handleInstallmentsChange}
          labelLeft={sim.sliderMoreDiscount}
          labelRight={sim.sliderMoreTime}
          accentColor={theme.color.main}
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      <CheckoutBar
        total={fmtNum(values.total)}
        originalDebt={fmtNum(debtData.originalBalance)}
        symbol={curr.symbol}
        ctaLabel={sim.continue}
        onContinue={handleContinue}
      />

      <CalcSummarySheet visible={showCalcSummary} onClose={() => setShowCalcSummary(false)} values={values} rules={rules} locale={locale} installments={installments} />
      <DownpaymentAlertSheet visible={showDownpaymentAlert} onClose={() => setShowDownpaymentAlert(false)} locale={locale} />
      <BottomSheetEditorRN
        visible={sheetState.isOpen}
        onClose={() => setSheetState((s) => ({ ...s, isOpen: false }))}
        type={sheetState.type}
        title={sheetState.title}
        currentValue={sheetState.type === 'downpayment' ? downpayment : sheetState.type === 'monthly' ? values.monthlyPayment : installments}
        minValue={editorMin}
        maxValue={editorMax}
        locale={locale}
        onValueChange={handleEditorConfirm}
        downpaymentFixed={downpaymentFixed}
        onToggleFixed={sheetState.type === 'downpayment' ? () => setDownpaymentFixed((f) => !f) : undefined}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Styles                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

const es = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  inputsHorizontal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: 148 },
  inputField: { flex: 1, padding: 20, alignItems: 'center', gap: 8 },
  verticalDivider: { width: 1, height: 90, backgroundColor: 'rgba(31,2,48,0.08)' },
  inputLarge: { width: '100%', height: 148, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  dividerLine: { height: 4, width: 140, backgroundColor: '#efefef', borderRadius: 2 },
  installmentsBlock: { width: '100%', paddingVertical: 20, alignItems: 'center', gap: 8 },
  checkoutBar: { borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  checkoutContent: { flexDirection: 'row', alignItems: 'center', gap: 24, padding: 20 },
  ctaBtn: { height: 48, paddingHorizontal: 24, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  sheetHandle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.12)', marginTop: 10, marginBottom: 2 },
  sheetCta: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
