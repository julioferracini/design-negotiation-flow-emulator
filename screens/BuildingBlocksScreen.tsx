import React, { useState, useCallback } from 'react';
import { View, ScrollView, Platform, Pressable, Text, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar, NText, Badge, BottomSheet, Box,
  ArrowBackIcon, SettingsIcon, useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useThemeMode } from '../config/ThemeModeContext';
import { useEmulatorConfig } from '../config/EmulatorConfigContext';
import type { Locale } from '../i18n';
import type { ScreenVisibility } from '../shared/types';
import {
  SCREEN_BLOCK_ORDER, READY_SCREENS, SCREEN_BLOCK_META,
  SCREEN_CONTENT_VARIANTS, PACKS,
} from '../shared/data/screenVariants';
import type { ScreenContentVariant } from '../shared/data/screenVariants';

type ScreenKey = keyof ScreenVisibility;
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

const SCREEN_NAV_MAP: Record<string, string> = {
  offerHub: 'offerHub', eligibility: 'eligibility', suggested: 'suggestedConditions',
  simulation: 'simulation', summary: 'summary', inputValue: 'inputValue',
  dueDate: 'dueDate', terms: 'terms', pin: 'pin', loading: 'loading', feedback: 'feedback',
};

type Props = {
  onNavigate: (screenId: string, locale: Locale, variant?: string) => void;
  onBack: () => void;
};

function VariantBottomSheet({ screenKey, visible, onClose, onSelect, theme }: {
  screenKey: ScreenKey | null;
  visible: boolean;
  onClose: () => void;
  onSelect: (variant: ScreenContentVariant) => void;
  theme: Theme;
}) {
  const { mode } = useThemeMode();
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
                  backgroundColor: item.isDefault
                    ? withAlpha(theme.color.main, 0.04)
                    : theme.color.background.secondary,
                  opacity: ready ? (pressed ? 0.8 : 1) : 0.5,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <NText variant="labelSmallStrong">{item.label}</NText>
                  {item.isDefault && <Badge label="Default" color="accent" />}
                  <Text style={{
                    fontSize: 9, fontWeight: '600',
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    color: theme.color.content.secondary,
                  }}>
                    {item.version}
                  </Text>
                </View>
                <NText variant="paragraphSmallDefault" tone="secondary">
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

export default function BuildingBlocksScreen({ onNavigate, onBack }: Props) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const { locale } = useEmulatorConfig();

  const [variantSheetKey, setVariantSheetKey] = useState<ScreenKey | null>(null);

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

  const readyCount = SCREEN_BLOCK_ORDER.filter((k) => READY_SCREENS.has(k)).length;

  return (
    <Box surface="screen" style={{ flex: 1 }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <TopBar
        title="UI Building Blocks"
        variant="default"
        leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
        onPressLeading={onBack}
        show1stAction={false}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.color.background.secondary }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <NText variant="labelSmallStrong">
            {SCREEN_BLOCK_ORDER.length} screens
          </NText>
          <Badge label={`${readyCount} ready`} color="accent" />
        </View>

        {PACKS.map((pack) => {
          const packScreens = pack.screens.filter(
            (k) => SCREEN_BLOCK_ORDER.includes(k as ScreenKey),
          ) as ScreenKey[];
          const packReady = packScreens.filter((k) => READY_SCREENS.has(k)).length;

          return (
            <View
              key={pack.id}
              style={{
                borderRadius: theme.radius.lg,
                backgroundColor: theme.color.background.primary,
                overflow: 'hidden',
                marginBottom: 16,
                ...theme.elevation.level1,
                shadowColor: theme.color.content.primary,
              }}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
              }}>
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: theme.color.main, opacity: 0.6,
                }} />
                <NText variant="label2XSmallStrong" color={theme.color.main}>
                  {pack.title.toUpperCase()}
                </NText>
                <NText variant="label2XSmallDefault" tone="secondary">
                  {packReady}/{packScreens.length}
                </NText>
              </View>

              {packScreens.map((key, i) => {
                const meta = SCREEN_BLOCK_META[key];
                const ready = READY_SCREENS.has(key);
                const variantCount = SCREEN_CONTENT_VARIANTS[key]?.length ?? 0;
                const isLast = i === packScreens.length - 1;

                return (
                  <View
                    key={key}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: theme.color.border.secondary,
                      opacity: ready ? 1 : 0.45,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <NText variant="labelSmallStrong">{meta.title}</NText>

                        {ready && variantCount > 1 && (
                          <View style={{
                            backgroundColor: withAlpha(theme.color.main, 0.08),
                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                            flexDirection: 'row', alignItems: 'center', gap: 3,
                          }}>
                            <SettingsIcon size={8} color={theme.color.main} />
                            <Text style={{ fontSize: 9, fontWeight: '600', color: theme.color.main }}>
                              {variantCount}
                            </Text>
                          </View>
                        )}

                        {!ready && <Badge label="Soon" color="neutral" />}
                      </View>
                      <NText variant="labelSmallDefault" tone="secondary">
                        {meta.description}
                      </NText>
                    </View>

                    {ready && (
                      <Pressable
                        onPress={() => handlePreview(key)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                          backgroundColor: withAlpha(theme.color.main, pressed ? 0.14 : 0.08),
                        })}
                      >
                        <NText variant="labelSmallStrong" color={theme.color.main}>Preview</NText>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

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
