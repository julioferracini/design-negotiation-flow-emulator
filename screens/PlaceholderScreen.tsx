import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Line, Path, Circle, Rect } from 'react-native-svg';
import {
  NText,
  Box,
  Badge,
  ArrowBackIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useThemeMode } from '../config/ThemeModeContext';

type IconName = 'book' | 'git' | 'chart';

interface Props {
  icon: IconName;
  title: string;
  subtitle: string;
  onBack: () => void;
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

function PlaceholderIcon({ name, size, color }: { name: IconName; size: number; color: string }) {
  const sw = 1.6;
  switch (name) {
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

export default function PlaceholderScreen({ icon, title, subtitle, onBack }: Props) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  const accent = theme.color.main;

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style={isLight ? 'dark' : 'light'} />

      {/* Top bar */}
      <View style={s.topBar}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ArrowBackIcon size={24} color={theme.color.content.primary} />
        </Pressable>
        <NText variant="subtitleSmallStrong">{title}</NText>
        <View style={{ width: 24 }} />
      </View>

      {/* Center content */}
      <View style={s.center}>
        <View style={[s.iconWrap, { backgroundColor: withAlpha(accent, 0.08) }]}>
          <PlaceholderIcon name={icon} size={36} color={accent} />
        </View>

        <NText variant="titleSmall" style={s.title as any}>
          {title}
        </NText>

        <NText
          variant="paragraphSmallDefault"
          tone="secondary"
          style={s.subtitle as any}
        >
          {subtitle}
        </NText>

        <Badge label="Coming soon" color="neutral" />
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
    marginTop: -60,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
