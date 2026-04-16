import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  NText,
  Box,
  BottomSheet,
  ArrowBackIcon,
  InfoIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import {
  calculate,
  findBestInstallmentsForMonthly,
  getFirstPaymentDate,
  DEFAULT_INITIAL_INSTALLMENTS,
  SAVINGS_EPSILON,
  type CalculateResult,
  type FinancialRules,
} from '../config/financialCalculator';
import { formatCurrency, interpolate } from '../config/formatters';
import { getUseCaseForLocale } from '../config/useCases';
import { useThemeMode } from '../config/ThemeModeContext';
import { useEmulatorConfig } from '../config/EmulatorConfigContext';

const { width: SW } = Dimensions.get('window');
type Theme = ReturnType<typeof useNuDSTheme>;

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  RouletteNumber — slot machine with dual layers + blur trail      */
/* ═══════════════════════════════════════════════════════════════════ */

function RouletteNumber({ value, fontSize, color }: { value: string; fontSize: number; color: string }) {
  const progress = useRef(new Animated.Value(1)).current;
  const [slotA, setSlotA] = useState(value);
  const [slotB, setSlotB] = useState(value);
  const activeSlot = useRef<'A' | 'B'>('A');
  const prevRef = useRef(value);
  const dirRef = useRef(1);
  const lineH = Math.ceil(fontSize * 1.2);

  if (value !== prevRef.current) {
    const pn = parseFloat(prevRef.current.replace(/[^0-9.-]/g, '')) || 0;
    const cn = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    dirRef.current = cn >= pn ? 1 : -1;
    prevRef.current = value;

    progress.stopAnimation();

    if (activeSlot.current === 'A') {
      setSlotB(value);
      activeSlot.current = 'B';
    } else {
      setSlotA(value);
      activeSlot.current = 'A';
    }

    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }

  const d = dirRef.current;
  const isA = activeSlot.current === 'A';

  const enterY = progress.interpolate({ inputRange: [0, 1], outputRange: [d * lineH, 0] });
  const exitY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -d * lineH] });
  const enterOp = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.2, 0.8, 1] });
  const exitOp = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.25, 0] });

  const smearY = progress.interpolate({ inputRange: [0, 1], outputRange: [d * lineH * 0.5, -d * lineH * 0.5] });
  const smearOp = progress.interpolate({ inputRange: [0, 0.04, 0.55, 1], outputRange: [0, 0.35, 0.25, 0] });
  const smearScale = progress.interpolate({ inputRange: [0, 0.25, 0.65, 1], outputRange: [2.0, 2.8, 2.4, 1.5] });

  const ts: any = { fontSize, fontWeight: '500', color, textAlign: 'center', lineHeight: lineH, fontVariant: ['tabular-nums'] };
  const renderSlot = (text: string) => <NText variant="titleMedium" style={ts}>{text}</NText>;

  return (
    <View style={{ height: lineH, overflow: 'hidden', alignSelf: 'stretch' }}>
      <NText variant="titleMedium" style={[ts, { opacity: 0 }]}>{isA ? slotA : slotB}</NText>

      {/* Motion blur smear */}
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: [{ translateY: smearY }, { scaleY: smearScale }], opacity: smearOp }}>
        {renderSlot(isA ? slotA : slotB)}
      </Animated.View>

      {/* Exiting slot */}
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: [{ translateY: isA ? exitY : enterY }], opacity: isA ? exitOp : enterOp }}>
        {renderSlot(slotB)}
      </Animated.View>

      {/* Entering slot (on top) */}
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: [{ translateY: isA ? enterY : exitY }], opacity: isA ? enterOp : exitOp }}>
        {renderSlot(slotA)}
      </Animated.View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CurrencyValue — fixed symbol + animated number                   */
/* ═══════════════════════════════════════════════════════════════════ */

function CurrencyRoulette({ symbol, value, fontSize, color }: { symbol: string; value: string; fontSize: number; color: string }) {
  const lineH = Math.ceil(fontSize * 1.2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
      <NText variant="titleMedium" style={{ fontSize, fontWeight: '500', color, lineHeight: lineH, fontVariant: ['tabular-nums'] } as any}>
        {symbol}{' '}
      </NText>
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
  const thumbScale = useRef(new Animated.Value(1)).current;
  const lastVal = useRef(value);

  useEffect(() => {
    const p = (value - min) / (max - min);
    const pos = p * (trackW - thumbW);
    Animated.parallel([
      Animated.spring(thumbX, { toValue: pos, stiffness: 600, damping: 35, mass: 0.5, useNativeDriver: false }),
      Animated.spring(progressW, { toValue: pos + thumbW / 2, stiffness: 600, damping: 35, mass: 0.5, useNativeDriver: false }),
    ]).start();
  }, [value, min, max, trackW, thumbW, thumbX, progressW]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const minRef = useRef(min);
  minRef.current = min;
  const maxRef = useRef(max);
  maxRef.current = max;

  const tick = useCallback((n: number) => {
    if (n !== lastVal.current) { lastVal.current = n; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    onChangeRef.current(n);
  }, []);

  const calcFromX = useCallback((pageX: number) => {
    const x = Math.max(0, Math.min(pageX - 20, trackW));
    const p = x / trackW;
    thumbX.setValue(p * (trackW - thumbW));
    progressW.setValue(p * (trackW - thumbW) + thumbW / 2);
    tick(Math.round(minRef.current + p * (maxRef.current - minRef.current)));
  }, [trackW, thumbW, thumbX, progressW, tick]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      Animated.spring(thumbScale, { toValue: 1.4, stiffness: 300, damping: 15, useNativeDriver: false }).start();
      calcFromX(e.nativeEvent.pageX);
    },
    onPanResponderMove: (e) => calcFromX(e.nativeEvent.pageX),
    onPanResponderRelease: () => {
      Animated.spring(thumbScale, { toValue: 1, stiffness: 300, damping: 20, useNativeDriver: false }).start();
    },
  })).current;

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <View style={{ height: containerH }} {...pan.panHandlers}>
        <View style={{ position: 'absolute', left: 0, right: 0, height: 4, top: trackTop, backgroundColor: theme.color.border.primary, borderRadius: 8 }} />
        <Animated.View style={{ position: 'absolute', left: 0, height: 4, top: trackTop, backgroundColor: theme.color.main, borderRadius: 8, width: progressW }} />
        <Animated.View style={{
          position: 'absolute', width: thumbW, height: thumbW, borderRadius: thumbW / 2,
          backgroundColor: theme.color.main, top: thumbTop,
          transform: [{ translateX: thumbX }, { scale: thumbScale }],
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
  const pulse = useRef(new Animated.Value(1)).current;
  const prevSavings = useRef(savings);

  useEffect(() => {
    if (savings === prevSavings.current) return;
    prevSavings.current = savings;
    pulse.stopAnimation();
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.05, duration: 160, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.97, duration: 120, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [savings, pulse]);

  return (
    <Animated.View style={{
      backgroundColor: theme.color.surface.success, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16,
      borderWidth: 1, borderColor: `${theme.color.positive}20`,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
      transform: [{ scale: pulse }],
    }}>
      <Text style={{ fontSize: 14, color: theme.color.positive }}>{t.simulation.totalSavings} </Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.color.positive }}>{symbol} </Text>
      <RouletteNumber value={formatted} fontSize={14} color={theme.color.positive} />
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
          <NText variant="labelSmallStrong" color={theme.color.content.main}>{ctaLabel}</NText>
        </Pressable>
      </View>
    </View>
  );
}

/* RNBottomSheet removed — all sheets now use NuDS <BottomSheet> directly */

/* ═══════════════════════════════════════════════════════════════════ */
/*  CalcSummarySheet                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function CalcSummarySheet({ visible, onClose, values, rules, locale, installments, totalDebt, theme }: {
  visible: boolean; onClose: () => void; values: CalculateResult; rules: FinancialRules; locale: Locale; installments: number; totalDebt: number; theme: Theme;
}) {
  const t = useTranslation(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const fmt = (v: number) => formatCurrency(v, curr);
  const sim = t.simulation;
  const sm = t.summary;

  const firstPayment = getFirstPaymentDate();
  const dayNum = firstPayment.getDate();
  const dateStr = firstPayment.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

  type Row = { label: string; value: string; highlight?: boolean; negative?: boolean; savings?: boolean };
  const rows: Row[] = [
    { label: sim.total, value: fmt(totalDebt) },
  ];
  if (values.needsDownpayment && values.downpayment > 0) {
    rows.push({ label: sim.downPayment, value: fmt(values.downpayment) });
  }
  if (values.effectiveRate > 0 && rules.formula !== 'flat_discount') {
    rows.push({ label: `${rules.taxLabel}`, value: `${values.effectiveRate.toFixed(2)}% a.m.` });
  }
  rows.push({ label: sim.installments, value: `${installments}x` });
  rows.push({ label: sim.monthlyPayment, value: fmt(values.monthlyPayment), highlight: true });
  rows.push({ label: dateStr, value: interpolate(sm.everyDay, { day: String(dayNum) }) });
  if (values.totalInterest > 0 && rules.formula !== 'flat_discount') {
    rows.push({ label: sm.totalInterest, value: fmt(values.totalInterest), negative: true });
  }
  if (values.savings > SAVINGS_EPSILON) {
    rows.push({ label: sm.totalSavings, value: `- ${fmt(values.savings)}`, savings: true });
  }
  rows.push({ label: sim.total, value: fmt(values.total), highlight: true });

  return (
    <BottomSheet visible={visible} onClose={onClose} title={sim.subtitle} showHandle show1stAction={false}>
      <ScrollView style={{ maxHeight: 300, paddingHorizontal: 20 }}>
        {rows.map((row, i) => (
          <View key={i}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 }}>
              <NText variant="paragraphSmallDefault" tone="secondary">{row.label}</NText>
              <NText variant="labelSmallStrong" color={row.negative ? theme.color.negative : row.savings ? theme.color.positive : undefined}>{row.value}</NText>
            </View>
            {i < rows.length - 1 && <View style={{ height: 1, backgroundColor: theme.color.border.secondary }} />}
          </View>
        ))}
      </ScrollView>
      <View style={{ padding: 20 }}>
        <Pressable onPress={onClose} style={({ pressed }) => ({ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.main, opacity: pressed ? 0.9 : 1 } as any)}>
          <NText variant="labelSmallStrong" color={theme.color.content.main}>{sim.close}</NText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DownpaymentAlertSheet                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function DownpaymentAlertSheet({ visible, onClose, locale, theme }: { visible: boolean; onClose: () => void; locale: Locale; theme: Theme }) {
  const sim = useTranslation(locale).simulation;
  const parts = sim.downPaymentRequiredMessage.split(/<\/?strong>/);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={sim.downPaymentRequired} showHandle show1stAction={false}>
      <View style={{ padding: 24, alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${theme.color.main}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <InfoIcon size={32} color={theme.color.main} />
        </View>
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ textAlign: 'center', marginBottom: 24, lineHeight: 22 } as any}>
          {parts.map((p, i) => i % 2 === 1 ? <NText key={i} variant="labelSmallStrong">{p}</NText> : p)}
        </NText>
        <Pressable onPress={onClose} style={({ pressed }) => ({ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.main, opacity: pressed ? 0.9 : 1, width: '100%' } as any)}>
          <NText variant="labelSmallStrong" color={theme.color.content.main}>{sim.gotIt}</NText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  BottomSheetEditor — ATM keypad                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function BottomSheetEditorRN({ visible, onClose, type, title, currentValue, minValue, maxValue, locale, onValueChange, theme }: {
  visible: boolean; onClose: () => void; type: 'downpayment' | 'monthly' | 'installments'; title: string; currentValue: number;
  minValue?: number; maxValue?: number; locale: Locale; onValueChange: (v: number) => void;
  theme: Theme;
}) {
  const curr = getUseCaseForLocale(locale).currency;
  const sim = useTranslation(locale).simulation;
  const isCurrency = type !== 'installments';
  const visibleRef = useRef(false);
  const [inputValue, setInputValue] = useState(() => isCurrency ? String(Math.round(currentValue * 100)) : String(currentValue));
  const [hasStarted, setHasStarted] = useState(false);

  if (visible && !visibleRef.current) {
    visibleRef.current = true;
    const fresh = isCurrency ? String(Math.round(currentValue * 100)) : String(currentValue);
    if (inputValue !== fresh) setInputValue(fresh);
    if (hasStarted) setHasStarted(false);
  }
  if (!visible && visibleRef.current) {
    visibleRef.current = false;
  }

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
    <BottomSheet visible={visible} onClose={onClose} title={title} showHandle show1stAction={false} avoidKeyboard>
      <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isCurrency && <NText variant="titleLarge" color={isOutOfRange ? theme.color.negative : undefined}>{curr.symbol}</NText>}
            <NText variant="titleLarge" color={isOutOfRange ? theme.color.negative : undefined} style={{ fontVariant: ['tabular-nums'] } as any}>{displayValue}</NText>
          </View>
          {!isCurrency && <NText variant="labelSmallDefault" tone="secondary">{sim.installmentsSuffix}</NText>}
        </View>
        {type === 'downpayment' && maxValue !== undefined && (
          <NText variant="labelXSmallDefault" tone="secondary" style={{ marginTop: 6 } as any}>
            {minValue && minValue > 0
              ? `${interpolate(sim.downPaymentMinimum, { amount: formatCurrency(minValue, curr) })} · ${interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) })}`
              : interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) })}
          </NText>
        )}
        {type === 'installments' && minValue !== undefined && maxValue !== undefined && (
          <NText variant="labelXSmallDefault" tone="secondary" style={{ marginTop: 6 } as any}>
            {`${minValue}x — ${maxValue}x`}
          </NText>
        )}
        {isCurrency && (
          <NText variant="labelXSmallDefault" tone="secondary" style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 12 } as any}>
            {sim.editorApproximateHint}
          </NText>
        )}
      </View>
      <View style={{ height: 1, backgroundColor: theme.color.border.secondary, marginHorizontal: 20 }} />
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        {keys.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', marginBottom: 4 }}>
            {row.map((k, ci) => (
              <View key={ci} style={{ flex: 1, marginHorizontal: 4 }}>
                {k === '' ? <View style={{ height: 52 }} /> : (
                  <Pressable onPress={() => handleKey(k)} style={({ pressed }) => ({
                    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: pressed ? `${theme.color.main}20` : k === 'back' ? theme.color.surface.accentSubtle : theme.color.background.secondary,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  })}>
                    <NText variant="titleXSmall" color={k === 'back' ? theme.color.main : undefined}>{k === 'back' ? '⌫' : k}</NText>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
        <Pressable onPress={handleConfirm} disabled={isOutOfRange} style={({ pressed }) => ({
          height: 52, borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center',
          backgroundColor: isOutOfRange ? theme.color.border.primary : theme.color.main,
          opacity: pressed && !isOutOfRange ? 0.9 : 1,
        } as any)}>
          <NText variant="labelSmallStrong" color={isOutOfRange ? theme.color.content.secondary : theme.color.content.main}>{sim.confirm}</NText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Shimmer loading skeleton                                         */
/* ═══════════════════════════════════════════════════════════════════ */

function ShimmerBlock({ w, h, round = 8, color: borderColor }: { w: number | string; h: number; round?: number; color?: string }) {
  const op = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.25, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={{ width: w as any, height: h, borderRadius: round, backgroundColor: borderColor, opacity: op }} />;
}

function SimulationShimmer({ borderColor }: { borderColor: string }) {
  const cw = SW - 40;
  const c = borderColor;
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <ShimmerBlock w={cw * 0.75} h={36} round={12} color={c} />
        <View style={{ height: 8 }} />
        <ShimmerBlock w={cw * 0.55} h={36} round={12} color={c} />
      </View>
      <View style={{ alignItems: 'center', marginBottom: 12, height: 148, justifyContent: 'center', gap: 12 }}>
        <ShimmerBlock w={200} h={44} round={10} color={c} />
        <ShimmerBlock w={Math.min(220, SW * 0.6)} h={4} round={2} color={c} />
        <ShimmerBlock w={100} h={14} round={6} color={c} />
      </View>
      <View style={{ alignItems: 'center', marginBottom: 12, gap: 12, paddingVertical: 24 }}>
        <ShimmerBlock w={80} h={44} round={10} color={c} />
        <ShimmerBlock w={Math.min(160, SW * 0.45)} h={4} round={2} color={c} />
        <ShimmerBlock w={120} h={14} round={6} color={c} />
      </View>
      <View style={{ paddingHorizontal: 0, marginBottom: 20 }}>
        <ShimmerBlock w={cw} h={52} round={16} color={c} />
      </View>
      <View style={{ paddingHorizontal: 0, marginBottom: 20, gap: 8 }}>
        <ShimmerBlock w={cw} h={4} round={2} color={c} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ShimmerBlock w={90} h={12} round={4} color={c} />
          <ShimmerBlock w={70} h={12} round={4} color={c} />
        </View>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main SimulationScreen                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SimulationScreen({
  locale = 'pt-BR', onBack, onContinue, initialInstallments = DEFAULT_INITIAL_INSTALLMENTS,
  initialDownpayment, initialDownpaymentFixed, skipDownpaymentThreshold = false,
}: {
  locale?: Locale; onBack?: () => void; onContinue?: (data: any) => void;
  initialInstallments?: number; initialDownpayment?: number; initialDownpaymentFixed?: boolean; skipDownpaymentThreshold?: boolean;
}) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const t = useTranslation(locale);
  const sim = t.simulation;
  const { effectiveRules, debtOverrides, simulatedLatencyMs } = useEmulatorConfig();
  const rules = effectiveRules;
  const totalDebt = debtOverrides.cardBalance + debtOverrides.loanBalance;
  const debtData = { originalBalance: totalDebt, ccBalance: debtOverrides.cardBalance, loanBalance: debtOverrides.loanBalance };
  const curr = getUseCaseForLocale(locale).currency;
  const fmtNum = useCallback((v: number) => formatCurrency(v, curr, { showSymbol: false }), [curr]);

  const debtExceedsThreshold = debtData.originalBalance > rules.downPaymentDebtThreshold;

  const [installments, setInstallments] = useState(initialInstallments);
  const [downpayment, setDownpayment] = useState(() => {
    if (initialDownpayment != null) return initialDownpayment;
    return debtExceedsThreshold ? debtData.originalBalance * rules.downPaymentMinPercent : 0;
  });
  const downpaymentFixed = initialDownpaymentFixed ?? true;
  const [downpaymentUserSet, setDownpaymentUserSet] = useState(false);
  const dpZeroPulse = useRef(new Animated.Value(0)).current;
  const dpZeroPulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [showDownpaymentAlert, setShowDownpaymentAlert] = useState(false);
  const hasShownAlertRef = useRef(false);
  const [showCalcSummary, setShowCalcSummary] = useState(false);
  const [sheetState, setSheetState] = useState<{ isOpen: boolean; type: 'downpayment' | 'monthly' | 'installments'; title: string }>({ isOpen: false, type: 'monthly', title: '' });
  const initialValues = useMemo(
    () => {
      const initDp = initialDownpayment ?? (debtExceedsThreshold ? debtData.originalBalance * rules.downPaymentMinPercent : 0);
      return calculate({ installments: initialInstallments, downpayment: initDp, totalDebt: debtData.originalBalance, downpaymentFixed: initialDownpaymentFixed ?? true }, locale, effectiveRules);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [displayedSavings, setDisplayedSavings] = useState(initialValues.savings);
  const savingsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [loading, setLoading] = useState(true);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const values: CalculateResult = useMemo(() => {
    const result = calculate({ installments, downpayment, totalDebt: debtData.originalBalance, downpaymentFixed, downpaymentUserSet }, locale, effectiveRules);
    return { ...result, needsDownpayment: true };
  }, [installments, downpayment, debtData.originalBalance, downpaymentFixed, downpaymentUserSet, locale, effectiveRules]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, Math.max(400, simulatedLatencyMs));
    return () => clearTimeout(t);
  }, [contentOpacity]);

  useEffect(() => {
    if (savingsTimer.current) clearTimeout(savingsTimer.current);
    savingsTimer.current = setTimeout(() => setDisplayedSavings(values.savings), 250);
    return () => { if (savingsTimer.current) clearTimeout(savingsTimer.current); };
  }, [values.savings]);

  const installmentsRef = useRef(installments);
  installmentsRef.current = installments;

  const handleInstallmentsChange = useCallback((newN: number) => {
    const prevNeeds = installmentsRef.current > rules.downPaymentThreshold;
    const nowNeeds = newN > rules.downPaymentThreshold;

    if (prevNeeds !== nowNeeds) {
      LayoutAnimation.configureNext({
        duration: 350,
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
    }

    setInstallments(newN);
    if (skipDownpaymentThreshold) return;
    if (!prevNeeds && nowNeeds) {
      if (!hasShownAlertRef.current) {
        hasShownAlertRef.current = true;
        setTimeout(() => setShowDownpaymentAlert(true), 600);
      }
      if (!downpaymentFixed) { setDownpaymentUserSet(false); setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent); }
    }
    if (prevNeeds && !nowNeeds && !downpaymentFixed) { setDownpaymentUserSet(false); setDownpayment(0); }
  }, [rules, skipDownpaymentThreshold, debtData]);

  const handleMonthlyChange = useCallback((v: number) => {
    handleInstallmentsChange(findBestInstallmentsForMonthly(v, downpayment, debtData.originalBalance, downpaymentFixed, locale));
  }, [downpayment, debtData, downpaymentFixed, locale, handleInstallmentsChange]);

  const handleDownpaymentChange = useCallback((v: number) => {
    setDownpaymentUserSet(true);
    setDownpayment(v);
    if (v === 0) {
      dpZeroPulse.setValue(0);
      Animated.sequence([
        Animated.timing(dpZeroPulse, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(dpZeroPulse, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ]).start();
    }
  }, [dpZeroPulse]);

  const handleContinue = () => {
    onContinue?.({
      installments,
      monthlyPayment: values.monthlyPayment,
      savings: values.savings,
      total: values.total,
      downpayment: values.downpayment,
      hasDownpayment: values.needsDownpayment,
      downpaymentFixed,
      totalInterest: values.totalInterest,
      effectiveRate: values.effectiveRate,
    });
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

  const editorMin = sheetState.type === 'downpayment'
    ? (debtExceedsThreshold ? debtData.originalBalance * rules.downPaymentMinPercent : 0)
    : sheetState.type === 'installments' ? rules.minInstallments : undefined;
  const editorMax = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMaxPercent : sheetState.type === 'installments' ? rules.maxInstallments : undefined;
  const textColor = theme.color.content.primary;

  if (loading) {
    return (
      <Box surface="screen" style={es.screen}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={es.navbar}>
          <View style={es.navBtn} />
          <View style={{ flex: 1 }} />
          <View style={es.navBtn} />
        </View>
        <SimulationShimmer borderColor={theme.color.border.secondary} />
      </Box>
    );
  }

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

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
      <ScrollView style={es.scroll} contentContainerStyle={es.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={es.titleWrap}>
          <Text style={[es.titleText, { color: textColor }]}>{sim.title}</Text>
        </View>

        {/* Input zone — fixed height for alignment between states */}
        <View style={es.inputZone}>
          {values.needsDownpayment ? (
            <View style={es.inputsHorizontal}>
              <Pressable onPress={() => openEditor('downpayment')} style={es.inputField}>
                <CurrencyRoulette symbol={curr.symbol} value={fmtNum(values.downpayment)} fontSize={24} color={textColor} />
                <Animated.View style={[es.dividerLine, { backgroundColor: dpZeroPulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [theme.color.border.secondary, theme.color.main, theme.color.border.secondary],
                }) }]} />
                <Animated.View style={{ transform: [{ scale: dpZeroPulse.interpolate({
                  inputRange: [0, 0.2, 0.45, 0.7, 1],
                  outputRange: [1, 1.08, 0.96, 1.03, 1],
                }) }] }}>
                  <NText variant="paragraphSmallDefault" color={values.downpayment > 0 ? undefined : dpZeroPulse.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [theme.color.content.secondary, theme.color.main, theme.color.content.secondary],
                  }) as any}>{values.downpayment > 0 ? sim.downPayment : sim.noDownPayment}</NText>
                </Animated.View>
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
        </View>

        {/* Installments */}
        <View style={es.installmentsBlock}>
          <Pressable onPress={() => openEditor('installments')}>
            <RouletteNumber value={padded} fontSize={44} color={textColor} />
          </Pressable>
          <View style={[es.dividerLine, { width: Math.min(160, SW * 0.45), backgroundColor: theme.color.border.secondary }]} />
          <NText variant="paragraphSmallDefault" tone="secondary">{sim.installments}</NText>
        </View>

        {/* Savings banner */}
        {displayedSavings > SAVINGS_EPSILON && (
          <View style={es.savingsWrap}>
            <SavingsBanner savings={displayedSavings} symbol={curr.symbol} locale={locale} theme={theme} />
          </View>
        )}

        {/* Slider */}
        <View style={{ flex: 1, justifyContent: 'center', minHeight: 80 }}>
          <InstallmentsSlider value={installments} min={rules.minInstallments} max={rules.maxInstallments}
            onChange={handleInstallmentsChange} labelLeft={sim.sliderMoreDiscount} labelRight={sim.sliderMoreTime} theme={theme} />
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
      </Animated.View>

      <CheckoutBar total={fmtNum(values.total)} originalDebt={fmtNum(debtData.originalBalance)} symbol={curr.symbol} ctaLabel={sim.continue} onContinue={handleContinue} theme={theme} />

      <CalcSummarySheet visible={showCalcSummary} onClose={() => setShowCalcSummary(false)} values={values} rules={rules} locale={locale} installments={installments} totalDebt={debtData.originalBalance} theme={theme} />
      <DownpaymentAlertSheet visible={showDownpaymentAlert} onClose={() => setShowDownpaymentAlert(false)} locale={locale} theme={theme} />
      <BottomSheetEditorRN visible={sheetState.isOpen} onClose={() => setSheetState((s) => ({ ...s, isOpen: false }))} type={sheetState.type} title={sheetState.title}
        currentValue={sheetState.type === 'downpayment' ? values.downpayment : sheetState.type === 'monthly' ? values.monthlyPayment : installments}
        minValue={editorMin} maxValue={editorMax} locale={locale} onValueChange={handleEditorConfirm} theme={theme} />
    </Box>
  );
}

const es = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  navbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  titleWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  titleText: { fontSize: 36, fontWeight: '500', lineHeight: 40, letterSpacing: -1.08, textAlign: 'center' },
  inputZone: { height: 148, justifyContent: 'center' },
  inputsHorizontal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  inputField: { flex: 1, paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center', gap: 10 },
  inputLarge: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  dividerLine: { height: 4, width: 140, borderRadius: 2 },
  installmentsBlock: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  savingsWrap: { paddingHorizontal: 20, paddingVertical: 16 },
  checkoutBar: { borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  checkoutContent: { flexDirection: 'row', alignItems: 'center', gap: 24, padding: 20 },
  ctaBtn: { height: 48, paddingHorizontal: 24, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
});
