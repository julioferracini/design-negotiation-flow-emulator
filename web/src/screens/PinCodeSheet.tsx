/**
 * PinCodeSheet — Web BottomSheet with 4-digit PIN + numeric keypad.
 *
 * Pixel-perfect implementation of Figma [Magic] PIN Code (DND-2170):
 *   - nodes 10883:14728 (normal), 12266:10249 (filled), 12266:10428 (error)
 *
 * Default PIN is 1234. On success → onSuccess(). On error → shake + auto-clear.
 *
 * Dual-platform twin: screens/PinCodeSheet.tsx (Expo).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { NText } from '../nuds';
import type { NuDSWebTheme } from '../nuds';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import { PinCode, type PinCodeState } from '../components/PinCode';

const DEFAULT_PIN = '1234';
const PIN_LENGTH = 4;
const VALIDATE_DELAY_MS = 180;

export interface PinCodeSheetProps {
  visible: boolean;
  locale: Locale;
  onClose: () => void;
  onSuccess: () => void;
}

function CloseIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningCircleIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M8 4.5V8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.9" fill={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Numeric Keypad (iOS-style replica matching Figma keyboard-native)  */
/* ═══════════════════════════════════════════════════════════════════ */

type KeyDef =
  | { kind: 'digit'; digit: string; letters?: string }
  | { kind: 'symbols' }
  | { kind: 'backspace' };

const KEYPAD_LAYOUT: KeyDef[][] = [
  [
    { kind: 'digit', digit: '1' },
    { kind: 'digit', digit: '2', letters: 'ABC' },
    { kind: 'digit', digit: '3', letters: 'DEF' },
  ],
  [
    { kind: 'digit', digit: '4', letters: 'GHI' },
    { kind: 'digit', digit: '5', letters: 'JKL' },
    { kind: 'digit', digit: '6', letters: 'MNO' },
  ],
  [
    { kind: 'digit', digit: '7', letters: 'PQRS' },
    { kind: 'digit', digit: '8', letters: 'TUV' },
    { kind: 'digit', digit: '9', letters: 'WXYZ' },
  ],
  [
    { kind: 'symbols' },
    { kind: 'digit', digit: '0' },
    { kind: 'backspace' },
  ],
];

function SymbolsIcon({ color }: { color: string }) {
  // "+ * #" glyph row mirroring the iOS numeric keypad utility key.
  // Fill comes from `color` prop (usually NuDS color.content.primary) so the
  // icon adapts to light/dark themes via NuDS tokens.
  return (
    <svg width="48" height="13" viewBox="0 0 48 13" fill="none" aria-hidden="true">
      <text
        x="6"
        y="10"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
        fontSize="13"
        fontWeight="500"
        fill={color}
      >
        +
      </text>
      <text
        x="22"
        y="10"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
        fontSize="13"
        fontWeight="500"
        fill={color}
      >
        *
      </text>
      <text
        x="37"
        y="10"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
        fontSize="13"
        fontWeight="500"
        fill={color}
      >
        #
      </text>
    </svg>
  );
}

function BackspaceIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 2h15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-15L1 10l6.5-8Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 7l6 6M18 7l-6 6"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Keypad({
  onDigit,
  onBackspace,
  disabled,
  iconColor,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  disabled: boolean;
  /** NuDS-driven color applied to SVG icons (symbols/backspace) so they adapt to light/dark. */
  iconColor: string;
}) {
  return (
    <div className="nf-proto__pin-keypad" aria-disabled={disabled}>
      {KEYPAD_LAYOUT.map((row, rowIdx) => (
        <div className="nf-proto__pin-keypad__row" key={rowIdx}>
          {row.map((key, colIdx) => {
            if (key.kind === 'symbols') {
              return (
                <button
                  type="button"
                  key={`symbols-${colIdx}`}
                  className="nf-proto__pin-keypad__key nf-proto__pin-keypad__key--flat"
                  aria-label="Symbols"
                  tabIndex={-1}
                  disabled
                >
                  <SymbolsIcon color={iconColor} />
                </button>
              );
            }
            if (key.kind === 'backspace') {
              return (
                <button
                  type="button"
                  key="backspace"
                  className="nf-proto__pin-keypad__key nf-proto__pin-keypad__key--flat"
                  onClick={onBackspace}
                  disabled={disabled}
                  aria-label="Backspace"
                >
                  <BackspaceIcon color={iconColor} />
                </button>
              );
            }
            return (
              <button
                type="button"
                key={key.digit}
                className="nf-proto__pin-keypad__key"
                onClick={() => onDigit(key.digit)}
                disabled={disabled}
                aria-label={`Digit ${key.digit}`}
              >
                <span className="nf-proto__pin-keypad__key-number">{key.digit}</span>
                {key.letters && (
                  <span className="nf-proto__pin-keypad__key-letters">{key.letters}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  PinCodeSheet (BottomSheet wrapper)                                */
/* ═══════════════════════════════════════════════════════════════════ */

function PinSheetContent({
  locale,
  onClose,
  onSuccess,
  t,
}: {
  locale: Locale;
  onClose: () => void;
  onSuccess: () => void;
  t: NuDSWebTheme;
}) {
  const tr = getTranslations(locale).pin;
  const [value, setValue] = useState('');
  const [state, setState] = useState<PinCodeState>('idle');

  const handleDigit = useCallback(
    (d: string) => {
      if (state === 'validating') return;
      if (state === 'error') {
        // Error persists until user retries — any digit resets and starts fresh.
        setValue(d);
        setState('idle');
        return;
      }
      setValue((prev) => (prev.length < PIN_LENGTH ? prev + d : prev));
    },
    [state],
  );

  const handleBackspace = useCallback(() => {
    if (state === 'validating') return;
    if (state === 'error') {
      // Any interaction after error dismisses the error and clears the input.
      setValue('');
      setState('idle');
      return;
    }
    setValue((prev) => prev.slice(0, -1));
  }, [state]);

  // Keep a stable reference to onSuccess so the validation effect can call
  // it without having `onSuccess` in its dep array (see the race-condition
  // rationale below).
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // Validation trigger. Depends ONLY on `value` — NOT on `state`.
  //
  // Subtle but critical: if we depended on `state`, this effect would re-run
  // the instant `setState('validating')` commits. React's cleanup semantics
  // then cancel the 180ms timer before it can fire, and the new effect body
  // returns early (because state !== 'idle') without scheduling a new one,
  // so success/error never resolve. The effect must fire exactly once per
  // complete PIN entry, which means state transitions must NOT re-trigger it.
  useEffect(() => {
    if (value.length !== PIN_LENGTH) return;
    setState('validating');
    const validateTimer = window.setTimeout(() => {
      if (value === DEFAULT_PIN) {
        onSuccessRef.current();
      } else {
        setState('error');
      }
    }, VALIDATE_DELAY_MS);
    return () => window.clearTimeout(validateTimer);
  }, [value]);

  // Error state deliberately persists on screen — it only clears when the
  // user interacts again (taps a digit or backspace), so the red dots +
  // inline message stay visible as long as the user is looking at them.
  // Reset logic lives in handleDigit / handleBackspace, which require the
  // keypad to stay enabled during 'error' (see the Keypad prop below).

  return (
    <div className="nf-proto__pin-sheet">
      <div className="nf-proto__pin-header">
        <button
          type="button"
          className="nf-proto__pin-close"
          onClick={onClose}
          aria-label={tr.closeAria}
        >
          <CloseIcon color={t.color.content.primary} />
        </button>
        <span />
        <span />
      </div>

      <div className="nf-proto__pin-body">
        <NText
          variant="titleMedium"
          tone="primary"
          theme={t}
          as="h2"
          style={{ marginTop: t.spacing[2] }}
        >
          {tr.title}
        </NText>

        <div
          className="nf-proto__pin-dots"
          style={{ marginTop: t.spacing[6] }}
        >
          <PinCode value={value} state={state} theme={t} />
        </div>

        <div className="nf-proto__pin-helper">
          <AnimatePresence mode="wait">
            {state === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', alignItems: 'center', gap: t.spacing[1] }}
                role="alert"
              >
                <WarningCircleIcon color={t.color.negative} />
                <NText
                  variant="labelXSmallDefault"
                  color={t.color.negative}
                  theme={t}
                  as="span"
                >
                  {tr.error}
                </NText>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <Keypad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        // Keep the keypad enabled during `error` so handleDigit / handleBackspace
        // can execute their reset-on-keystroke branches (disabled <button> never
        // fires onClick, which would dead-end the flow). The 1.2s auto-clear
        // useEffect above is the safety net for users who wait.
        disabled={state === 'validating'}
        iconColor={t.color.content.primary}
      />
    </div>
  );
}

export default function PinCodeSheet({
  visible,
  locale,
  onClose,
  onSuccess,
}: PinCodeSheetProps) {
  const { nuds } = useTheme();
  const t = nuds;

  return (
    <AnimatePresence>
      {visible && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1500,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: t.color.surface.overlaySubtle,
              opacity: 0.3,
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.75 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 1,
              background: t.color.background.primary,
              borderTopLeftRadius: t.radius.xl,
              borderTopRightRadius: t.radius.xl,
              // NOTE: NuDS elevation tokens (level1/2/3) are downward shadows for
              // cards — there's no "bottom-sheet / top-up" shadow in the web token
              // package. Kept the original upward shadow as a documented exception;
              // see the PIN report extensions for the rationale.
              boxShadow: '0px -4px 32px rgba(0,0,0,0.10)',
              maxHeight: '90%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <PinSheetContent
              locale={locale}
              onClose={onClose}
              onSuccess={onSuccess}
              t={t}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
