import React, { useState, useRef, useCallback, useMemo, useContext } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NText,
  Badge,
  CalloutBox,
  SectionTitle,
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
import type { ProductLine, UseCaseDefinition, ScreenVisibility } from '../shared/types';
import { ThemeModeContext } from '../config/ThemeModeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LOCALE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português',
  'es-MX': 'Español (MX)',
  'es-CO': 'Español (CO)',
  'en-US': 'English',
};

type ScreenKey = keyof ScreenVisibility;

const SCREEN_LABELS: Record<ScreenKey, string> = {
  offerHub: 'Offer Hub',
  installmentValue: 'Installment Value',
  simulation: 'Simulation',
  suggested: 'Suggested Conditions',
  downpaymentValue: 'Downpayment Value',
  downpaymentDueDate: 'Downpayment Due Date',
  dueDate: 'Due Date',
  summary: 'Summary',
  terms: 'Terms & Conditions',
  pin: 'PIN',
  loading: 'Loading',
  feedback: 'Feedback',
  endPath: 'End Path',
};

const SCREEN_ORDER: ScreenKey[] = [
  'offerHub', 'installmentValue', 'simulation', 'suggested',
  'downpaymentValue', 'downpaymentDueDate', 'dueDate', 'summary',
  'terms', 'pin', 'loading', 'feedback', 'endPath',
];

const READY_SCREENS: Set<string> = new Set(['offerHub', 'suggested', 'simulation']);

const SCREEN_NAV_MAP: Record<string, string> = {
  offerHub: 'offerHub',
  suggested: 'suggestedConditions',
  simulation: 'simulation',
};

/* ─────────────────── Cascade helpers ─────────────────── */

function pickDefaults(locale: Locale) {
  const pls = getProductLinesForLocale(locale);
  const plId = pls[0]?.id ?? '';
  const ucs = getUseCasesForProductLineAndLocale(plId, locale);
  return { plId, ucId: ucs[0]?.id ?? '' };
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Country / Language tabs                                          */
/* ═══════════════════════════════════════════════════════════════════ */

const TAB_PAD = 4;

function LanguageTabs({ active, onSelect }: { active: Locale; onSelect: (l: Locale) => void }) {
  const theme = useNuDSTheme();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const tabW = width > 0 ? (width - TAB_PAD * 2) / SUPPORTED_LOCALES.length : 0;
  const activeIdx = SUPPORTED_LOCALES.indexOf(active);

  React.useEffect(() => {
    if (width === 0) return;
    Animated.spring(indicatorX, { toValue: activeIdx * tabW, tension: 300, friction: 30, useNativeDriver: true }).start();
  }, [activeIdx, width, indicatorX, tabW]);

  return (
    <View
      style={[s.tabOuter, { backgroundColor: theme.color.background.secondary }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Animated.View style={[s.tabIndicator, {
          width: tabW,
          transform: [{ translateX: indicatorX }],
          backgroundColor: theme.color.background.primary,
          ...theme.elevation.level1,
          shadowColor: theme.color.content.primary,
        }]} />
      )}
      {SUPPORTED_LOCALES.map((locale) => (
        <TouchableOpacity key={locale} style={s.tab} onPress={() => onSelect(locale)} activeOpacity={0.7}>
          <NText variant="paragraphMediumDefault">{LOCALE_FLAGS[locale]}</NText>
          <NText variant="labelSmallStrong" color={locale === active ? theme.color.main : theme.color.content.secondary}>
            {LOCALE_NAMES[locale]}
          </NText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Dark / Light toggle                                              */
/* ═══════════════════════════════════════════════════════════════════ */

function ThemeToggle() {
  const theme = useNuDSTheme();
  const { mode, toggle } = useContext(ThemeModeContext);

  return (
    <View style={[s.themeRow, { backgroundColor: theme.color.background.secondary, borderRadius: 12 }]}>
      {(['light', 'dark'] as const).map((m) => {
        const active = mode === m;
        const iconColor = active ? theme.color.main : theme.color.content.secondary;
        return (
          <TouchableOpacity
            key={m}
            style={[s.themeBtn, active && { backgroundColor: theme.color.background.primary, ...theme.elevation.level1, shadowColor: theme.color.content.primary }]}
            onPress={!active ? toggle : undefined}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {m === 'light' ? <SunIcon size={16} color={iconColor} /> : <MoonIcon size={16} color={iconColor} />}
              <NText variant="labelSmallStrong" color={iconColor}>
                {m === 'light' ? 'Light' : 'Dark'}
              </NText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Dropdown selector (for Product Line + Use Case)                  */
/* ═══════════════════════════════════════════════════════════════════ */

function DropdownSelector<T extends { id: string; name: string; description?: string }>({
  items,
  selectedId,
  onSelect,
  placeholder,
}: {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const theme = useNuDSTheme();
  const [open, setOpen] = useState(false);

  const selected = items.find((it) => it.id === selectedId);

  const handleSelect = (id: string) => {
    onSelect(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(false);
  };

  if (items.length === 0) {
    return (
      <View style={s.emptyCard}>
        <NText variant="paragraphSmallDefault" tone="secondary">No options for this selection.</NText>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[s.dropdownTrigger, { borderColor: open ? theme.color.main : theme.color.border.primary, backgroundColor: theme.color.background.primary }]}
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(!open); }}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <NText variant="labelSmallStrong">{selected?.name ?? placeholder ?? 'Select'}</NText>
          {selected?.description ? (
            <NText variant="paragraphSmallDefault" tone="secondary" numberOfLines={1}>{selected.description}</NText>
          ) : null}
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ExpandMoreIcon size={20} color={theme.color.main} />
        </View>
      </TouchableOpacity>

      {open && (
        <Box surface="primary" style={[s.dropdownList, { borderColor: theme.color.border.primary, ...theme.elevation.level1, shadowColor: theme.color.content.primary }]}>
          {items.map((item, i) => {
            const active = item.id === selectedId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  s.dropdownItem,
                  active && { backgroundColor: withAlpha(theme.color.main, 0.06) },
                  i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.color.border.secondary },
                ]}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <NText variant="labelSmallStrong" color={active ? theme.color.main : undefined}>{item.name}</NText>
                  {item.description ? (
                    <NText variant="paragraphSmallDefault" tone="secondary" numberOfLines={1}>{item.description}</NText>
                  ) : null}
                </View>
                {active && <CheckIcon size={18} color={theme.color.main} />}
              </TouchableOpacity>
            );
          })}
        </Box>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Building Blocks — collapsible section with screen toggles        */
/* ═══════════════════════════════════════════════════════════════════ */

function CollapsibleSection({ title, count, defaultOpen, children }: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const theme = useNuDSTheme();
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
    Animated.spring(rotation, { toValue: open ? 0 : 1, tension: 300, friction: 25, useNativeDriver: true }).start();
  }, [open, rotation]);

  const rotateZ = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={s.section}>
      <TouchableOpacity style={s.sectionHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={s.sectionHeaderLeft}>
          <SectionTitle title={title} trailing={<Badge label={String(count)} color="neutral" />} />
        </View>
        <Animated.View style={{ transform: [{ rotateZ }] }}>
          <NText variant="titleSmall" tone="secondary">›</NText>
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <Box surface="primary" style={[s.sectionBody, { borderColor: theme.color.border.primary, ...theme.elevation.level1, shadowColor: theme.color.content.primary }]}>
          {children}
        </Box>
      )}
    </View>
  );
}

function BuildingBlocksList({ screens }: { screens: ScreenVisibility }) {
  const theme = useNuDSTheme();
  const enabledCount = SCREEN_ORDER.filter((k) => screens[k]).length;

  return (
    <CollapsibleSection title="Flow Building Blocks" count={enabledCount} defaultOpen={false}>
      {SCREEN_ORDER.map((key, i) => {
        const enabled = screens[key];
        return (
          <View
            key={key}
            style={[
              s.blockRow,
              i < SCREEN_ORDER.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.color.border.secondary },
            ]}
          >
            <View style={[s.blockCheck, { backgroundColor: enabled ? theme.color.main : theme.color.background.secondary, borderColor: enabled ? theme.color.main : theme.color.border.primary }]}>
              {enabled && <CheckIcon size={12} color="#fff" />}
            </View>
            <NText
              variant="labelSmallDefault"
              color={enabled ? theme.color.content.primary : theme.color.content.secondary}
              style={{ opacity: enabled ? 1 : 0.5 }}
            >
              {SCREEN_LABELS[key]}
            </NText>
            {READY_SCREENS.has(key) && (
              <Badge label="Ready" color="accent" />
            )}
          </View>
        );
      })}
    </CollapsibleSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Screen Templates (quick preview)                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function ScreenTemplates({ onPreview }: { onPreview: (navId: string) => void }) {
  const theme = useNuDSTheme();
  const readyScreens = SCREEN_ORDER.filter((k) => READY_SCREENS.has(k));
  const totalCount = SCREEN_ORDER.length;

  return (
    <CollapsibleSection title="Screen Templates" count={totalCount} defaultOpen={false}>
      <View style={{ padding: 12 }}>
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ marginBottom: 12 }}>
          Preview individual screens with mock data.
        </NText>
        <View style={s.templateGrid}>
          {readyScreens.map((key) => (
            <TouchableOpacity
              key={key}
              style={[s.templateCard, { borderColor: theme.color.border.primary, backgroundColor: theme.color.background.primary }]}
              onPress={() => onPreview(SCREEN_NAV_MAP[key] ?? key)}
              activeOpacity={0.7}
            >
              <NText variant="labelSmallStrong">{SCREEN_LABELS[key]}</NText>
              <View style={[s.templateBtn, { backgroundColor: withAlpha(theme.color.main, 0.08) }]}>
                <NText variant="labelSmallStrong" color={theme.color.main}>Preview</NText>
              </View>
            </TouchableOpacity>
          ))}
          {SCREEN_ORDER.filter((k) => !READY_SCREENS.has(k)).slice(0, 4).map((key) => (
            <View
              key={key}
              style={[s.templateCard, { borderColor: theme.color.border.secondary, backgroundColor: theme.color.background.secondary, opacity: 0.5 }]}
            >
              <NText variant="labelSmallDefault" tone="secondary">{SCREEN_LABELS[key]}</NText>
              <Badge label="Soon" color="neutral" />
            </View>
          ))}
        </View>
      </View>
    </CollapsibleSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Start Flow button                                                */
/* ═══════════════════════════════════════════════════════════════════ */

function StartFlowButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const theme = useNuDSTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => { if (!disabled) Animated.spring(scale, { toValue: 0.96, tension: 300, friction: 20, useNativeDriver: true }).start(); };
  const handlePressOut = () => { Animated.spring(scale, { toValue: 1, tension: 300, friction: 20, useNativeDriver: true }).start(); };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[s.startBtn, { backgroundColor: disabled ? withAlpha(theme.color.main, 0.4) : theme.color.main }]}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ArrowRightIcon size={18} color="#fff" />
          <NText variant="subtitleSmallStrong" color="#fff">Start Flow</NText>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    Animated.timing(contentFade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setLocale(next);
      const d = pickDefaults(next);
      setSelectedPL(d.plId);
      setSelectedUC(d.ucId);
      Animated.timing(contentFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [locale, contentFade]);

  const handlePLChange = useCallback((plId: string) => {
    setSelectedPL(plId);
    const ucs = getUseCasesForProductLineAndLocale(plId, locale);
    setSelectedUC(ucs[0]?.id ?? '');
  }, [locale]);

  const handleStartFlow = useCallback(() => {
    if (!activeUseCase) return;
    const firstEnabled = SCREEN_ORDER.find((k) => activeUseCase.screens[k] && READY_SCREENS.has(k));
    if (firstEnabled) {
      onNavigate(SCREEN_NAV_MAP[firstEnabled] ?? firstEnabled, locale);
    }
  }, [activeUseCase, locale, onNavigate]);

  const handlePreview = useCallback((navId: string) => {
    onNavigate(navId, locale);
  }, [locale, onNavigate]);

  const hasReadyScreen = activeUseCase
    ? SCREEN_ORDER.some((k) => activeUseCase.screens[k] && READY_SCREENS.has(k))
    : false;

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="auto" />

      <View style={s.header}>
        <View style={s.headerRow}>
          <NText variant="titleMedium" style={{ flex: 1 }}>Negotiation Flow</NText>
        </View>
        <ThemeToggle />
        <View style={{ height: 16 }} />
        <LanguageTabs active={locale} onSelect={switchLocale} />
      </View>

      <Animated.View style={[s.contentWrap, { opacity: contentFade }]}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner} showsVerticalScrollIndicator={false}>

          {/* Product Line */}
          <View style={s.section}>
            <SectionTitle title="Product Line" />
            <View style={{ height: 8 }} />
            <DropdownSelector
              items={productLines.map((pl) => ({ id: pl.id, name: pl.name, description: pl.description }))}
              selectedId={selectedPL}
              onSelect={handlePLChange}
              placeholder="Select product line"
            />
          </View>

          {/* Use Case */}
          <View style={s.section}>
            <SectionTitle title="Use Case" />
            <View style={{ height: 8 }} />
            <DropdownSelector
              items={useCases.map((uc) => ({ id: uc.id, name: uc.name, description: uc.description }))}
              selectedId={selectedUC}
              onSelect={setSelectedUC}
              placeholder="Select use case"
            />
          </View>

          {/* Flow Building Blocks */}
          {activeUseCase && <BuildingBlocksList screens={activeUseCase.screens} />}

          {/* Screen Templates */}
          <ScreenTemplates onPreview={handlePreview} />

          {/* NuDS Check */}
          {onNuDSCheck && (
            <View style={{ marginTop: 4 }}>
              <CalloutBox
                title="NuDS Check"
                description="Design System components & tokens"
                tone="accent"
                actionLabel="Open"
                illustration={<SparkleIcon size={28} color={theme.color.main} />}
                onActionPress={onNuDSCheck}
              />
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* Sticky footer */}
      <View style={[s.footer, {
        borderTopColor: theme.color.border.primary,
        backgroundColor: theme.color.background.primary,
      }]}>
        <StartFlowButton disabled={!hasReadyScreen} onPress={handleStartFlow} />
      </View>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Utils                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

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
/*  Styles                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 44 },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  contentWrap: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },

  /* Language tabs */
  tabOuter: { flexDirection: 'row', borderRadius: 28, padding: TAB_PAD },
  tabIndicator: { position: 'absolute', top: TAB_PAD, bottom: TAB_PAD, left: TAB_PAD, borderRadius: 24 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, zIndex: 1, gap: 6 },

  /* Theme toggle */
  themeRow: { flexDirection: 'row', padding: 3, marginBottom: 4 },
  themeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },

  /* Sections */
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4 },
  sectionHeaderLeft: { flex: 1 },
  sectionBody: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginTop: 8 },

  /* Dropdown */
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  dropdownList: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 6 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  emptyCard: { padding: 24, alignItems: 'center' },

  /* Building blocks */
  blockRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  blockCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  /* Screen templates */
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  templateCard: { width: '48%' as any, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  templateBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },

  /* Footer */
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1 },
  startBtn: { paddingVertical: 16, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
});
