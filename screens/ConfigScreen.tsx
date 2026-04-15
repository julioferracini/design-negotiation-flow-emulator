import React, { useState, useRef, useCallback, useMemo, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
  Pressable,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NText,
  Badge,
  CalloutBox,
  Box,
  SparkleIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  ArrowBackIcon,
  ExpandMoreIcon,
  SettingsIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { SUPPORTED_LOCALES, LOCALE_FLAGS } from '../i18n';
import type { Locale } from '../i18n';
import {
  getProductLinesForLocale,
  getUseCasesForProductLineAndLocale,
} from '../shared/config';
import type { ScreenVisibility } from '../shared/types';
import { ThemeModeContext, useThemeMode } from '../config/ThemeModeContext';
import type { ThemeSegment } from '../config/ThemeModeContext';
import { useEmulatorConfig, DEFAULT_DEBT_BY_LOCALE } from '../config/EmulatorConfigContext';
import type { FlowOptionKey } from '../config/EmulatorConfigContext';
import {
  SCREEN_BLOCK_ORDER,
  READY_SCREENS,
  SCREEN_BLOCK_META,
  SCREEN_CONTENT_VARIANTS,
} from '../shared/data/screenVariants';
import type { ScreenContentVariant } from '../shared/data/screenVariants';
import { getRules, type AmortizationFormula } from '../config/financialCalculator';
import { getUseCaseForLocale } from '../config/useCases';
import { formatCurrency } from '../config/formatters';
import type { RuleOverrides } from '../config/emulatorConfig';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Theme = ReturnType<typeof useNuDSTheme>;
type ScreenKey = keyof ScreenVisibility;

const LOCALE_SHORT: Record<Locale, string> = { 'pt-BR': 'BR', 'es-MX': 'MX', 'es-CO': 'CO', 'en-US': 'US' };

const SCREEN_LABELS: Record<ScreenKey, string> = {
  offerHub: 'Offer Hub', inputValue: 'Input Value', simulation: 'Simulation',
  suggested: 'Suggested Conditions', dueDate: 'Due Date', summary: 'Summary',
  terms: 'Terms & Conditions', pin: 'PIN', loading: 'Loading', feedback: 'Feedback',
};

const SCREEN_NAV_MAP: Record<string, string> = {
  offerHub: 'offerHub', suggested: 'suggestedConditions', simulation: 'simulation',
  summary: 'summary', inputValue: 'inputValue', dueDate: 'dueDate',
  terms: 'terms', pin: 'pin', loading: 'loading', feedback: 'feedback',
};

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

function Label({ children, theme }: { children: string; theme: Theme }) {
  return <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, color: withAlpha(theme.color.content.primary, 0.4), marginBottom: 8 }}>{children}</Text>;
}

function Divider({ theme }: { theme: Theme }) {
  return <View style={{ height: 1, backgroundColor: theme.color.border.secondary, marginVertical: 20 }} />;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Theme Panel                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

const SEGMENTS: { id: ThemeSegment; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'uv', label: 'UV' },
  { id: 'pj', label: 'PJ' },
];

const ACCENT_COLORS: Record<ThemeSegment, { light: string; dark: string }> = {
  standard: { light: '#820AD1', dark: '#5A1D8C' },
  uv: { light: '#3E1874', dark: '#3D1E6F' },
  pj: { light: '#714F8F', dark: '#643D7C' },
};

function getAccentColor(seg: ThemeSegment, m: 'light' | 'dark'): string {
  return ACCENT_COLORS[seg]?.[m] ?? '#820AD1';
}

function ThemePanel({ theme }: { theme: Theme }) {
  const { mode, toggle, segment, setSegment } = useContext(ThemeModeContext);
  const [open, setOpen] = useState(false);
  const sliderX = useRef(new Animated.Value(mode === 'light' ? 0 : 1)).current;
  const accentColor = getAccentColor(segment, mode);

  const handleToggle = () => {
    toggle();
    Animated.spring(sliderX, { toValue: mode === 'light' ? 1 : 0, stiffness: 300, damping: 25, useNativeDriver: false }).start();
  };

  const trackW = 200;
  const knobW = trackW / 2 - 4;
  const knobLeft = sliderX.interpolate({ inputRange: [0, 1], outputRange: [2, trackW / 2 + 2] });
  const segLabel = SEGMENTS.find((s) => s.id === segment)?.label ?? 'Standard';

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(!open); }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border.primary, backgroundColor: theme.color.background.primary }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SettingsIcon size={18} color={accentColor} />
          <NText variant="labelSmallStrong">Theme</NText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: accentColor }} />
          <NText variant="labelSmallDefault" tone="secondary">{segLabel} · {mode === 'light' ? 'Light' : 'Dark'}</NText>
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <ExpandMoreIcon size={16} color={theme.color.content.secondary} />
          </View>
        </View>
      </Pressable>

      {open && (
        <View style={{ marginTop: 6, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border.primary, backgroundColor: theme.color.background.primary, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SEGMENTS.map((seg) => {
              const on = seg.id === segment;
              const segAccent = getAccentColor(seg.id, mode);
              return (
                <Pressable key={seg.id} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSegment(seg.id); }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: on ? 2 : 1, borderColor: on ? segAccent : theme.color.border.primary, backgroundColor: on ? withAlpha(segAccent, 0.06) : 'transparent' }}>
                  <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: segAccent }} />
                  <NText variant="labelSmallStrong" color={on ? segAccent : theme.color.content.secondary}>{seg.label}</NText>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={handleToggle} style={{ width: trackW, height: 40, borderRadius: 12, backgroundColor: theme.color.background.secondary, padding: 2, position: 'relative', alignSelf: 'center' }}>
            <Animated.View style={{ position: 'absolute', top: 2, width: knobW, height: 36, borderRadius: 10, backgroundColor: theme.color.background.primary, left: knobLeft, ...theme.elevation.level1, shadowColor: theme.color.content.primary }} />
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}>
                <SunIcon size={14} color={mode === 'light' ? accentColor : theme.color.content.secondary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: mode === 'light' ? accentColor : theme.color.content.secondary }}>Light</Text>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}>
                <MoonIcon size={14} color={mode === 'dark' ? accentColor : theme.color.content.secondary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: mode === 'dark' ? accentColor : theme.color.content.secondary }}>Dark</Text>
              </View>
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.color.background.secondary }}>
            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: accentColor }} />
            <View style={{ flex: 1 }}>
              <NText variant="labelSmallStrong">{segLabel} · {mode === 'light' ? 'Light' : 'Dark'}</NText>
              <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: theme.color.content.secondary }}>{accentColor}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Country / Dropdown / Collapsible (reused)                        */
/* ═══════════════════════════════════════════════════════════════════ */

function CountryRow({ active, onSelect, theme }: { active: Locale; onSelect: (l: Locale) => void; theme: Theme }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {SUPPORTED_LOCALES.map((loc) => {
        const on = loc === active;
        return (
          <TouchableOpacity key={loc} onPress={() => onSelect(loc)} activeOpacity={0.7} style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            paddingVertical: 12, borderRadius: 12, borderWidth: on ? 2 : 1,
            borderColor: on ? theme.color.main : theme.color.border.primary,
            backgroundColor: on ? withAlpha(theme.color.main, 0.06) : theme.color.background.primary,
          }}>
            <Text style={{ fontSize: 16 }}>{LOCALE_FLAGS[loc]}</Text>
            <NText variant="labelSmallStrong" color={on ? theme.color.main : theme.color.content.secondary}>{LOCALE_SHORT[loc]}</NText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Dropdown<T extends { id: string; name: string; description?: string }>({ items, selectedId, onSelect, theme }: {
  items: T[]; selectedId: string; onSelect: (id: string) => void; theme: Theme;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((it) => it.id === selectedId);
  const pick = (id: string) => { onSelect(id); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(false); };
  if (items.length === 0) return <NText variant="paragraphSmallDefault" tone="secondary" style={{ padding: 12 } as any}>No options</NText>;
  return (
    <View>
      <Pressable onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(!open); }}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: open ? theme.color.main : theme.color.border.primary, backgroundColor: theme.color.background.primary }}>
        <NText variant="labelSmallStrong" style={{ flex: 1 } as any}>{selected?.name ?? 'Select'}</NText>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}><ExpandMoreIcon size={18} color={theme.color.main} /></View>
      </Pressable>
      {open && (
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: theme.color.border.primary, marginTop: 4, overflow: 'hidden', ...theme.elevation.level1, shadowColor: theme.color.content.primary, backgroundColor: theme.color.background.primary }}>
          {items.map((item, i) => {
            const on = item.id === selectedId;
            return (
              <Pressable key={item.id} onPress={() => pick(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: on ? withAlpha(theme.color.main, 0.05) : 'transparent', borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: theme.color.border.secondary }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <NText variant="labelSmallStrong" color={on ? theme.color.main : undefined}>{item.name}</NText>
                  {item.description ? <NText variant="labelSmallDefault" tone="secondary" numberOfLines={1}>{item.description}</NText> : null}
                </View>
                {on && <CheckIcon size={16} color={theme.color.main} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Collapsible({ title, count, badge, defaultOpen = false, theme, children }: {
  title: string; count?: number; badge?: string; defaultOpen?: boolean; theme: Theme; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ marginBottom: 12 }}>
      <Pressable onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(!open); }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border.primary, backgroundColor: theme.color.background.primary }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <NText variant="labelSmallStrong">{title}</NText>
          {count !== undefined && <Badge label={String(count)} color="neutral" />}
          {badge && <Badge label={badge} color="neutral" />}
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}><ExpandMoreIcon size={18} color={theme.color.main} /></View>
      </Pressable>
      {open && (
        <View style={{ marginTop: 6, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border.primary, overflow: 'hidden', backgroundColor: theme.color.background.primary }}>
          {children}
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Bottom Sheet for Variant Picker                                  */
/* ═══════════════════════════════════════════════════════════════════ */

function VariantBottomSheet({ screenKey, visible, onClose, onSelect, theme }: {
  screenKey: ScreenKey | null;
  visible: boolean;
  onClose: () => void;
  onSelect: (variant: ScreenContentVariant) => void;
  theme: Theme;
}) {
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  const variants = screenKey ? SCREEN_CONTENT_VARIANTS[screenKey] ?? [] : [];
  const meta = screenKey ? SCREEN_BLOCK_META[screenKey] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={bs.overlay} onPress={onClose}>
        <View />
      </Pressable>
      <View style={[bs.sheet, { backgroundColor: isLight ? '#FFFFFF' : '#1A1A1C' }]}>
        <View style={bs.handle} />
        {meta && (
          <View style={bs.header}>
            <NText variant="subtitleSmallStrong">{meta.title}</NText>
            <Badge label={`${variants.length} variants`} color="accent" />
          </View>
        )}
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ marginBottom: 16 } as any}>
          Choose a variant to preview.
        </NText>
        <FlatList
          data={variants}
          keyExtractor={(v) => v.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const ready = item.status === 'ready';
            return (
              <Pressable
                onPress={ready ? () => onSelect(item) : undefined}
                style={({ pressed }) => [
                  bs.variantCard,
                  {
                    borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                    backgroundColor: item.isDefault ? withAlpha(theme.color.main, 0.04) : (isLight ? '#F8F7F9' : '#222224'),
                    opacity: ready ? (pressed ? 0.8 : 1) : 0.5,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <NText variant="labelSmallStrong">{item.label}</NText>
                  {item.isDefault && (
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: withAlpha(theme.color.main, 0.1) }}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: theme.color.main, textTransform: 'uppercase', letterSpacing: 0.4 }}>Default</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 9, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: theme.color.content.secondary }}>{item.version}</Text>
                </View>
                <NText variant="paragraphSmallDefault" tone="secondary" numberOfLines={2}>
                  {item.description}
                </NText>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const bs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '65%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  variantCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  Building Blocks with variant badges                              */
/* ═══════════════════════════════════════════════════════════════════ */

function BuildingBlocks({ screenSettings, onToggle, onPreview, theme }: {
  screenSettings: Record<string, { enabled: boolean }>;
  onToggle: (key: ScreenKey) => void;
  onPreview: (key: ScreenKey) => void;
  theme: Theme;
}) {
  const readyCount = SCREEN_BLOCK_ORDER.filter((k) => READY_SCREENS.has(k)).length;
  return (
    <Collapsible title="Chassis Design – UI Building Blocks" count={readyCount} badge="Work in Progress" theme={theme}>
      {SCREEN_BLOCK_ORDER.map((key, i) => {
        const meta = SCREEN_BLOCK_META[key];
        const ready = READY_SCREENS.has(key);
        const variantCount = SCREEN_CONTENT_VARIANTS[key]?.length ?? 0;
        return (
          <Pressable
            key={key}
            onPress={ready ? () => onPreview(key) : undefined}
            style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
              borderBottomWidth: i < SCREEN_BLOCK_ORDER.length - 1 ? 1 : 0,
              borderBottomColor: theme.color.border.secondary,
              opacity: ready ? 1 : 0.45,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <NText variant="labelSmallStrong">{meta.title}</NText>
                {ready && variantCount > 1 && (
                  <View style={{ backgroundColor: withAlpha(theme.color.main, 0.08), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <SettingsIcon size={8} color={theme.color.main} />
                    <Text style={{ fontSize: 9, fontWeight: '600', color: theme.color.main }}>{variantCount}</Text>
                  </View>
                )}
                {!ready && <Badge label="Soon" color="neutral" />}
              </View>
              <NText variant="labelSmallDefault" tone="secondary" numberOfLines={1}>{meta.description}</NText>
            </View>
            {ready && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: withAlpha(theme.color.main, 0.08) }}>
                <NText variant="labelSmallStrong" color={theme.color.main}>Preview</NText>
              </View>
            )}
          </Pressable>
        );
      })}
    </Collapsible>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Financial Rules Panel (exposed inline)                           */
/* ═══════════════════════════════════════════════════════════════════ */

const FORMULA_OPTIONS: { id: AmortizationFormula; label: string; desc: string }[] = [
  { id: 'flat_discount', label: 'Flat', desc: 'Equal payments, no interest' },
  { id: 'price', label: 'Price', desc: 'Fixed payments with compound interest (PMT)' },
  { id: 'sac', label: 'SAC', desc: 'Decreasing payments, constant amortization' },
];

function FinancialRulesPanel({ theme }: { theme: Theme }) {
  const config = useEmulatorConfig();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  const locale = config.locale;
  const defaults = getRules(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const r = config.effectiveRules;

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

  const debtDefaults = DEFAULT_DEBT_BY_LOCALE[locale];
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
  };

  const handleResetAll = () => {
    config.resetDebtOverrides();
    config.resetRuleOverrides();
  };

  const toggleOffers = () => {
    const next = !offersOn;
    setOffersOn(next);
    if (!next) {
      config.setRuleOverrides({ offer1DiscountPercent: 0, offer2DiscountPercent: 0, offer3DiscountPercent: 0 });
    }
  };

  const inputBox = { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: 8, borderWidth: 1, borderColor: theme.color.border.primary, backgroundColor: theme.color.background.primary, overflow: 'hidden' as const };
  const inputField = { flex: 1, padding: 8, fontSize: 13, fontWeight: '600' as const, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: theme.color.content.primary };
  const suffix = { fontSize: 10, fontWeight: '500' as const, color: theme.color.content.secondary, paddingRight: 8 };
  const secLabel = { fontSize: 9, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 1, color: theme.color.content.secondary, marginBottom: 8, marginTop: 14 };

  return (
    <Collapsible title="Financial Rules" badge={rulesIsDefault ? undefined : 'Modified'} theme={theme}>
      <View style={{ padding: 16, gap: 0 }}>
        {/* Amortization */}
        <Text style={secLabel}>Amortization</Text>
        <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: theme.color.border.primary }}>
          {FORMULA_OPTIONS.map((opt, i) => {
            const on = opt.id === r.formula;
            return (
              <Pressable key={opt.id} onPress={() => config.setRuleOverrides({ formula: opt.id })}
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: on ? withAlpha(theme.color.main, 0.08) : 'transparent', borderRightWidth: i < FORMULA_OPTIONS.length - 1 ? 1 : 0, borderRightColor: theme.color.border.primary }}>
                <Text style={{ fontSize: 12, fontWeight: on ? '700' : '500', color: on ? theme.color.main : theme.color.content.secondary }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginTop: 4 }}>
          {FORMULA_OPTIONS.find((o) => o.id === r.formula)?.desc}
        </Text>

        {/* Negotiation Values */}
        <Text style={secLabel}>Negotiation Values</Text>
        <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 8 }}>Total values per segment ({curr.code}).</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: theme.color.content.secondary, marginBottom: 3 }}>Card</Text>
            <View style={inputBox}>
              <Text style={{ fontSize: 10, color: theme.color.content.secondary, paddingLeft: 8 }}>{curr.symbol}</Text>
              <TextInput value={draftCard} onChangeText={setDraftCard} style={inputField} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: theme.color.content.secondary, marginBottom: 3 }}>Loans</Text>
            <View style={inputBox}>
              <Text style={{ fontSize: 10, color: theme.color.content.secondary, paddingLeft: 8 }}>{curr.symbol}</Text>
              <TextInput value={draftLoan} onChangeText={setDraftLoan} style={inputField} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.color.content.primary, marginTop: 8 }}>Total: {fmtTotal}</Text>

        {/* Installments */}
        <Text style={secLabel}>Installments</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
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
        <Text style={secLabel}>Due Date</Text>
        <View style={inputBox}><TextInput value={draftDueDays} onChangeText={setDraftDueDays} style={inputField} keyboardType="number-pad" /><Text style={suffix}>days</Text></View>

        {/* Interest */}
        {r.formula !== 'flat_discount' && (<>
          <Text style={secLabel}>Interest</Text>
          <View style={inputBox}><TextInput value={draftRate} onChangeText={setDraftRate} style={inputField} keyboardType="decimal-pad" /><Text style={suffix}>% a.m.</Text></View>
        </>)}

        {/* Offer Discounts */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: theme.color.content.secondary }}>Offer Discounts</Text>
          <Pressable onPress={toggleOffers} style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: offersOn ? theme.color.main : withAlpha(theme.color.content.secondary, 0.2), justifyContent: 'center' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', position: 'absolute', left: offersOn ? 18 : 2 }} />
          </Pressable>
        </View>
        {offersOn ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
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
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Offer 2 Installments</Text>
                <View style={inputBox}><TextInput value={draftO2Inst} onChangeText={setDraftO2Inst} style={inputField} keyboardType="number-pad" /><Text style={suffix}>x</Text></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: theme.color.content.secondary, marginBottom: 3 }}>Offer 3 Installments</Text>
                <View style={inputBox}><TextInput value={draftO3Inst} onChangeText={setDraftO3Inst} style={inputField} keyboardType="number-pad" /><Text style={suffix}>x</Text></View>
              </View>
            </View>
          </>
        ) : (
          <Text style={{ fontSize: 11, color: theme.color.content.secondary, fontStyle: 'italic' }}>Discounts disabled — values set to 0%.</Text>
        )}

        {/* Save / Reset */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Pressable onPress={handleSaveAll} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.color.main }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Save All</Text>
          </Pressable>
          <Pressable onPress={handleResetAll} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.color.border.primary }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.color.content.secondary }}>Reset All</Text>
          </Pressable>
        </View>
      </View>
    </Collapsible>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Flow Options                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

const FLOW_OPTION_LABELS: Record<FlowOptionKey, string> = { pin: 'PIN confirmation' };

function FlowOptions({ flowOptions, onToggle, theme }: {
  flowOptions: Record<string, boolean>; onToggle: (key: FlowOptionKey) => void; theme: Theme;
}) {
  const keys = Object.keys(FLOW_OPTION_LABELS) as FlowOptionKey[];
  const count = keys.filter((k) => flowOptions[k]).length;
  return (
    <Collapsible title="Flow Options" count={count} theme={theme}>
      {keys.map((key, i) => {
        const on = flowOptions[key] ?? false;
        return (
          <Pressable key={key} onPress={() => onToggle(key)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12, borderBottomWidth: i < keys.length - 1 ? 1 : 0, borderBottomColor: theme.color.border.secondary }}>
            <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? theme.color.main : 'transparent', borderColor: on ? theme.color.main : theme.color.border.primary }}>
              {on && <CheckIcon size={10} color="#fff" />}
            </View>
            <NText variant="labelSmallDefault" style={{ flex: 1, opacity: on ? 1 : 0.45 } as any}>{FLOW_OPTION_LABELS[key]}</NText>
          </Pressable>
        );
      })}
    </Collapsible>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main ConfigScreen                                                */
/* ═══════════════════════════════════════════════════════════════════ */

type Props = { onNavigate: (screenId: string, locale: Locale, variant?: string) => void; onNuDSCheck?: () => void; onBack?: () => void };

export default function ConfigScreen({ onNavigate, onNuDSCheck, onBack }: Props) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const {
    locale, productLineId, useCaseId, selectedUseCase: activeUseCase,
    setLocale: setLocaleCtx, setProductLine, setUseCase,
    screenSettings, updateScreen, flowOptions, updateFlowOption,
  } = useEmulatorConfig();
  const contentFade = useRef(new Animated.Value(1)).current;

  const [variantSheetKey, setVariantSheetKey] = useState<ScreenKey | null>(null);

  const productLines = useMemo(() => getProductLinesForLocale(locale), [locale]);
  const useCases = useMemo(() => getUseCasesForProductLineAndLocale(productLineId, locale), [productLineId, locale]);

  const switchLocale = useCallback((next: Locale) => {
    if (next === locale) return;
    Animated.timing(contentFade, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setLocaleCtx(next);
      Animated.timing(contentFade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [locale, contentFade, setLocaleCtx]);

  const handlePLChange = useCallback((plId: string) => setProductLine(plId), [setProductLine]);

  const handleStartFlow = useCallback(() => {
    if (!activeUseCase) return;
    const first = SCREEN_BLOCK_ORDER.find((k) => activeUseCase.screens[k] && READY_SCREENS.has(k));
    if (first) onNavigate(SCREEN_NAV_MAP[first] ?? first, locale);
  }, [activeUseCase, locale, onNavigate]);

  const handlePreview = useCallback((screenKey: ScreenKey) => {
    const variants = SCREEN_CONTENT_VARIANTS[screenKey];
    if (variants && variants.length > 1) {
      setVariantSheetKey(screenKey);
    } else {
      onNavigate(SCREEN_NAV_MAP[screenKey] ?? screenKey, locale);
    }
  }, [locale, onNavigate]);

  const handleVariantSelect = useCallback((variant: ScreenContentVariant) => {
    setVariantSheetKey(null);
    const navId = SCREEN_NAV_MAP[variantSheetKey!] ?? variantSheetKey!;
    onNavigate(navId, locale, variant.id);
  }, [locale, onNavigate, variantSheetKey]);

  const resetDefaults = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLocaleCtx('pt-BR');
  }, [setLocaleCtx]);

  const hasReady = activeUseCase ? SCREEN_BLOCK_ORDER.some((k) => activeUseCase.screens[k] && READY_SCREENS.has(k)) : false;

  return (
    <Box surface="screen" style={es.screen}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView style={es.scroll} contentContainerStyle={es.scrollInner} showsVerticalScrollIndicator={false}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <ArrowBackIcon size={20} color={theme.color.content.primary} />
            <NText variant="labelSmallDefault" tone="secondary">Home</NText>
          </Pressable>
        )}
        <NText variant="titleMedium" style={{ marginBottom: 4 } as any}>Emulator</NText>
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ marginBottom: 20 } as any}>Use case prototypes with financial and regulatory parameters</NText>

        <ThemePanel theme={theme} />

        <Label theme={theme}>Country / Language</Label>
        <Animated.View style={{ opacity: contentFade }}>
          <CountryRow active={locale} onSelect={switchLocale} theme={theme} />
        </Animated.View>

        <Divider theme={theme} />

        <Animated.View style={{ opacity: contentFade }}>
          <Label theme={theme}>Product Line</Label>
          <Dropdown items={productLines.map((pl) => ({ id: pl.id, name: pl.name, description: pl.description }))} selectedId={productLineId} onSelect={handlePLChange} theme={theme} />
          <View style={{ height: 14 }} />
          <Label theme={theme}>Use Case</Label>
          <Dropdown items={useCases.map((uc) => ({ id: uc.id, name: uc.name, description: uc.description }))} selectedId={useCaseId} onSelect={setUseCase} theme={theme} />
        </Animated.View>

        <View style={{ height: 16 }} />

        <FlowOptions flowOptions={flowOptions} onToggle={(key) => updateFlowOption(key, !flowOptions[key])} theme={theme} />
        <FinancialRulesPanel theme={theme} />

        <Divider theme={theme} />

        <BuildingBlocks
          screenSettings={screenSettings}
          onToggle={(key) => updateScreen(key, { enabled: !screenSettings[key]?.enabled })}
          onPreview={handlePreview}
          theme={theme}
        />

        {onNuDSCheck && (
          <CalloutBox title="NuDS Check" description="Design System components & tokens" tone="accent" actionLabel="Open"
            illustration={<SparkleIcon size={28} color={theme.color.main} />} onActionPress={onNuDSCheck} />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[es.footer, { borderTopColor: theme.color.border.primary, backgroundColor: theme.color.background.primary }]}>
        <Pressable onPress={hasReady ? handleStartFlow : undefined} disabled={!hasReady}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 9999, backgroundColor: hasReady ? theme.color.main : withAlpha(theme.color.main, 0.35), transform: [{ scale: pressed && hasReady ? 0.97 : 1 }] })}>
          <ArrowRightIcon size={18} color="#fff" />
          <NText variant="subtitleSmallStrong" color="#fff">Start Flow</NText>
        </Pressable>
        <Pressable onPress={resetDefaults} style={{ alignItems: 'center', paddingTop: 10 }}>
          <NText variant="labelSmallDefault" color={theme.color.content.secondary}>Reset Defaults</NText>
        </Pressable>
      </View>

      <VariantBottomSheet
        screenKey={variantSheetKey}
        visible={variantSheetKey !== null}
        onClose={() => setVariantSheetKey(null)}
        onSelect={handleVariantSelect}
        theme={theme}
      />
    </Box>
  );
}

const es = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 44 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1 },
});
