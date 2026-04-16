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
  FlatList,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NText,
  Badge,
  CalloutBox,
  Box,
  BottomSheet,
  SparkleIcon,
  CheckmarkIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  ArrowBackIcon,
  ExpandMoreIcon,
  SettingsIcon,
  GlobeIcon,
  ShapesBoxIcon,
  ShieldCheckIcon,
  UnfoldMoreIcon,
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
import { useEmulatorConfig } from '../config/EmulatorConfigContext';
import {
  SCREEN_BLOCK_ORDER,
  READY_SCREENS,
  SCREEN_BLOCK_META,
  SCREEN_CONTENT_VARIANTS,
  PACKS,
} from '../shared/data/screenVariants';
import type { ScreenContentVariant } from '../shared/data/screenVariants';
import type { RuleOverrides } from '../config/emulatorConfig';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Theme = ReturnType<typeof useNuDSTheme>;
type ScreenKey = keyof ScreenVisibility;

const LOCALE_SHORT: Record<Locale, string> = { 'pt-BR': 'BR', 'es-MX': 'MX', 'es-CO': 'CO', 'en-US': 'US' };

const LOCALE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brazil)',
  'es-MX': 'Español (Mexico)',
  'es-CO': 'Español (Colombia)',
  'en-US': 'English (US)',
};

const SCREEN_LABELS: Record<ScreenKey, string> = {
  offerHub: 'Offer Hub', eligibility: 'Eligibility', inputValue: 'Input Value', simulation: 'Simulation',
  suggested: 'Suggested Conditions', dueDate: 'Due Date', summary: 'Summary',
  terms: 'Terms & Conditions', pin: 'PIN', loading: 'Loading', feedback: 'Feedback',
};

const SCREEN_NAV_MAP: Record<string, string> = {
  offerHub: 'offerHub', eligibility: 'eligibility', suggested: 'suggestedConditions', simulation: 'simulation',
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

/* ═══════════════════════════════════════════════════════════════════ */
/*  Theme Panel (renders inside BottomSheet)                         */
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

function ThemePanelContent({ theme }: { theme: Theme }) {
  const { mode, toggle, segment, setSegment } = useContext(ThemeModeContext);
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
    <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, gap: 16 }}>
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
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Configuration Card (tappable row that opens a sheet)             */
/* ═══════════════════════════════════════════════════════════════════ */

function ConfigCard({ icon, title, value, onPress, theme }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.color.background.primary,
        marginBottom: 10,
        opacity: pressed ? 0.85 : 1,
        ...theme.elevation.level1,
        shadowColor: theme.color.content.primary,
      })}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <NText variant="labelSmallStrong">{title}</NText>
        <NText variant="labelSmallDefault" tone="secondary" numberOfLines={1}>{value}</NText>
      </View>
      <ArrowRightIcon size={16} color={theme.color.content.secondary} />
    </Pressable>
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
  const sheetTitle = meta ? `${meta.title} · ${variants.length} variants` : 'Variants';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={sheetTitle}
      showHandle
      show1stAction
    >
      <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ marginBottom: 16 } as any}>
          Choose a variant to preview.
        </NText>
        <FlatList
          data={variants}
          keyExtractor={(v) => v.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const ready = item.status === 'ready';
            return (
              <Pressable
                onPress={ready ? () => onSelect(item) : undefined}
                style={({ pressed }) => ({
                  borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8,
                  borderColor: theme.color.border.primary,
                  backgroundColor: item.isDefault ? withAlpha(theme.color.main, 0.04) : theme.color.background.secondary,
                  opacity: ready ? (pressed ? 0.8 : 1) : 0.5,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <NText variant="labelSmallStrong">{item.label}</NText>
                  {item.isDefault && <Badge label="Default" color="accent" />}
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
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Building Blocks with variant badges (card surface)               */
/* ═══════════════════════════════════════════════════════════════════ */

function BuildingBlocks({ screenSettings, onToggle, onPreview, theme }: {
  screenSettings: Record<string, { enabled: boolean }>;
  onToggle: (key: ScreenKey) => void;
  onPreview: (key: ScreenKey) => void;
  theme: Theme;
}) {
  const readyCount = SCREEN_BLOCK_ORDER.filter((k) => READY_SCREENS.has(k)).length;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <NText variant="label2XSmallStrong" color={withAlpha(theme.color.content.primary, 0.4)} style={{ textTransform: 'uppercase', letterSpacing: 0.8 } as any}>
          UI BUILDING BLOCKS
        </NText>
        <Badge label={`${readyCount} ready`} color="neutral" />
      </View>

      <View style={{
        borderRadius: 16,
        backgroundColor: theme.color.background.primary,
        overflow: 'hidden',
        ...theme.elevation.level1,
        shadowColor: theme.color.content.primary,
      }}>
        {PACKS.map((pack) => {
          const packScreens = pack.screens.filter((k) => SCREEN_BLOCK_ORDER.includes(k as ScreenKey)) as ScreenKey[];
          const packReady = packScreens.filter((k) => READY_SCREENS.has(k)).length;
          return (
            <View key={pack.id}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 16, paddingTop: pack.id !== 'negotiation' ? 14 : 12, paddingBottom: 6,
              }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.color.main, opacity: 0.6 }} />
                <NText variant="label2XSmallStrong" color={theme.color.main}>{pack.title.toUpperCase()}</NText>
                <NText variant="label2XSmallDefault" tone="secondary">{packReady}/{packScreens.length}</NText>
              </View>

              {packScreens.map((key, i) => {
                const meta = SCREEN_BLOCK_META[key];
                const ready = READY_SCREENS.has(key);
                const variantCount = SCREEN_CONTENT_VARIANTS[key]?.length ?? 0;
                return (
                  <Pressable
                    key={key}
                    onPress={ready ? () => onPreview(key) : undefined}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
                      borderBottomWidth: i < packScreens.length - 1 ? 1 : 0,
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
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main ConfigScreen                                                */
/* ═══════════════════════════════════════════════════════════════════ */

type Props = { onNavigate: (screenId: string, locale: Locale, variant?: string) => void; onNuDSCheck?: () => void; onBack?: () => void; onBuildingBlocks?: () => void; onAdvancedSettings?: () => void };

export default function ConfigScreen({ onNavigate, onNuDSCheck, onBack, onBuildingBlocks, onAdvancedSettings }: Props) {
  const theme = useNuDSTheme();
  const { mode, segment } = useThemeMode();
  const {
    locale, productLineId, useCaseId, selectedUseCase: activeUseCase,
    setLocale: setLocaleCtx, setProductLine, setUseCase,
    screenSettings, updateScreen,
  } = useEmulatorConfig();
  const contentFade = useRef(new Animated.Value(1)).current;

  const [variantSheetKey, setVariantSheetKey] = useState<ScreenKey | null>(null);

  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [productLineSheetOpen, setProductLineSheetOpen] = useState(false);
  const [useCaseSheetOpen, setUseCaseSheetOpen] = useState(false);
  // advancedSheetOpen removed — now navigates to AdvancedSettingsScreen

  const productLines = useMemo(() => getProductLinesForLocale(locale), [locale]);
  const useCases = useMemo(() => getUseCasesForProductLineAndLocale(productLineId, locale), [productLineId, locale]);

  const accentColor = getAccentColor(segment, mode);
  const segLabel = SEGMENTS.find((s) => s.id === segment)?.label ?? 'Standard';
  const selectedPL = productLines.find((pl) => pl.id === productLineId);
  const selectedUC = useCases.find((uc) => uc.id === useCaseId);

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

  const hasReady = activeUseCase ? SCREEN_BLOCK_ORDER.some((k) => activeUseCase.screens[k] && READY_SCREENS.has(k)) : false;

  return (
    <View style={[es.screen, { backgroundColor: theme.color.background.secondary }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <ScrollView style={es.scroll} contentContainerStyle={es.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            {onBack && (
              <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <ArrowBackIcon size={20} color={theme.color.content.primary} />
                <NText variant="labelSmallDefault" tone="secondary">Home</NText>
              </Pressable>
            )}
            <NText variant="titleMedium" style={{ marginBottom: 2 } as any}>Emulator</NText>
            <NText variant="paragraphSmallDefault" tone="secondary">Use case prototypes with financial parameters</NText>
          </View>
          <Pressable
            onPress={() => onAdvancedSettings?.()}
            hitSlop={12}
            style={{
              width: 36, height: 36, borderRadius: theme.radius.full,
              backgroundColor: theme.color.background.primary,
              alignItems: 'center', justifyContent: 'center',
              marginTop: onBack ? 36 : 0,
            }}
          >
            <SettingsIcon size={16} color={theme.color.content.secondary} />
          </Pressable>
        </View>

        {/* Tier 1 — Low emphasis: Theme + Country (inline chips with indicators) */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Pressable
            onPress={() => setThemeSheetOpen(true)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radius.full,
              backgroundColor: 'transparent',
              borderWidth: 1, borderColor: theme.color.border.secondary,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: accentColor }} />
            {mode === 'light'
              ? <SunIcon size={12} color={theme.color.content.secondary} />
              : <MoonIcon size={12} color={theme.color.content.secondary} />
            }
            <NText variant="label2XSmallDefault" tone="secondary">{segLabel}</NText>
          </Pressable>
          <Pressable
            onPress={() => setCountrySheetOpen(true)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radius.full,
              backgroundColor: 'transparent',
              borderWidth: 1, borderColor: theme.color.border.secondary,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 14 }}>{LOCALE_FLAGS[locale]}</Text>
            <NText variant="label2XSmallDefault" tone="secondary">{LOCALE_NAMES[locale]}</NText>
          </Pressable>
        </View>

        {/* Tier 2 — Medium emphasis: Product Line */}
        <Animated.View style={{ opacity: contentFade, marginBottom: 20 }}>
          <Pressable
            onPress={() => setProductLineSheetOpen(true)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 12,
              padding: 14, borderRadius: theme.radius.lg,
              backgroundColor: theme.color.background.primary,
              borderWidth: 1, borderColor: theme.color.border.secondary,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ width: 28, height: 28, borderRadius: theme.radius.md, backgroundColor: theme.color.surface.accentSubtle, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor }} />
            </View>
            <View style={{ flex: 1 }}>
              <NText variant="label2XSmallDefault" tone="secondary">Product Line</NText>
              <NText variant="labelSmallStrong">{selectedPL?.name ?? 'Select'}</NText>
            </View>
            <ExpandMoreIcon size={16} color={theme.color.content.secondary} />
          </Pressable>
        </Animated.View>

        {/* Tier 3 — High emphasis: Use Case (hero) */}
        <Animated.View style={{ opacity: contentFade, marginBottom: 24 }}>
          <Pressable
            onPress={() => setUseCaseSheetOpen(true)}
            style={({ pressed }) => ({
              borderRadius: theme.radius.xl,
              backgroundColor: theme.color.background.primary,
              borderWidth: selectedUC ? 2 : 1,
              borderColor: selectedUC ? theme.color.main : theme.color.border.secondary,
              overflow: 'hidden',
              opacity: pressed ? 0.92 : 1,
              ...theme.elevation.level1, shadowColor: theme.color.content.primary,
            })}
          >
            {selectedUC && <View style={{ height: 3, backgroundColor: theme.color.main }} />}
            <View style={{ padding: 20 }}>
              {selectedUC ? (
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <NText variant="label2XSmallStrong" style={{ color: theme.color.main, textTransform: 'uppercase', letterSpacing: 0.8 } as any}>
                      Product Flow
                    </NText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <NText variant="label2XSmallDefault" color={theme.color.main}>Change</NText>
                      <ExpandMoreIcon size={12} color={theme.color.main} />
                    </View>
                  </View>
                  <NText variant="titleSmall" style={{ marginTop: 2 } as any}>{selectedUC.name}</NText>
                  <NText variant="paragraphSmallDefault" tone="secondary" numberOfLines={2} style={{ marginTop: 2 } as any}>
                    {selectedUC.description}
                  </NText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Badge label={selectedPL?.name ?? ''} color="accent" />
                    <Badge label={LOCALE_SHORT[locale]} color="neutral" />
                    <Badge label={activeUseCase?.flowType === 'both' ? 'Flow A + B' : `Flow ${activeUseCase?.flowType ?? '—'}`} color="neutral" />
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <View style={{ width: 48, height: 48, borderRadius: theme.radius.full, backgroundColor: theme.color.surface.accentSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <UnfoldMoreIcon size={22} color={theme.color.main} />
                  </View>
                  <NText variant="subtitleSmallStrong" tone="secondary">Select a Use Case</NText>
                  <NText variant="label2XSmallDefault" tone="secondary" style={{ marginTop: 4, textAlign: 'center' } as any}>Each use case maps to a product context{'\n'}with its own financial rules</NText>
                </View>
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Tier 4 — Medium emphasis: Building Blocks + NuDS Check (consistent pair) */}
        <View style={{ gap: 10, marginBottom: 12 }}>
          <Pressable
            onPress={onBuildingBlocks}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 14,
              padding: 16, borderRadius: theme.radius.lg,
              backgroundColor: theme.color.background.primary,
              borderWidth: 1, borderColor: theme.color.border.secondary,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: theme.color.surface.accentSubtle,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <ShapesBoxIcon size={18} color={theme.color.main} />
            </View>
            <View style={{ flex: 1 }}>
              <NText variant="labelSmallStrong">UI Building Blocks</NText>
              <NText variant="label2XSmallDefault" tone="secondary">
                {SCREEN_BLOCK_ORDER.filter((k) => READY_SCREENS.has(k)).length} of {SCREEN_BLOCK_ORDER.length} screens ready
              </NText>
            </View>
            <ArrowRightIcon size={14} color={theme.color.content.secondary} />
          </Pressable>

          {onNuDSCheck && (
            <Pressable
              onPress={onNuDSCheck}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 14,
                padding: 16, borderRadius: theme.radius.lg,
                backgroundColor: theme.color.background.primary,
                borderWidth: 1, borderColor: theme.color.border.secondary,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: theme.color.surface.accentSubtle,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheckIcon size={18} color={theme.color.main} />
              </View>
              <View style={{ flex: 1 }}>
                <NText variant="labelSmallStrong">NuDS Component Check</NText>
                <NText variant="label2XSmallDefault" tone="secondary">Design System tokens & components</NText>
              </View>
              <ArrowRightIcon size={14} color={theme.color.content.secondary} />
            </Pressable>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer: Start Flow */}
      <View style={[es.footer, { borderTopColor: theme.color.border.secondary, backgroundColor: theme.color.background.secondary }]}>
        <Pressable onPress={hasReady ? handleStartFlow : undefined} disabled={!hasReady}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 9999, backgroundColor: hasReady ? theme.color.main : withAlpha(theme.color.main, 0.35), transform: [{ scale: pressed && hasReady ? 0.97 : 1 }] })}>
          <ArrowRightIcon size={18} color={theme.color.content.main} />
          <NText variant="subtitleSmallStrong" color={theme.color.content.main}>Start Flow</NText>
        </Pressable>
      </View>

      {/* Theme BottomSheet */}
      <BottomSheet
        visible={themeSheetOpen}
        onClose={() => setThemeSheetOpen(false)}
        title="Theme"
        showHandle
        show1stAction={false}
      >
        <ThemePanelContent theme={theme} />
      </BottomSheet>

      {/* Country / Language BottomSheet */}
      <BottomSheet
        visible={countrySheetOpen}
        onClose={() => setCountrySheetOpen(false)}
        title="Country / Language"
        showHandle
        show1stAction={false}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
          {SUPPORTED_LOCALES.map((loc, i) => {
            const on = loc === locale;
            return (
              <Pressable
                key={loc}
                onPress={() => {
                  switchLocale(loc);
                  setCountrySheetOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: on ? withAlpha(theme.color.main, 0.06) : 'transparent',
                  marginBottom: 4,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontSize: 22 }}>{LOCALE_FLAGS[loc]}</Text>
                <View style={{ flex: 1 }}>
                  <NText variant="labelSmallStrong" color={on ? theme.color.main : undefined}>{LOCALE_NAMES[loc]}</NText>
                  <NText variant="label2XSmallDefault" tone="secondary">{loc}</NText>
                </View>
                {on && <CheckmarkIcon size={18} color={theme.color.main} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      {/* Product Line BottomSheet */}
      <BottomSheet
        visible={productLineSheetOpen}
        onClose={() => setProductLineSheetOpen(false)}
        title="Product Line"
        showHandle
        show1stAction={false}
      >
        <View style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
          {productLines.map((pl, i) => {
            const on = pl.id === productLineId;
            return (
              <Pressable
                key={pl.id}
                onPress={() => {
                  handlePLChange(pl.id);
                  setProductLineSheetOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  paddingVertical: 16, paddingHorizontal: 20,
                  backgroundColor: on ? theme.color.surface.accentSubtle : (pressed ? theme.color.background.secondaryFeedback : 'transparent'),
                })}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: theme.radius.md,
                  backgroundColor: on ? theme.color.surface.accent : theme.color.background.secondary,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: on ? theme.color.main : theme.color.content.secondary, opacity: on ? 1 : 0.3 }} />
                </View>
                <View style={{ flex: 1 }}>
                  <NText variant="labelSmallStrong" color={on ? theme.color.main : undefined}>{pl.name}</NText>
                  {pl.description ? (
                    <NText variant="label2XSmallDefault" tone="secondary" numberOfLines={1} style={{ marginTop: 2 } as any}>{pl.description}</NText>
                  ) : null}
                </View>
                {on && <CheckmarkIcon size={18} color={theme.color.main} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      {/* Use Case BottomSheet */}
      <BottomSheet
        visible={useCaseSheetOpen}
        onClose={() => setUseCaseSheetOpen(false)}
        title="Use Case"
        showHandle
        show1stAction={false}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 }}>
          {useCases.map((uc, i) => {
            const on = uc.id === useCaseId;
            return (
              <Pressable
                key={uc.id}
                onPress={() => {
                  setUseCase(uc.id);
                  setUseCaseSheetOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: on ? withAlpha(theme.color.main, 0.06) : 'transparent',
                  marginBottom: 4,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <NText variant="labelSmallStrong" color={on ? theme.color.main : undefined}>{uc.name}</NText>
                  {uc.description ? (
                    <NText variant="label2XSmallDefault" tone="secondary" numberOfLines={2}>{uc.description}</NText>
                  ) : null}
                </View>
                {on && <CheckmarkIcon size={18} color={theme.color.main} />}
              </Pressable>
            );
          })}
          {useCases.length === 0 && (
            <NText variant="paragraphSmallDefault" tone="secondary" style={{ padding: 12 } as any}>No use cases available for this product line.</NText>
          )}
        </View>
      </BottomSheet>

      {/* Variant BottomSheet */}
      <VariantBottomSheet
        screenKey={variantSheetKey}
        visible={variantSheetKey !== null}
        onClose={() => setVariantSheetKey(null)}
        onSelect={handleVariantSelect}
        theme={theme}
      />
    </View>
  );
}

const es = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 44 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1 },
});
