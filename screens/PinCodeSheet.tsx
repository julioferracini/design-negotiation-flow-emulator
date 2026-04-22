/**
 * PinCodeSheet — Expo Go BottomSheet with 4-digit PIN using NuDS PinCode.
 *
 * Pixel-perfect implementation of Figma [Magic] PIN Code (DND-2170).
 * Uses the official NuDS `PinCode` component (hidden TextInput drives the
 * device's native numeric keyboard automatically).
 *
 * Default PIN is 1234. On success → onSuccess(). On error → NuDS handles the
 * shake animation + haptic; after 1.2s we auto-clear.
 *
 * Dual-platform twin: web/src/screens/PinCodeSheet.tsx (Web).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  BottomSheet,
  PinCode,
  NText,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';

const DEFAULT_PIN = '1234';
const PIN_LENGTH = 4;

export interface PinCodeSheetProps {
  visible: boolean;
  locale?: Locale;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinCodeSheet({
  visible,
  locale = 'pt-BR',
  onClose,
  onSuccess,
}: PinCodeSheetProps) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const tr = t.pin;

  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleChange = useCallback(
    (next: string) => {
      // Error persists until the user retries — any new input dismisses it and
      // starts a fresh attempt (NuDS PinCode clears its text when value='' so
      // the next keystroke registers as a new digit).
      if (error) {
        setError(false);
        setValue(next);
        return;
      }
      setValue(next);
    },
    [error],
  );

  const handleComplete = useCallback(
    (entered: string) => {
      if (entered === DEFAULT_PIN) {
        setValue('');
        setError(false);
        onSuccess();
        return;
      }
      // Wrong PIN: flag error and clear the controlled value so the next
      // keystroke (via hidden TextInput) triggers onChange with the new digit.
      // The 4 dots stay red because NuDS PinCode renders `error` state for
      // every position regardless of value length.
      setError(true);
      setValue('');
    },
    [onSuccess],
  );

  useEffect(() => {
    if (!visible) {
      setValue('');
      setError(false);
    }
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title=""
      tone="default"
      showHandle={false}
      show1stAction={false}
      show2ndAction={false}
      leading={null}
      avoidKeyboard={false}
    >
      <View
        style={{
          paddingHorizontal: theme.spacing[5],
          paddingTop: theme.spacing[2],
          paddingBottom: theme.spacing[8],
          gap: theme.spacing[5],
        }}
      >
        <NText variant="titleMedium" tone="primary">
          {tr.title}
        </NText>

        <View style={{ alignItems: 'center', paddingTop: theme.spacing[4] }}>
          <PinCode
            value={value}
            onChange={handleChange}
            onComplete={handleComplete}
            length={PIN_LENGTH}
            error={error ? tr.error : false}
            autoFocus
          />
        </View>
      </View>
    </BottomSheet>
  );
}
