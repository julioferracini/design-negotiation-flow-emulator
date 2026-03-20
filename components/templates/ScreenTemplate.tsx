import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  Box,
  ArrowBackIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';

type Props = {
  statusBarStyle?: 'light' | 'dark';
  headerTitle?: string;
  backLabel?: string;
  onBack?: () => void;
  scrollable?: boolean;
  contentPaddingHorizontal?: number;
  children: React.ReactNode;
};

export default function ScreenTemplate({
  statusBarStyle = 'dark',
  headerTitle,
  backLabel = 'Back',
  onBack,
  scrollable = true,
  contentPaddingHorizontal = 20,
  children,
}: Props) {
  const theme = useNuDSTheme();
  const showHeader = !!(headerTitle || onBack);

  const content = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingHorizontal: contentPaddingHorizontal }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, { paddingHorizontal: contentPaddingHorizontal }]}>
      {children}
    </View>
  );

  return (
    <Box surface="screen" style={styles.screen}>
      <StatusBar style={statusBarStyle} />
      {showHeader && (
        <TopBar
          title={headerTitle}
          variant="default"
          leading={onBack ? <ArrowBackIcon size={24} color={theme.color.content.primary} /> : undefined}
          onPressLeading={onBack}
          leadingAccessibilityLabel={backLabel}
        />
      )}
      {content}
    </Box>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 34,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  staticContent: { flex: 1 },
});
