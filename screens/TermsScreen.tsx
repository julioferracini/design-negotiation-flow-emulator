import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  NText,
  Button,
  ButtonLink,
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
  const btnOpacity = useRef(new Animated.Value(0)).current;

  const handleScroll = (e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
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
        <NText variant="subtitleSmallDefault" tone="secondary" style={{ marginBottom: 20 }}>
          {tr.subtitle}
        </NText>

        <NText variant="labelSmallStrong" style={{ marginBottom: 12 }}>
          {tr.heading}
        </NText>
        <NText variant="paragraphSmallDefault" tone="secondary" style={{ marginBottom: 20 }}>
          {tr.bodySubtitle}
        </NText>

        {tr.paragraphs.map((para, i) => (
          <NText
            key={i}
            variant={para.bold ? 'labelSmallStrong' : 'paragraphSmallDefault'}
            tone={para.bold ? undefined : 'secondary'}
            style={{ marginBottom: para.bold ? 12 : 8 }}
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
        <Animated.View style={{ opacity: hasScrolledToBottom ? 1 : btnOpacity }}>
          <Button
            label={tr.confirmButton}
            variant="primary"
            expanded
            onPress={onConfirm}
          />
        </Animated.View>
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <ButtonLink label={tr.decline} onPress={onBack} />
        </View>
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
