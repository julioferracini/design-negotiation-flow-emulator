import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { NText, Box, useNuDSTheme } from '@nubank/nuds-vibecode-react-native';
import { useThemeMode } from '../config/ThemeModeContext';
import {
  ALLOWED_PASSWORD_HASHES,
  hashPassword,
  shouldBypassGate,
  persistAccess,
  hasPersistedAccess,
  getLockoutState,
  getRemainingLockMs,
  registerFailedAttempt,
  resetLockout,
} from '../config/accessControl';

interface Props {
  children: React.ReactNode;
}

function LockIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

function ShieldIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function ClockIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}

export default function PasswordGate({ children }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [locked, setLocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  const accent = theme.color.main;

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLocked(true);
    timerRef.current = setInterval(() => {
      const ms = getRemainingLockMs();
      if (ms <= 0) {
        setLocked(false);
        setRemainingMs(0);
        setError(false);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setRemainingMs(ms);
      }
    }, 250);
  }, []);

  useEffect(() => {
    if (shouldBypassGate() || hasPersistedAccess()) {
      setAuthenticated(true);
    } else {
      const ms = getRemainingLockMs();
      if (ms > 0) {
        setRemainingMs(ms);
        startCountdown();
      }
      const lockState = getLockoutState();
      setAttemptsLeft(3 - lockState.failedAttempts);
    }
    setChecking(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!password.trim() || locked) return;

    const hash = await hashPassword(password.trim());
    if (ALLOWED_PASSWORD_HASHES.includes(hash)) {
      resetLockout();
      persistAccess();
      setAuthenticated(true);
    } else {
      const lockState = registerFailedAttempt();
      const remaining = 3 - lockState.failedAttempts;
      setAttemptsLeft(remaining < 0 ? 0 : remaining);
      triggerShake();

      if (lockState.lockedUntil && lockState.lockedUntil > Date.now()) {
        const ms = lockState.lockedUntil - Date.now();
        setRemainingMs(ms);
        const isHardBan = ms > 60 * 60 * 1000;
        setErrorMsg(
          isHardBan
            ? 'Too many attempts. Access blocked for 24 hours.'
            : 'Too many attempts. Please wait.',
        );
        setError(true);
        startCountdown();
      } else {
        setErrorMsg(
          remaining > 0
            ? `Invalid password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Invalid password.',
        );
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
      setPassword('');
    }
  };

  if (checking) return null;
  if (authenticated) return <>{children}</>;

  const cardBg = isLight ? '#FFFFFF' : '#1A1A1A';
  const screenBg = isLight ? '#F4F1F7' : '#0D0D0D';
  const inputBg = locked
    ? (isLight ? '#F0EDF2' : '#1E1E1E')
    : (isLight ? '#F7F5F9' : '#252525');
  const inputBorder = error
    ? '#D4183D'
    : locked
    ? (isLight ? 'rgba(31, 2, 48, 0.06)' : 'rgba(255, 255, 255, 0.06)')
    : isLight
    ? 'rgba(31, 2, 48, 0.10)'
    : 'rgba(255, 255, 255, 0.10)';
  const placeholderColor = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const textColor = isLight ? '#1f0230' : '#FFFFFF';
  const isHardBan = remainingMs > 60 * 60 * 1000;
  const canSubmit = password.trim().length > 0 && !locked;

  return (
    <Box surface="screen" style={[s.screen, { backgroundColor: screenBg }]}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={s.flex} onPress={Keyboard.dismiss}>
          <Animated.View style={[s.center, { opacity: fadeAnim }]}>
            {/* Icon — shield or clock when locked */}
            <View
              style={[
                s.iconCircle,
                {
                  backgroundColor: locked
                    ? (isLight ? 'rgba(212, 24, 61, 0.08)' : 'rgba(212, 24, 61, 0.15)')
                    : `${accent}14`,
                },
              ]}
            >
              {locked ? (
                <ClockIcon size={32} color="#D4183D" />
              ) : (
                <ShieldIcon size={32} color={accent} />
              )}
            </View>

            {/* Title */}
            <NText variant="titleSmall" style={s.title as any}>
              {locked ? 'Temporarily Blocked' : 'Restricted Access'}
            </NText>
            <NText
              variant="paragraphSmallDefault"
              tone="secondary"
              style={s.subtitle as any}
            >
              {locked
                ? isHardBan
                  ? 'Too many failed attempts.\nAccess has been blocked for 24 hours.'
                  : 'Too many failed attempts.\nPlease wait before trying again.'
                : `Enter your access password to continue.\nContact us to request access.`}
            </NText>

            {/* Countdown timer when locked */}
            {locked && remainingMs > 0 && (
              <View style={s.countdownWrap}>
                <View style={[s.countdownPill, { backgroundColor: isLight ? 'rgba(212, 24, 61, 0.06)' : 'rgba(212, 24, 61, 0.12)' }]}>
                  <ClockIcon size={16} color="#D4183D" />
                  <NText variant="labelMediumStrong" style={{ color: '#D4183D', fontSize: 18, fontVariant: ['tabular-nums'] } as any}>
                    {formatCountdown(remainingMs)}
                  </NText>
                </View>
              </View>
            )}

            {/* Card */}
            <Animated.View
              style={[
                s.card,
                {
                  backgroundColor: cardBg,
                  borderColor: locked
                    ? (isLight ? 'rgba(212, 24, 61, 0.10)' : 'rgba(212, 24, 61, 0.15)')
                    : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'),
                  transform: [{ translateX: shakeAnim }],
                  opacity: locked ? 0.6 : 1,
                },
              ]}
            >
              {/* Input */}
              <View style={s.inputLabel}>
                <LockIcon size={14} color={isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'} />
                <NText variant="labelSmallStrong" style={{ fontSize: 12 } as any}>
                  Password
                </NText>
              </View>

              <View
                style={[
                  s.inputWrap,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error && !locked) setError(false);
                  }}
                  placeholder={locked ? 'Locked — please wait' : 'Enter password'}
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  editable={!locked}
                  style={[s.input, { color: locked ? placeholderColor : textColor }]}
                />
                {!locked && (
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={12}
                    style={s.eyeBtn}
                  >
                    <NText
                      variant="labelSmallDefault"
                      tone="secondary"
                      style={{ fontSize: 11 } as any}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </NText>
                  </Pressable>
                )}
              </View>

              {/* Error / info message */}
              {error && errorMsg.length > 0 && (
                <NText
                  variant="paragraphSmallDefault"
                  style={s.errorText as any}
                >
                  {errorMsg}
                </NText>
              )}

              {/* Submit button */}
              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  s.button,
                  {
                    backgroundColor: locked ? (isLight ? '#C7C7CC' : '#333333') : accent,
                    opacity: canSubmit ? (pressed ? 0.85 : 1) : 0.45,
                    transform: [{ scale: pressed && canSubmit ? 0.98 : 1 }],
                  },
                ]}
                disabled={!canSubmit}
              >
                <NText
                  variant="labelMediumStrong"
                  style={s.buttonText as any}
                >
                  {locked ? 'Locked' : 'Unlock'}
                </NText>
              </Pressable>
            </Animated.View>

            {/* Footer */}
            <NText
              variant="labelSmallDefault"
              tone="secondary"
              style={s.footer as any}
            >
              All rights reserved
            </NText>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    maxWidth: 280,
  },
  countdownWrap: {
    marginBottom: 20,
    alignItems: 'center',
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as object : {}),
  },
  eyeBtn: {
    paddingLeft: 10,
  },
  errorText: {
    color: '#D4183D',
    fontSize: 13,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  footer: {
    marginTop: 32,
    fontSize: 11,
    opacity: 0.5,
    textAlign: 'center',
  },
});
