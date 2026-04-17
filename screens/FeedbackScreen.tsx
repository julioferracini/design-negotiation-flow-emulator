import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NText,
  Button,
  ButtonLink,
  Box,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';

export default function FeedbackScreen({
  locale = 'pt-BR',
  onMakePayment,
  onDoLater,
}: {
  locale?: Locale;
  onMakePayment?: () => void;
  onDoLater?: () => void;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const fb = t.feedback;

  const [selected, setSelected] = useState<'good' | 'bad' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function withAlpha(hex: string, a: number) {
    if (hex.startsWith('#') && hex.length === 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
    return hex;
  }

  const handleSubmit = () => setSubmitted(true);

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />

      <View style={s.body}>
        {!submitted ? (
          <>
            <View style={{ flex: 1 }} />
            <NText variant="titleLarge" style={{ textAlign: 'center', marginBottom: 4 }}>
              {fb.title}
            </NText>
            <NText variant="paragraphSmallDefault" tone="secondary" style={{ textAlign: 'center', marginBottom: 36 }}>
              {fb.subtitle}
            </NText>

            <NText variant="labelSmallStrong" style={{ textAlign: 'center', marginBottom: 20 }}>
              {fb.question}
            </NText>

            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
              {(['good', 'bad'] as const).map((opt) => {
                const on = selected === opt;
                const label = opt === 'good' ? fb.optionGood : fb.optionBad;
                const emoji = opt === 'good' ? '😊' : '😕';
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setSelected(opt)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 20,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: on ? 2 : 1,
                      borderColor: on ? theme.color.main : theme.color.border.primary,
                      backgroundColor: on
                        ? withAlpha(theme.color.main, 0.06)
                        : pressed
                          ? theme.color.background.secondaryFeedback
                          : theme.color.background.primary,
                    })}
                  >
                    <NText variant="titleMedium" style={{ marginBottom: 4 }}>{emoji}</NText>
                    <NText variant="labelSmallStrong" color={on ? theme.color.main : undefined}>
                      {label}
                    </NText>
                  </Pressable>
                );
              })}
            </View>

            <Button
              label={fb.submit}
              variant="primary"
              expanded
              onPress={handleSubmit}
            />
            <View style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <View style={{ flex: 1 }} />
            <NText variant="titleLarge" style={{ textAlign: 'center', marginBottom: 4 }}>
              {fb.headline1}
            </NText>
            <NText variant="titleLarge" color={theme.color.main} style={{ textAlign: 'center', marginBottom: 20 }}>
              {fb.headline2}
            </NText>
            <NText variant="paragraphSmallDefault" tone="secondary" style={{ textAlign: 'center', marginBottom: 4 }}>
              {fb.body1}
            </NText>
            <NText variant="paragraphSmallDefault" tone="secondary" style={{ textAlign: 'center', marginBottom: 40 }}>
              {fb.body2}
            </NText>
            <Button
              label={fb.makePayment}
              variant="primary"
              expanded
              onPress={onMakePayment}
            />
            <View style={{ height: 12 }} />
            <View style={{ alignItems: 'center' }}>
              <ButtonLink label={fb.doLater} onPress={onDoLater} />
            </View>
            <View style={{ flex: 1 }} />
          </>
        )}
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  body: { flex: 1, paddingHorizontal: 24 },
});
