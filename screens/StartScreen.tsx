import React, { useState, useRef, useCallback } from 'react';
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
  ListRow,
  SectionTitle,
  Box,
  SparkleIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation, SUPPORTED_LOCALES, LOCALE_FLAGS } from '../i18n';
import type { Locale } from '../i18n';
import type { ScreenEntry, UseCaseEntry } from '../i18n/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LOCALE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português',
  'es-MX': 'Español (MX)',
  'es-CO': 'Español (CO)',
  'en-US': 'English',
};

/* ─────────── Language Tabs (custom — no NuDS equivalent) ─────────── */
const TAB_PAD = 4;

function LanguageTabs({ active, onSelect }: { active: Locale; onSelect: (locale: Locale) => void }) {
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
    <View style={[styles.tabOuter, { backgroundColor: theme.color.background.secondary }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View style={[styles.tabIndicator, {
          width: tabW,
          transform: [{ translateX: indicatorX }],
          backgroundColor: theme.color.background.primary,
          ...theme.elevation.level1,
          shadowColor: theme.color.content.primary,
        }]} />
      )}
      {SUPPORTED_LOCALES.map((locale) => (
        <TouchableOpacity key={locale} style={styles.tab} onPress={() => onSelect(locale)} activeOpacity={0.7}>
          <NText variant="paragraphMediumDefault">{LOCALE_FLAGS[locale]}</NText>
          <NText variant="labelSmallStrong" color={locale === active ? theme.color.main : theme.color.content.secondary}>
            {LOCALE_NAMES[locale]}
          </NText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ─────────── Collapsible Section (custom — animated) ─────────── */
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
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.sectionHeaderLeft}>
          <SectionTitle title={title} trailing={<Badge label={String(count)} color="neutral" />} />
        </View>
        <Animated.View style={{ transform: [{ rotateZ }] }}>
          <NText variant="titleSmall" tone="secondary">›</NText>
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <Box surface="primary" style={[styles.sectionBody, { borderColor: theme.color.border.primary, ...theme.elevation.level1, shadowColor: theme.color.content.primary }]}>
          {children}
        </Box>
      )}
    </View>
  );
}

/* ─────────── Main Screen ─────────── */
type Props = {
  onNavigate: (screenId: string, locale: Locale) => void;
  onNuDSCheck?: () => void;
};

export default function StartScreen({ onNavigate, onNuDSCheck }: Props) {
  const theme = useNuDSTheme();
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const t = useTranslation(locale);
  const p = t.picker;
  const contentFade = useRef(new Animated.Value(1)).current;

  const switchLocale = useCallback((next: Locale) => {
    if (next === locale) return;
    Animated.timing(contentFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setLocale(next);
      Animated.timing(contentFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [locale, contentFade]);

  return (
    <Box surface="screen" style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <NText variant="titleMedium" style={styles.title}>Hiring / Negotiation flows</NText>
        <LanguageTabs active={locale} onSelect={switchLocale} />
      </View>

      <Animated.View style={[styles.contentWrap, { opacity: contentFade }]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
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

          <View style={{ height: 16 }} />

          <CollapsibleSection title={p.browseByScreen} count={p.screens.length} defaultOpen={false}>
            {p.screens.map((item: ScreenEntry, i: number) => {
              const enabled = item.status === 'done';
              return (
                <ListRow
                  key={item.id}
                  label={item.label}
                  description={item.description}
                  showChevron={enabled}
                  trailing={!enabled ? <Badge label={p.soonLabel} color="neutral" /> : undefined}
                  showDivider={i < p.screens.length - 1}
                  disabled={!enabled}
                  onPress={enabled ? () => onNavigate(item.id, locale) : undefined}
                />
              );
            })}
          </CollapsibleSection>

          <CollapsibleSection title={p.browseByUseCase} count={p.useCases.length} defaultOpen={false}>
            {p.useCases.map((item: UseCaseEntry, i: number) => {
              const enabled = item.status === 'done';
              return (
                <ListRow
                  key={item.id}
                  label={item.label}
                  showChevron={enabled}
                  trailing={!enabled ? <Badge label={p.soonLabel} color="neutral" /> : undefined}
                  showDivider={i < p.useCases.length - 1}
                  disabled={!enabled}
                  onPress={enabled ? () => onNavigate(item.id, locale) : undefined}
                />
              );
            })}
          </CollapsibleSection>
        </ScrollView>
      </Animated.View>
    </Box>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 44 },
  header: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 },
  title: { marginBottom: 28 },
  tabOuter: { flexDirection: 'row', borderRadius: 28, padding: TAB_PAD },
  tabIndicator: { position: 'absolute', top: TAB_PAD, bottom: TAB_PAD, left: TAB_PAD, borderRadius: 24 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, zIndex: 1, gap: 6 },
  contentWrap: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4 },
  sectionHeaderLeft: { flex: 1 },
  sectionBody: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginTop: 8 },
});
