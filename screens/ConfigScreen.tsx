import React, { useState, useRef, useCallback, useMemo, useContext } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NText,
  Badge,
  CalloutBox,
  Box,
  SparkleIcon,
  CheckIcon,
  ChevronIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  ExpandMoreIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { SUPPORTED_LOCALES, LOCALE_FLAGS } from '../i18n';
import type { Locale } from '../i18n';
import {
  getProductLinesForLocale,
  getUseCasesForProductLineAndLocale,
} from '../shared/config';
import type { ScreenVisibility } from '../shared/types';
import { ThemeModeContext } from '../config/ThemeModeContext';
import { useThemeMode } from '../config/ThemeModeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Theme = ReturnType<typeof useNuDSTheme>;
type ScreenKey = keyof ScreenVisibility;

const LOCALE_SHORT: Record<Locale, string> = { 'pt-BR': 'BR', 'es-MX': 'MX', 'es-CO': 'CO', 'en-US': 'US' };

const SCREEN_LABELS: Record<ScreenKey, string> = {
  offerHub: 'Offer Hub', installmentValue: 'Installment Value', simulation: 'Simulation',
  suggested: 'Suggested Conditions', downpaymentValue: 'Downpayment Value',
  downpaymentDueDate: 'Downpayment Date', dueDate: 'Due Date', summary: 'Summary',
  terms: 'Terms & Conditions', pin: 'PIN', loading: 'Loading', feedback: 'Feedback', endPath: 'End Path',
};

const SCREEN_ORDER: ScreenKey[] = [
  'offerHub', 'installmentValue', 'simulation', 'suggested',
  'downpaymentValue', 'downpaymentDueDate', 'dueDate', 'summary',
  'terms', 'pin', 'loading', 'feedback', 'endPath',
];

const READY_SCREENS: Set<string> = new Set(['offerHub', 'suggested', 'simulation']);
const SCREEN_NAV_MAP: Record<string, string> = { offerHub: 'offerHub', suggested: 'suggestedConditions', simulation: 'simulation' };

function pickDefaults(locale: Locale) {
  const pls = getProductLinesForLocale(locale);
  const plId = pls[0]?.id ?? '';
  const ucs = getUseCasesForProductLineAndLocale(plId, locale);
  return { plId, ucId: ucs[0]?.id ?? '' };
}

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
/*  Section label (uppercase, like Web)                              */
/* ═══════════════════════════════════════════════════════════════════ */

function Label({ children, theme }: { children: string; theme: Theme }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, color: withAlpha(theme.color.content.primary, 0.4), marginBottom: 8 }}>
      {children}
    </Text>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Country selector (compact flags)                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function CountryRow({ active, onSelect, theme }: { active: Locale; onSelect: (l: Locale) => void; theme: Theme }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {SUPPORTED_LOCALES.map((loc) => {
        const on = loc === active;
        return (
          <TouchableOpacity
            key={loc}
            onPress={() => onSelect(loc)}
            activeOpacity={0.7}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingVertical: 12, borderRadius: 12,
              borderWidth: on ? 2 : 1,
              borderColor: on ? theme.color.main : theme.color.border.primary,
              backgroundColor: on ? withAlpha(theme.color.main, 0.06) : theme.color.background.primary,
            }}
          >
            <Text style={{ fontSize: 16 }}>{LOCALE_FLAGS[loc]}</Text>
            <NText variant="labelSmallStrong" color={on ? theme.color.main : theme.color.content.secondary}>
              {LOCALE_SHORT[loc]}
            </NText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Theme row: Mode toggle + Segment (future)                        */
/* ═══════════════════════════════════════════════════════════════════ */

function ThemeRow({ theme }: { theme: Theme }) {
  const { mode, toggle } = useContext(ThemeModeContext);
  return (
    <View style={{ flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: theme.color.background.secondary }}>
      {(['light', 'dark'] as const).map((m) => {
        const on = mode === m;
        return (
          <TouchableOpacity
            key={m}
            onPress={!on ? toggle : undefined}
            activeOpacity={0.7}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, ...(on ? { backgroundColor: theme.color.background.primary, ...theme.elevation.level1, shadowColor: theme.color.content.primary } : {}) }}
          >
            {m === 'light' ? <SunIcon size={14} color={on ? theme.color.main : theme.color.content.secondary} /> : <MoonIcon size={14} color={on ? theme.color.main : theme.color.content.secondary} />}
            <NText variant="labelSmallStrong" color={on ? theme.color.main : theme.color.content.secondary}>
              {m === 'light' ? 'Light' : 'Dark'}
            </NText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Compact dropdown                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function Dropdown<T extends { id: string; name: string; description?: string }>({ items, selectedId, onSelect, theme }: {
  items: T[]; selectedId: string; onSelect: (id: string) => void; theme: Theme;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((it) => it.id === selectedId);

  const pick = (id: string) => {
    onSelect(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(false);
  };

  if (items.length === 0) return <NText variant="paragraphSmallDefault" tone="secondary" style={{ padding: 12 } as any}>No options</NText>;

  return (
    <View>
      <Pressable
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(!open); }}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: open ? theme.color.main : theme.color.border.primary, backgroundColor: theme.color.background.primary }}
      >
        <NText variant="labelSmallStrong" style={{ flex: 1 } as any}>{selected?.name ?? 'Select'}</NText>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ExpandMoreIcon size={18} color={theme.color.main} />
        </View>
      </Pressable>
      {open && (
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: theme.color.border.primary, marginTop: 4, overflow: 'hidden', ...theme.elevation.level1, shadowColor: theme.color.content.primary, backgroundColor: theme.color.background.primary }}>
          {items.map((item, i) => {
            const on = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                onPress={() => pick(item.id)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: on ? withAlpha(theme.color.main, 0.05) : 'transparent', borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: theme.color.border.secondary }}
              >
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

/* ═══════════════════════════════════════════════════════════════════ */
/*  Collapsible section                                              */
/* ═══════════════════════════════════════════════════════════════════ */

function Collapsible({ title, count, defaultOpen = false, theme, children }: {
  title: string; count: number; defaultOpen?: boolean; theme: Theme; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(!open); }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.color.border.primary, backgroundColor: theme.color.background.primary }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <NText variant="labelSmallStrong">{title}</NText>
          <Badge label={String(count)} color="neutral" />
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ExpandMoreIcon size={18} color={theme.color.main} />
        </View>
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
/*  Building Blocks list                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function BuildingBlocks({ screens, theme }: { screens: ScreenVisibility; theme: Theme }) {
  const count = SCREEN_ORDER.filter((k) => screens[k]).length;
  return (
    <Collapsible title="Building Blocks" count={count} theme={theme}>
      {SCREEN_ORDER.map((key, i) => {
        const on = screens[key];
        return (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 12, borderBottomWidth: i < SCREEN_ORDER.length - 1 ? 1 : 0, borderBottomColor: theme.color.border.secondary }}>
            <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? theme.color.main : 'transparent', borderColor: on ? theme.color.main : theme.color.border.primary }}>
              {on && <CheckIcon size={10} color="#fff" />}
            </View>
            <NText variant="labelSmallDefault" style={{ flex: 1, opacity: on ? 1 : 0.45 } as any}>{SCREEN_LABELS[key]}</NText>
            {READY_SCREENS.has(key) && <Badge label="Ready" color="accent" />}
          </View>
        );
      })}
    </Collapsible>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Screen Templates list                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function ScreenTemplatesList({ onPreview, theme }: { onPreview: (navId: string) => void; theme: Theme }) {
  return (
    <Collapsible title="Screen Templates" count={SCREEN_ORDER.length} theme={theme}>
      {SCREEN_ORDER.map((key, i) => {
        const ready = READY_SCREENS.has(key);
        return (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < SCREEN_ORDER.length - 1 ? 1 : 0, borderBottomColor: theme.color.border.secondary, opacity: ready ? 1 : 0.45 }}>
            <View style={{ flex: 1 }}>
              <NText variant="labelSmallStrong">{SCREEN_LABELS[key]}</NText>
            </View>
            {ready ? (
              <Pressable onPress={() => onPreview(SCREEN_NAV_MAP[key] ?? key)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: withAlpha(theme.color.main, 0.08) }}>
                <NText variant="labelSmallStrong" color={theme.color.main}>Preview</NText>
              </Pressable>
            ) : (
              <Badge label="Soon" color="neutral" />
            )}
          </View>
        );
      })}
    </Collapsible>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Start Flow CTA                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function StartFlowCTA({ disabled, onPress, theme }: { disabled: boolean; onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 9999,
        backgroundColor: disabled ? withAlpha(theme.color.main, 0.35) : theme.color.main,
        transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
      })}
    >
      <ArrowRightIcon size={18} color="#fff" />
      <NText variant="subtitleSmallStrong" color="#fff">Start Flow</NText>
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main ConfigScreen                                                */
/* ═══════════════════════════════════════════════════════════════════ */

type Props = {
  onNavigate: (screenId: string, locale: Locale) => void;
  onNuDSCheck?: () => void;
};

export default function ConfigScreen({ onNavigate, onNuDSCheck }: Props) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const contentFade = useRef(new Animated.Value(1)).current;

  const defaults = useMemo(() => pickDefaults(locale), [locale]);
  const [selectedPL, setSelectedPL] = useState(defaults.plId);
  const [selectedUC, setSelectedUC] = useState(defaults.ucId);

  const productLines = useMemo(() => getProductLinesForLocale(locale), [locale]);
  const useCases = useMemo(() => getUseCasesForProductLineAndLocale(selectedPL, locale), [selectedPL, locale]);
  const activeUseCase = useMemo(() => useCases.find((uc) => uc.id === selectedUC), [useCases, selectedUC]);

  const switchLocale = useCallback((next: Locale) => {
    if (next === locale) return;
    Animated.timing(contentFade, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setLocale(next);
      const d = pickDefaults(next);
      setSelectedPL(d.plId);
      setSelectedUC(d.ucId);
      Animated.timing(contentFade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [locale, contentFade]);

  const handlePLChange = useCallback((plId: string) => {
    setSelectedPL(plId);
    const ucs = getUseCasesForProductLineAndLocale(plId, locale);
    setSelectedUC(ucs[0]?.id ?? '');
  }, [locale]);

  const handleStartFlow = useCallback(() => {
    if (!activeUseCase) return;
    const first = SCREEN_ORDER.find((k) => activeUseCase.screens[k] && READY_SCREENS.has(k));
    if (first) onNavigate(SCREEN_NAV_MAP[first] ?? first, locale);
  }, [activeUseCase, locale, onNavigate]);

  const handlePreview = useCallback((navId: string) => { onNavigate(navId, locale); }, [locale, onNavigate]);

  const hasReady = activeUseCase ? SCREEN_ORDER.some((k) => activeUseCase.screens[k] && READY_SCREENS.has(k)) : false;

  return (
    <Box surface="screen" style={es.screen}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView style={es.scroll} contentContainerStyle={es.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <NText variant="titleMedium" style={{ marginBottom: 20 } as any}>Negotiation Flow</NText>

        {/* Theme */}
        <Label theme={theme}>Theme</Label>
        <ThemeRow theme={theme} />

        <View style={{ height: 20 }} />

        {/* Country / Language */}
        <Label theme={theme}>Country / Language</Label>
        <Animated.View style={{ opacity: contentFade }}>
          <CountryRow active={locale} onSelect={switchLocale} theme={theme} />
        </Animated.View>

        <View style={{ height: 20 }} />

        {/* Product Line */}
        <Animated.View style={{ opacity: contentFade }}>
          <Label theme={theme}>Product Line</Label>
          <Dropdown
            items={productLines.map((pl) => ({ id: pl.id, name: pl.name, description: pl.description }))}
            selectedId={selectedPL}
            onSelect={handlePLChange}
            theme={theme}
          />

          <View style={{ height: 16 }} />

          {/* Use Case */}
          <Label theme={theme}>Use Case</Label>
          <Dropdown
            items={useCases.map((uc) => ({ id: uc.id, name: uc.name, description: uc.description }))}
            selectedId={selectedUC}
            onSelect={setSelectedUC}
            theme={theme}
          />
        </Animated.View>

        <View style={{ height: 20 }} />

        {/* Building Blocks */}
        {activeUseCase && <BuildingBlocks screens={activeUseCase.screens} theme={theme} />}

        {/* Screen Templates */}
        <ScreenTemplatesList onPreview={handlePreview} theme={theme} />

        {/* NuDS Check */}
        {onNuDSCheck && (
          <CalloutBox
            title="NuDS Check"
            description="Design System components & tokens"
            tone="accent"
            actionLabel="Open"
            illustration={<SparkleIcon size={28} color={theme.color.main} />}
            onActionPress={onNuDSCheck}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={[es.footer, { borderTopColor: theme.color.border.primary, backgroundColor: theme.color.background.primary }]}>
        <StartFlowCTA disabled={!hasReady} onPress={handleStartFlow} theme={theme} />
      </View>
    </Box>
  );
}

const es = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 44 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1 },
});
