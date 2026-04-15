import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  NText,
  Button,
  Box,
  ArrowBackIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';

export default function TermsScreen({
  locale = 'pt-BR',
  onBack,
  onConfirm,
}: {
  locale?: Locale;
  onBack?: () => void;
  onConfirm?: () => void;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const tr = t.terms;

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />
      <TopBar
        title={tr.title}
        variant="default"
        showStatusBar={false}
        leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
        onPressLeading={onBack}
        show1stAction={false}
        show2ndAction={false}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <NText variant="titleMedium" style={{ marginBottom: theme.spacing[2] }}>
          {tr.heading}
        </NText>
        <NText variant="subtitleMediumDefault" tone="secondary" style={{ marginBottom: theme.spacing[6] }}>
          {tr.bodySubtitle}
        </NText>

        {tr.paragraphs.map((para, i) => (
          <NText
            key={i}
            variant={para.bold ? 'labelMediumStrong' : 'subtitleSmallDefault'}
            tone={para.bold ? undefined : 'secondary'}
            style={{ marginBottom: para.bold ? theme.spacing[3] : theme.spacing[2] }}
          >
            {para.text}
          </NText>
        ))}

        <View style={{ height: 40 }} />

        <NText variant="labelXSmallDefault" tone="secondary" style={{ textAlign: 'center' }}>
          {tr.readAll}
        </NText>
        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={[s.bottomBar, { backgroundColor: `${theme.color.background.primary}F0` }]}>
        <Button
          label={tr.confirmButton}
          variant="primary"
          expanded
          disabled={!hasScrolledToBottom}
          onPress={onConfirm}
        />
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
});
