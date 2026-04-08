import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Rect, Line, Path, Circle } from 'react-native-svg';
import {
  NText,
  Box,
  Badge,
  ArrowRightIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useThemeMode } from '../config/ThemeModeContext';

type SectionId = 'emulator' | 'glossary' | 'flow-management' | 'analytics';

interface Props {
  onNavigate: (section: SectionId) => void;
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

const FEATURES: {
  id: SectionId;
  title: string;
  subtitle: string;
  ready: boolean;
  icon: 'monitor' | 'book' | 'git' | 'chart';
}[] = [
  {
    id: 'emulator',
    icon: 'monitor',
    title: 'Emulator',
    subtitle: 'Browse use cases with navigable prototypes and configurable parameters.',
    ready: true,
  },
  {
    id: 'glossary',
    icon: 'book',
    title: 'Glossary',
    subtitle: 'Reference of business terms, domain definitions, and regulatory concepts.',
    ready: true,
  },
  {
    id: 'flow-management',
    icon: 'git',
    title: 'Flow Management',
    subtitle: 'Product versions, active experiments, and admin controls.',
    ready: false,
  },
  {
    id: 'analytics',
    icon: 'chart',
    title: 'Analytics',
    subtitle: 'Conversion funnels, experiment outcomes, and real-time dashboards.',
    ready: false,
  },
];

function FeatureIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const sw = 1.6;
  switch (name) {
    case 'monitor':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <Line x1="8" y1="21" x2="16" y2="21" />
          <Line x1="12" y1="17" x2="12" y2="21" />
        </Svg>
      );
    case 'book':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </Svg>
      );
    case 'git':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Line x1="6" y1="3" x2="6" y2="15" />
          <Circle cx="18" cy="6" r="3" />
          <Circle cx="6" cy="18" r="3" />
          <Path d="M18 9a9 9 0 0 1-9 9" />
        </Svg>
      );
    case 'chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Line x1="18" y1="20" x2="18" y2="10" />
          <Line x1="12" y1="20" x2="12" y2="4" />
          <Line x1="6" y1="20" x2="6" y2="14" />
        </Svg>
      );
    default:
      return null;
  }
}

export default function HomeScreen({ onNavigate }: Props) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  const accent = theme.color.main;

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style={isLight ? 'dark' : 'light'} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge */}
        <View style={[s.badge, { backgroundColor: accent }]}>
          <Text style={s.badgeText}>Product Platform</Text>
        </View>

        {/* Hero */}
        <NText variant="titleLarge" style={s.title as any}>
          Design, simulate,{'\n'}and ship negotiation{'\n'}flows
        </NText>
        <NText variant="paragraphSmallDefault" tone="secondary" style={s.subtitle as any}>
          Explore prototypes, manage experiments, and track product performance.
        </NText>

        {/* Cards list */}
        <View style={s.list}>
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.id}
              feature={f}
              accent={accent}
              theme={theme}
              isLight={isLight}
              onPress={() => onNavigate(f.id)}
            />
          ))}
        </View>
      </ScrollView>
    </Box>
  );
}

function FeatureCard({
  feature,
  accent,
  theme,
  isLight,
  onPress,
}: {
  feature: (typeof FEATURES)[number];
  accent: string;
  theme: ReturnType<typeof useNuDSTheme>;
  isLight: boolean;
  onPress: () => void;
}) {
  const cardBg = isLight ? '#FFFFFF' : '#151515';
  const borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const iconBg = feature.ready
    ? withAlpha(accent, 0.08)
    : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const iconColor = feature.ready ? accent : theme.color.content.secondary;

  return (
    <Pressable
      onPress={feature.ready ? onPress : undefined}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: cardBg,
          borderColor,
          opacity: feature.ready ? (pressed ? 0.85 : 1) : 0.55,
          transform: [{ scale: pressed && feature.ready ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Icon */}
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <FeatureIcon name={feature.icon} size={20} color={iconColor} />
      </View>

      {/* Text block */}
      <View style={s.cardContent}>
        <View style={s.cardTitleRow}>
          <NText variant="subtitleSmallStrong" style={{ flexShrink: 1 } as any}>
            {feature.title}
          </NText>
          <Badge
            label={feature.ready ? 'Available' : 'Soon'}
            color={feature.ready ? 'accent' : 'neutral'}
          />
        </View>
        <NText
          variant="paragraphSmallDefault"
          tone="secondary"
          numberOfLines={2}
          style={s.cardSubtitle as any}
        >
          {feature.subtitle}
        </NText>
      </View>

      {/* Arrow */}
      {feature.ready && (
        <ArrowRightIcon size={16} color={accent} />
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
  },
  scroll: { flex: 1 },
  scrollInner: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 60,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: 10,
    letterSpacing: -1,
  },
  subtitle: {
    marginBottom: 32,
    maxWidth: 300,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardSubtitle: {
    lineHeight: 18,
  },
});
