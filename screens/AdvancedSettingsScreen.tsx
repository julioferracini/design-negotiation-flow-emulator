import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar, NText, Badge, Box, ArrowBackIcon, useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useThemeMode } from '../config/ThemeModeContext';
import { useEmulatorConfig, DEFAULT_DEBT_BY_LOCALE, DEFAULT_SIMULATED_LATENCY_MS } from '../config/EmulatorConfigContext';
import type { FlowOptionKey } from '../config/EmulatorConfigContext';
import { getRules, type AmortizationFormula } from '../config/financialCalculator';
import { getUseCaseForLocale } from '../config/useCases';
import { formatCurrency } from '../config/formatters';

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

const FORMULA_OPTIONS: { id: AmortizationFormula; label: string; desc: string }[] = [
  { id: 'flat_discount', label: 'Flat', desc: 'Equal payments, no interest' },
  { id: 'price', label: 'Price', desc: 'Fixed payments with compound interest (PMT)' },
  { id: 'sac', label: 'SAC', desc: 'Decreasing payments, constant amortization' },
];

const FLOW_OPTION_LABELS: Record<FlowOptionKey, string> = { pin: 'PIN confirmation' };

export default function AdvancedSettingsScreen({ onBack }: { onBack: () => void }) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const config = useEmulatorConfig();
  const locale = config.locale;
  const defaults = getRules(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const r = config.effectiveRules;
  const debtDefaults = DEFAULT_DEBT_BY_LOCALE[locale];

  const dSep = curr.decimalSeparator;
  const tSep = curr.thousandSeparator;
  const dp = curr.decimalPlaces ?? 2;

  const fmtField = (v: number) => {
    const abs = Math.abs(v);
    const fixed = dp === 0 ? String(Math.round(abs)) : abs.toFixed(dp);
    const [intPart, decPart] = fixed.split('.');
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, tSep);
    return decPart ? `${withThousands}${dSep}${decPart}` : withThousands;
  };
  const parseField = (s: string) => {
    const stripped = s.replace(new RegExp(`\\${tSep}`, 'g'), '').replace(dSep, '.');
    return Number(stripped) || 0;
  };

  const [draftCard, setDraftCard] = useState(fmtField(config.debtOverrides.cardBalance));
  const [draftLoan, setDraftLoan] = useState(fmtField(config.debtOverrides.loanBalance));
  const [draftMin, setDraftMin] = useState(String(r.minInstallments));
  const [draftMax, setDraftMax] = useState(String(r.maxInstallments));
  const [draftRate, setDraftRate] = useState((r.monthlyInterestRate * 100).toFixed(4));
  const [draftDueDays, setDraftDueDays] = useState(String(r.dueDateBusinessDays));
  const [draftOffer1, setDraftOffer1] = useState(String(Math.round(r.offer1DiscountPercent * 100)));
  const [draftOffer2, setDraftOffer2] = useState(String(Math.round(r.offer2DiscountPercent * 100)));
  const [draftOffer3, setDraftOffer3] = useState(String(Math.round(r.offer3DiscountPercent * 100)));
  const [draftO2Inst, setDraftO2Inst] = useState(String(r.offer2Installments));
  const [draftLatency, setDraftLatency] = useState(String(config.simulatedLatencyMs));
  const [draftO3Inst, setDraftO3Inst] = useState(String(r.offer3Installments));
  const hasDiscount = r.offer1DiscountPercent > 0 || r.offer2DiscountPercent > 0 || r.offer3DiscountPercent > 0;
  const [offersOn, setOffersOn] = useState(hasDiscount);

  useEffect(() => {
    setDraftCard(fmtField(config.debtOverrides.cardBalance));
    setDraftLoan(fmtField(config.debtOverrides.loanBalance));
    setDraftMin(String(r.minInstallments));
    setDraftMax(String(r.maxInstallments));
    setDraftRate((r.monthlyInterestRate * 100).toFixed(4));
    setDraftDueDays(String(r.dueDateBusinessDays));
    setDraftOffer1(String(Math.round(r.offer1DiscountPercent * 100)));
    setDraftOffer2(String(Math.round(r.offer2DiscountPercent * 100)));
    setDraftOffer3(String(Math.round(r.offer3DiscountPercent * 100)));
    setDraftO2Inst(String(r.offer2Installments));
    setDraftO3Inst(String(r.offer3Installments));
    setOffersOn(r.offer1DiscountPercent > 0 || r.offer2DiscountPercent > 0 || r.offer3DiscountPercent > 0);
  }, [r, config.debtOverrides, dSep, tSep, dp]);

  const total = parseField(draftCard) + parseField(draftLoan);
  const fmtTotal = formatCurrency(total, curr);
  const rulesIsDefault = Object.keys(config.ruleOverrides).length === 0;

  const handleSaveAll = () => {
    config.setDebtOverrides({ cardBalance: Math.max(0, parseField(draftCard)), loanBalance: Math.max(0, parseField(draftLoan)) });
    config.setRuleOverrides({
      minInstallments: Math.max(1, Number(draftMin) || defaults.minInstallments),
      maxInstallments: Math.max(2, Number(draftMax) || defaults.maxInstallments),
      monthlyInterestRate: Math.max(0, Number(draftRate) || 0) / 100,
      dueDateBusinessDays: Math.max(1, Math.min(30, Number(draftDueDays) || defaults.dueDateBusinessDays)),
      offer1DiscountPercent: offersOn ? Math.max(0, Math.min(100, Number(draftOffer1) || 0)) / 100 : 0,
      offer2DiscountPercent: offersOn ? Math.max(0, Math.min(100, Number(draftOffer2) || 0)) / 100 : 0,
      offer2Installments: Math.max(1, Number(draftO2Inst) || defaults.offer2Installments),
      offer3DiscountPercent: offersOn ? Math.max(0, Math.min(100, Number(draftOffer3) || 0)) / 100 : 0,
      offer3Installments: Math.max(1, Number(draftO3Inst) || defaults.offer3Installments),
    });
    config.setSimulatedLatencyMs(Math.max(200, Math.min(6000, Number(draftLatency) || DEFAULT_SIMULATED_LATENCY_MS)));
  };

  const handleResetAll = () => {
    config.resetDebtOverrides();
    config.resetRuleOverrides();
    config.setSimulatedLatencyMs(DEFAULT_SIMULATED_LATENCY_MS);
    setDraftLatency(String(DEFAULT_SIMULATED_LATENCY_MS));
  };

  const toggleOffers = () => {
    const next = !offersOn;
    setOffersOn(next);
    if (!next) {
      config.setRuleOverrides({ offer1DiscountPercent: 0, offer2DiscountPercent: 0, offer3DiscountPercent: 0 });
    }
  };

  const inputBox = { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: 10, borderWidth: 1, borderColor: theme.color.border.secondary, backgroundColor: theme.color.background.primary, overflow: 'hidden' as const };
  const inputField = { flex: 1, padding: 10, fontSize: 14, fontWeight: '600' as const, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: theme.color.content.primary };
  const suffix = { fontSize: 11, fontWeight: '500' as const, color: theme.color.content.secondary, paddingRight: 10 };
  const secLabel = { fontSize: 10, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: withAlpha(theme.color.content.primary, 0.4), marginBottom: 10, marginTop: 20 };
  const fieldLabel = { fontSize: 11, fontWeight: '500' as const, color: theme.color.content.secondary, marginBottom: 4 };

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background.secondary, paddingTop: Platform.OS === 'ios' ? 50 : 34 }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <TopBar
        title="Advanced Settings"
        variant="default"
        showStatusBar={false}
        leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
        onPressLeading={onBack}
        show1stAction={false}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Flow Options */}
        <Text style={secLabel}>Flow Options</Text>
        <View style={{ borderRadius: theme.radius.lg, backgroundColor: theme.color.background.primary, overflow: 'hidden', borderWidth: 1, borderColor: theme.color.border.secondary }}>
          {(Object.keys(FLOW_OPTION_LABELS) as FlowOptionKey[]).map((key) => {
            const on = config.flowOptions[key] ?? false;
            return (
              <Pressable key={key} onPress={() => config.updateFlowOption(key, !on)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? theme.color.main : 'transparent', borderColor: on ? theme.color.main : theme.color.border.primary }}>
                  {on && <Text style={{ fontSize: 10, color: theme.color.content.main }}>✓</Text>}
                </View>
                <NText variant="labelSmallDefault" style={{ flex: 1, opacity: on ? 1 : 0.5 } as any}>{FLOW_OPTION_LABELS[key]}</NText>
              </Pressable>
            );
          })}
        </View>

        {/* Financial Rules */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={secLabel}>Financial Rules</Text>
          {!rulesIsDefault && <Badge label="Modified" color="neutral" />}
        </View>

        <View style={{ borderRadius: theme.radius.lg, backgroundColor: theme.color.background.primary, padding: 16, borderWidth: 1, borderColor: theme.color.border.secondary }}>
          {/* Amortization */}
          <Text style={fieldLabel}>Amortization</Text>
          <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: theme.color.border.secondary, marginBottom: 4 }}>
            {FORMULA_OPTIONS.map((opt, i) => {
              const on = opt.id === r.formula;
              return (
                <Pressable key={opt.id} onPress={() => config.setRuleOverrides({ formula: opt.id })}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: on ? withAlpha(theme.color.main, 0.08) : 'transparent', borderRightWidth: i < FORMULA_OPTIONS.length - 1 ? 1 : 0, borderRightColor: theme.color.border.secondary }}>
                  <Text style={{ fontSize: 13, fontWeight: on ? '700' : '500', color: on ? theme.color.main : theme.color.content.secondary }}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 16 }}>
            {FORMULA_OPTIONS.find((o) => o.id === r.formula)?.desc}
          </Text>

          {/* Negotiation Values */}
          <Text style={fieldLabel}>Negotiation Values ({curr.code})</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Card</Text>
              <View style={inputBox}>
                <Text style={{ fontSize: 11, color: theme.color.content.secondary, paddingLeft: 10 }}>{curr.symbol}</Text>
                <TextInput value={draftCard} onChangeText={setDraftCard} style={inputField} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Loans</Text>
              <View style={inputBox}>
                <Text style={{ fontSize: 11, color: theme.color.content.secondary, paddingLeft: 10 }}>{curr.symbol}</Text>
                <TextInput value={draftLoan} onChangeText={setDraftLoan} style={inputField} keyboardType="decimal-pad" />
              </View>
            </View>
          </View>
          <NText variant="labelSmallStrong" style={{ marginTop: 6, marginBottom: 16 } as any}>Total: {fmtTotal}</NText>

          {/* Installments */}
          <Text style={fieldLabel}>Installments</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Min</Text>
              <View style={inputBox}><TextInput value={draftMin} onChangeText={setDraftMin} style={inputField} keyboardType="number-pad" /><Text style={suffix}>x</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Max</Text>
              <View style={inputBox}><TextInput value={draftMax} onChangeText={setDraftMax} style={inputField} keyboardType="number-pad" /><Text style={suffix}>x</Text></View>
            </View>
          </View>

          {/* Due Date */}
          <Text style={fieldLabel}>Due Date</Text>
          <View style={[inputBox, { marginBottom: 16 }]}><TextInput value={draftDueDays} onChangeText={setDraftDueDays} style={inputField} keyboardType="number-pad" /><Text style={suffix}>business days</Text></View>

          {/* Interest */}
          {r.formula !== 'flat_discount' && (
            <>
              <Text style={fieldLabel}>Monthly Interest Rate</Text>
              <View style={[inputBox, { marginBottom: 16 }]}><TextInput value={draftRate} onChangeText={setDraftRate} style={inputField} keyboardType="decimal-pad" /><Text style={suffix}>% a.m.</Text></View>
            </>
          )}

          {/* Offer Discounts */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.color.content.secondary }}>Offer Discounts</Text>
            <Pressable onPress={toggleOffers} style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: offersOn ? theme.color.main : withAlpha(theme.color.content.secondary, 0.2), justifyContent: 'center' }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.color.background.primary, position: 'absolute', left: offersOn ? 20 : 2, ...theme.elevation.level1, shadowColor: theme.color.content.primary }} />
            </Pressable>
          </View>
          {offersOn ? (
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Cash</Text>
                  <View style={inputBox}><TextInput value={draftOffer1} onChangeText={setDraftOffer1} style={inputField} keyboardType="number-pad" /><Text style={suffix}>%</Text></View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Short</Text>
                  <View style={inputBox}><TextInput value={draftOffer2} onChangeText={setDraftOffer2} style={inputField} keyboardType="number-pad" /><Text style={suffix}>%</Text></View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Long</Text>
                  <View style={inputBox}><TextInput value={draftOffer3} onChangeText={setDraftOffer3} style={inputField} keyboardType="number-pad" /><Text style={suffix}>%</Text></View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Offer 2 Inst.</Text>
                  <View style={inputBox}><TextInput value={draftO2Inst} onChangeText={setDraftO2Inst} style={inputField} keyboardType="number-pad" /><Text style={suffix}>x</Text></View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Offer 3 Inst.</Text>
                  <View style={inputBox}><TextInput value={draftO3Inst} onChangeText={setDraftO3Inst} style={inputField} keyboardType="number-pad" /><Text style={suffix}>x</Text></View>
                </View>
              </View>
            </>
          ) : (
            <NText variant="labelSmallDefault" tone="secondary" style={{ fontStyle: 'italic' } as any}>Discounts disabled — values set to 0%.</NText>
          )}
        </View>

        {/* Latency Simulation */}
        <Text style={secLabel}>Latency Simulation</Text>
        <View style={{ borderRadius: theme.radius.lg, backgroundColor: theme.color.background.primary, padding: 16, borderWidth: 1, borderColor: theme.color.border.secondary }}>
          <NText variant="paragraphSmallDefault" tone="secondary" style={{ marginBottom: 12 } as any}>
            This is a screen library with mock data — navigation is instant by default. Use this control to simulate network latency.
          </NText>
          <View style={inputBox}>
            <TextInput value={draftLatency} onChangeText={setDraftLatency} style={inputField} keyboardType="number-pad" />
            <Text style={suffix}>ms</Text>
          </View>
          <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginTop: 6 }}>
            Default: {DEFAULT_SIMULATED_LATENCY_MS} ms · Max: 6000 ms
          </Text>
        </View>

        {/* Save / Reset */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20 }}>
          <Pressable onPress={handleSaveAll} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.full, backgroundColor: theme.color.main }}>
            <NText variant="labelSmallStrong" color={theme.color.content.main}>Save All</NText>
          </Pressable>
          <Pressable onPress={handleResetAll} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.color.border.secondary }}>
            <NText variant="labelSmallStrong" tone="secondary">Reset All</NText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
