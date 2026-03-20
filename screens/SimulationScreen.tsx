import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
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
  NText,
  Box,
  ArrowBackIcon,
  InfoIcon,
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
import { useThemeMode } from '../config/ThemeModeContext';

const { width: SW } = Dimensions.get('window');
type Theme = ReturnType<typeof useNuDSTheme>;

/* ═══════════════════════════════════════════════════════════════════ */
/*  RouletteNumber — clean opacity crossfade, no position jitter     */
/* ═══════════════════════════════════════════════════════════════════ */

function RouletteNumber({ value, fontSize, color }: { value: string; fontSize: number; color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const animating = useRef(false);
  const pending = useRef<string | null>(null);
  const lineH = Math.ceil(fontSize * 1.2);

  const runTransition = useCallback((next: string) => {
    animating.current = true;
    Animated.timing(opacity, { toValue: 0, duration: 130, useNativeDriver: true }).start(() => {
      setDisplay(next);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start(() => {
        animating.current = false;
        if (pending.current && pending.current !== next) {
          const p = pending.current;
          pending.current = null;
          runTransition(p);
        }
      });
    });
  }, [opacity]);

  useEffect(() => {
    if (value === prevRef.current) return;
    prevRef.current = value;
    if (animating.current) {
      pending.current = value;
    } else {
      runTransition(value);
    }
  }, [value, runTransition]);

  return (
    <Animated.View style={{ opacity, minHeight: lineH, justifyContent: 'center' }}>
      <Text style={{ fontSize, fontWeight: '500', color, textAlign: 'center', fontVariantNumeric: 'tabular-nums' as any, lineHeight: lineH }}>
        {display}
      </Text>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CurrencyValue — fixed symbol + animated number                   */
/* ═══════════════════════════════════════════════════════════════════ */

function CurrencyRoulette({ symbol, value, fontSize, color }: { symbol: string; value: string; fontSize: number; color: string }) {
  const lineH = Math.ceil(fontSize * 1.2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize, fontWeight: '500', color, lineHeight: lineH, fontVariantNumeric: 'tabular-nums' as any }}>
        {symbol}{' '}
      </Text>
      <RouletteNumber value={value} fontSize={fontSize} color={color} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  InstallmentsSlider                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function InstallmentsSlider({ value, min, max, onChange, labelLeft, labelRight, theme }: {
  value: number; min: number; max: number; onChange: (v: number) => void; labelLeft: string; labelRight: string; theme: Theme;
}) {
  const trackW = SW - 40;
  const thumbW = 32;
  const containerH = 40;
  const trackTop = (containerH - 4) / 2;
  const thumbTop = (containerH - thumbW) / 2;
  const pct = (value - min) / (max - min);
  const thumbX = useRef(new Animated.Value(pct * (trackW - thumbW))).current;
  const progressW = useRef(new Animated.Value(pct * (trackW - thumbW) + thumbW / 2)).current;
  const lastVal = useRef(value);

  useEffect(() => {
    const p = (value - min) / (max - min);
    const pos = p * (trackW - thumbW);
    Animated.parallel([
      Animated.spring(thumbX, { toValue: pos, stiffness: 600, damping: 35, mass: 0.5, useNativeDriver: false }),
      Animated.spring(progressW, { toValue: pos + thumbW / 2, stiffness: 600, damping: 35, mass: 0.5, useNativeDriver: false }),
    ]).start();
  }, [value, min, max, trackW, thumbW, thumbX, progressW]);

  const tick = useCallback((n: number) => {
    if (n !== lastVal.current) { lastVal.current = n; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    onChange(n);
  }, [onChange]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { const x = Math.max(0, Math.min(e.nativeEvent.pageX - 20, trackW)); const p = x / trackW; thumbX.setValue(p * (trackW - thumbW)); progressW.setValue(p * (trackW - thumbW) + thumbW / 2); tick(Math.round(min + p * (max - min))); },
    onPanResponderMove: (e) => { const x = Math.max(0, Math.min(e.nativeEvent.pageX - 20, trackW)); const p = x / trackW; thumbX.setValue(p * (trackW - thumbW)); progressW.setValue(p * (trackW - thumbW) + thumbW / 2); tick(Math.round(min + p * (max - min))); },
    onPanResponderRelease: () => {},
  })).current;

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <View style={{ height: containerH }} {...pan.panHandlers}>
        <View style={{ position: 'absolute', left: 0, right: 0, height: 4, top: trackTop, backgroundColor: theme.color.border.primary, borderRadius: 8 }} />
        <Animated.View style={{ position: 'absolute', left: 0, height: 4, top: trackTop, backgroundColor: theme.color.main, borderRadius: 8, width: progressW }} />
        <Animated.View style={{
          position: 'absolute', width: thumbW, height: thumbW, borderRadius: thumbW / 2,
          backgroundColor: theme.color.main, top: thumbTop, transform: [{ translateX: thumbX }],
          ...Platform.select({ ios: { shadowColor: theme.color.main, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 }, android: { elevation: 6 } }),
        }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 }}>
        <NText variant="labelSmallStrong" tone="secondary">{labelLeft}</NText>
        <NText variant="labelSmallStrong" tone="secondary">{labelRight}</NText>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SavingsBanner                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function SavingsBanner({ savings, symbol, locale, theme }: { savings: number; symbol: string; locale: Locale; theme: Theme }) {
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
/*  CheckoutBar                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function CheckoutBar({ total, originalDebt, symbol, ctaLabel, onContinue, theme }: {
  total: string; originalDebt: string; symbol: string; ctaLabel: string; onContinue: () => void; theme: Theme;
}) {
  return (
    <View style={[es.checkoutBar, { borderTopColor: theme.color.border.secondary, backgroundColor: theme.color.background.primary }]}>
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
/*  RNBottomSheet                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function RNBottomSheet({ visible, onClose, theme, children }: { visible: boolean; onClose: () => void; theme: Theme; children: React.ReactNode }) {
  const slideY = useRef(new Animated.Value(600)).current;
  const bdOpac = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideY.setValue(600);
      bdOpac.setValue(0);
      Animated.parallel([
        Animated.timing(bdOpac, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, stiffness: 380, damping: 34, mass: 0.75, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideY, bdOpac]);

  const close = () => {
    Animated.parallel([
      Animated.timing(bdOpac, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 600, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: bdOpac }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={{ backgroundColor: theme.color.background.primary, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', transform: [{ translateY: slideY }] }}>
          <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: theme.color.border.primary, marginTop: 10, marginBottom: 2 }} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CalcSummarySheet                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function CalcSummarySheet({ visible, onClose, values, rules, locale, installments, theme }: {
  visible: boolean; onClose: () => void; values: CalculateResult; rules: FinancialRules; locale: Locale; installments: number; theme: Theme;
}) {
  const t = useTranslation(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const fmt = (v: number) => formatCurrency(v, curr);
  const sim = t.simulation;

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
    <RNBottomSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <NText variant="subtitleMediumStrong">{sim.subtitle}</NText>
        <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.color.background.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <NText variant="labelSmallStrong">✕</NText>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 300, paddingHorizontal: 20 }}>
        {rows.map((row, i) => (
          <View key={i}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 }}>
              <NText variant="paragraphSmallDefault" tone="secondary">{row.label}</NText>
              <NText variant="labelSmallStrong" color={row.negative ? '#c0392b' : row.savings ? '#2eab57' : undefined}>{row.value}</NText>
            </View>
            {i < rows.length - 1 && <View style={{ height: 1, backgroundColor: theme.color.border.secondary }} />}
          </View>
        ))}
      </ScrollView>
      <View style={{ padding: 20 }}>
        <Pressable onPress={onClose} style={({ pressed }) => ({ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.main, opacity: pressed ? 0.9 : 1 } as any)}>
          <NText variant="labelSmallStrong" color="#fff">{sim.close}</NText>
        </Pressable>
      </View>
    </RNBottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DownpaymentAlertSheet                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function DownpaymentAlertSheet({ visible, onClose, locale, theme }: { visible: boolean; onClose: () => void; locale: Locale; theme: Theme }) {
  const sim = useTranslation(locale).simulation;
  const parts = sim.downPaymentRequiredMessage.split(/<\/?strong>/);

  return (
    <RNBottomSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ padding: 24, alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${theme.color.main}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <InfoIcon size={32} color={theme.color.main} />
        </View>
        <NText variant="titleSmall" style={{ textAlign: 'center', marginBottom: 12 } as any}>{sim.downPaymentRequired}</NText>
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ textAlign: 'center', marginBottom: 24, lineHeight: 22 } as any}>
          {parts.map((p, i) => i % 2 === 1 ? <NText key={i} variant="labelSmallStrong">{p}</NText> : p)}
        </NText>
        <Pressable onPress={onClose} style={({ pressed }) => ({ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.main, opacity: pressed ? 0.9 : 1, width: '100%' } as any)}>
          <NText variant="labelSmallStrong" color="#fff">{sim.gotIt}</NText>
        </Pressable>
      </View>
    </RNBottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  BottomSheetEditor — ATM keypad                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function BottomSheetEditorRN({ visible, onClose, type, title, currentValue, minValue, maxValue, locale, onValueChange, downpaymentFixed, onToggleFixed, theme }: {
  visible: boolean; onClose: () => void; type: 'downpayment' | 'monthly' | 'installments'; title: string; currentValue: number;
  minValue?: number; maxValue?: number; locale: Locale; onValueChange: (v: number) => void;
  downpaymentFixed?: boolean; onToggleFixed?: () => void; theme: Theme;
}) {
  const curr = getUseCaseForLocale(locale).currency;
  const sim = useTranslation(locale).simulation;
  const isCurrency = type !== 'installments';
  const [inputValue, setInputValue] = useState(() => isCurrency ? String(Math.round(currentValue * 100)) : String(currentValue));
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (visible) { setInputValue(isCurrency ? String(Math.round(currentValue * 100)) : String(currentValue)); setHasStarted(false); }
  }, [visible, currentValue, isCurrency]);

  const numericValue = isCurrency ? parseInt(inputValue || '0', 10) / 100 : parseInt(inputValue || '0', 10);
  const isBelowMin = minValue !== undefined && numericValue < minValue && numericValue > 0;
  const isAboveMax = maxValue !== undefined && numericValue > maxValue;
  const isOutOfRange = isBelowMin || isAboveMax;
  const displayValue = isCurrency ? formatCurrency(numericValue, curr, { showSymbol: false }) : inputValue || '0';

  const handleKey = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'back') { setInputValue((prev) => prev.length > 1 ? prev.slice(0, -1) : '0'); setHasStarted(true); return; }
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

  const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'back']];

  return (
    <RNBottomSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ padding: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <NText variant="subtitleSmallStrong">{title}</NText>
        <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.color.background.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <NText variant="labelSmallStrong">✕</NText>
        </Pressable>
      </View>
      <View style={{ alignItems: 'center', padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {isCurrency && <NText variant="titleMedium" color={isOutOfRange ? '#d4183d' : undefined}>{curr.symbol}</NText>}
          <NText variant="titleMedium" color={isOutOfRange ? '#d4183d' : undefined}>{displayValue}</NText>
          {!isCurrency && <NText variant="paragraphSmallDefault" tone="secondary">x</NText>}
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: theme.color.border.secondary, marginHorizontal: 20 }} />
      <View style={{ padding: 16, paddingBottom: 8 }}>
        {keys.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', marginBottom: 4 }}>
            {row.map((k, ci) => (
              <View key={ci} style={{ flex: 1, marginHorizontal: 4 }}>
                {k === '' ? <View style={{ height: 52 }} /> : (
                  <Pressable onPress={() => handleKey(k)} style={({ pressed }) => ({
                    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: pressed ? `${theme.color.main}20` : k === 'back' ? `${theme.color.main}10` : theme.color.background.secondary,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  })}>
                    <NText variant="subtitleSmallStrong" color={k === 'back' ? theme.color.main : undefined}>{k === 'back' ? '⌫' : k}</NText>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={{ padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
        <Pressable onPress={handleConfirm} disabled={isOutOfRange} style={({ pressed }) => ({
          height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isOutOfRange ? theme.color.border.primary : theme.color.main,
          opacity: pressed && !isOutOfRange ? 0.9 : 1,
        } as any)}>
          <NText variant="labelSmallStrong" color={isOutOfRange ? theme.color.content.secondary : '#fff'}>{sim.confirm}</NText>
        </Pressable>
      </View>
    </RNBottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main SimulationScreen                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SimulationScreen({
  locale = 'pt-BR', onBack, onContinue, initialInstallments = 10,
  initialDownpayment, initialDownpaymentFixed, skipDownpaymentThreshold = false,
}: {
  locale?: Locale; onBack?: () => void; onContinue?: (data: any) => void;
  initialInstallments?: number; initialDownpayment?: number; initialDownpaymentFixed?: boolean; skipDownpaymentThreshold?: boolean;
}) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const t = useTranslation(locale);
  const sim = t.simulation;
  const rules = getRules(locale);
  const debtData = getSimDebtData(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const fmtNum = useCallback((v: number) => formatCurrency(v, curr, { showSymbol: false }), [curr]);

  const [installments, setInstallments] = useState(initialInstallments);
  const [downpayment, setDownpayment] = useState(initialDownpayment ?? 0);
  const [downpaymentFixed, setDownpaymentFixed] = useState(initialDownpaymentFixed ?? false);
  const [showDownpaymentAlert, setShowDownpaymentAlert] = useState(false);
  const hasShownAlertRef = useRef(false);
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

  const installmentsRef = useRef(installments);
  installmentsRef.current = installments;
  const dpFixedRef = useRef(downpaymentFixed);
  dpFixedRef.current = downpaymentFixed;

  const handleInstallmentsChange = useCallback((newN: number) => {
    const prevNeeds = installmentsRef.current > rules.downPaymentThreshold;
    const nowNeeds = newN > rules.downPaymentThreshold;
    setInstallments(newN);
    if (skipDownpaymentThreshold) return;
    if (!prevNeeds && nowNeeds) {
      if (!hasShownAlertRef.current) { setShowDownpaymentAlert(true); hasShownAlertRef.current = true; }
      if (!dpFixedRef.current) setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
    }
    if (prevNeeds && !nowNeeds && !dpFixedRef.current) setDownpayment(0);
  }, [rules, skipDownpaymentThreshold, debtData]);

  const handleMonthlyChange = useCallback((v: number) => {
    handleInstallmentsChange(findBestInstallmentsForMonthly(v, downpayment, debtData.originalBalance, downpaymentFixed, locale));
  }, [downpayment, debtData, downpaymentFixed, locale, handleInstallmentsChange]);

  const handleDownpaymentChange = useCallback((v: number) => {
    const minDp = debtData.originalBalance * rules.downPaymentMinPercent;
    const maxDp = debtData.originalBalance * rules.downPaymentMaxPercent;
    setDownpayment(Math.max(minDp, Math.min(maxDp, v)));
  }, [debtData, rules]);

  const handleContinue = () => {
    onContinue?.({ installments, monthlyPayment: values.monthlyPayment, savings: values.savings, total: values.total });
  };

  const padded = installments < 10 ? `0${installments}` : String(installments);
  const openEditor = (type: 'downpayment' | 'monthly' | 'installments') => {
    setSheetState({ isOpen: true, type, title: { downpayment: sim.downPayment, monthly: sim.monthlyPayment, installments: sim.installments }[type] });
  };
  const handleEditorConfirm = (v: number) => {
    if (sheetState.type === 'monthly') handleMonthlyChange(v);
    else if (sheetState.type === 'downpayment') handleDownpaymentChange(v);
    else handleInstallmentsChange(Math.max(rules.minInstallments, Math.min(rules.maxInstallments, v)));
  };

  const editorMin = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMinPercent : sheetState.type === 'installments' ? rules.minInstallments : undefined;
  const editorMax = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMaxPercent : sheetState.type === 'installments' ? rules.maxInstallments : undefined;
  const textColor = theme.color.content.primary;

  return (
    <Box surface="screen" style={es.screen}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* Navigation bar */}
      <View style={es.navbar}>
        <Pressable onPress={onBack} style={es.navBtn} hitSlop={8}>
          <ArrowBackIcon size={24} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setShowCalcSummary(true)} style={es.navBtn} hitSlop={8}>
          <InfoIcon size={24} color={textColor} />
        </Pressable>
      </View>

      <ScrollView style={es.scroll} contentContainerStyle={es.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <NText variant="titleMedium" style={{ textAlign: 'center', paddingHorizontal: 24, paddingBottom: 24 } as any}>
          {sim.title}
        </NText>

        {/* Input zone */}
        {values.needsDownpayment ? (
          <View style={es.inputsHorizontal}>
            <Pressable onPress={() => openEditor('downpayment')} style={es.inputField}>
              <CurrencyRoulette symbol={curr.symbol} value={fmtNum(values.downpayment)} fontSize={24} color={textColor} />
              <View style={[es.dividerLine, { backgroundColor: theme.color.border.secondary }]} />
              <NText variant="paragraphSmallDefault" tone="secondary">{sim.downPayment}</NText>
            </Pressable>
            <View style={{ width: 1, height: 90, backgroundColor: theme.color.border.secondary }} />
            <Pressable onPress={() => openEditor('monthly')} style={es.inputField}>
              <CurrencyRoulette symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} fontSize={24} color={textColor} />
              <View style={[es.dividerLine, { backgroundColor: theme.color.border.secondary }]} />
              <NText variant="paragraphSmallDefault" tone="secondary">{sim.monthlyPayment}</NText>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => openEditor('monthly')} style={es.inputLarge}>
            <CurrencyRoulette symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} fontSize={44} color={textColor} />
            <View style={[es.dividerLine, { width: Math.min(220, SW * 0.6), backgroundColor: theme.color.border.secondary }]} />
            <NText variant="paragraphSmallDefault" tone="secondary">{sim.monthlyPayment}</NText>
          </Pressable>
        )}

        <View style={{ height: 8 }} />

        {/* Installments */}
        <View style={es.installmentsBlock}>
          <Pressable onPress={() => openEditor('installments')}>
            <RouletteNumber value={padded} fontSize={44} color={textColor} />
          </Pressable>
          <View style={[es.dividerLine, { width: Math.min(160, SW * 0.45), backgroundColor: theme.color.border.secondary }]} />
          <NText variant="paragraphSmallDefault" tone="secondary">{sim.installments}</NText>
          {displayedSavings > 0.01 && (
            <View style={{ paddingHorizontal: 20, width: '100%', marginTop: 8 }}>
              <SavingsBanner savings={displayedSavings} symbol={curr.symbol} locale={locale} theme={theme} />
            </View>
          )}
        </View>

        <InstallmentsSlider value={installments} min={rules.minInstallments} max={rules.maxInstallments}
          onChange={handleInstallmentsChange} labelLeft={sim.sliderMoreDiscount} labelRight={sim.sliderMoreTime} theme={theme} />
        <View style={{ height: 80 }} />
      </ScrollView>

      <CheckoutBar total={fmtNum(values.total)} originalDebt={fmtNum(debtData.originalBalance)} symbol={curr.symbol} ctaLabel={sim.continue} onContinue={handleContinue} theme={theme} />

      <CalcSummarySheet visible={showCalcSummary} onClose={() => setShowCalcSummary(false)} values={values} rules={rules} locale={locale} installments={installments} theme={theme} />
      <DownpaymentAlertSheet visible={showDownpaymentAlert} onClose={() => setShowDownpaymentAlert(false)} locale={locale} theme={theme} />
      <BottomSheetEditorRN visible={sheetState.isOpen} onClose={() => setSheetState((s) => ({ ...s, isOpen: false }))} type={sheetState.type} title={sheetState.title}
        currentValue={sheetState.type === 'downpayment' ? downpayment : sheetState.type === 'monthly' ? values.monthlyPayment : installments}
        minValue={editorMin} maxValue={editorMax} locale={locale} onValueChange={handleEditorConfirm}
        downpaymentFixed={downpaymentFixed} onToggleFixed={sheetState.type === 'downpayment' ? () => setDownpaymentFixed((f) => !f) : undefined} theme={theme} />
    </Box>
  );
}

const es = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  navbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  inputsHorizontal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 130 },
  inputField: { flex: 1, padding: 20, alignItems: 'center', gap: 8 },
  inputLarge: { width: '100%', paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  dividerLine: { height: 4, width: 140, borderRadius: 2 },
  installmentsBlock: { width: '100%', paddingVertical: 20, alignItems: 'center', gap: 8 },
  checkoutBar: { borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  checkoutContent: { flexDirection: 'row', alignItems: 'center', gap: 24, padding: 20 },
  ctaBtn: { height: 48, paddingHorizontal: 24, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
});
