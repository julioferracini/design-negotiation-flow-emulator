import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { getTranslations } from '../../../i18n/translations';
import type { Locale } from '../../../i18n/types';
import { getUseCaseForLocale } from '../../../config/useCases';
import { formatCurrency, interpolate } from '../../../config/formatters';
import { getRules, getSimDebtData, getSuggestionAmounts } from '../../../config/financialCalculator';

const KEYPAD_LETTERS: Record<string, string> = {
  '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
  '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
};
const TIP_INTERVAL = 4000;
const ERROR_DEBOUNCE = 1000;

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

function ArrowBack({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
      <g transform="translate(5.955, 2.744)">
        <path
          d="M0.244078 6.66667L6.91074 0L8.08926 1.17851L2.01184 7.25592L8.08926 13.3333L6.91074 14.5118L0.244078 7.84518C-0.0813592 7.51974 -0.0813592 6.9921 0.244078 6.66667Z"
          fill={color}
        />
      </g>
    </svg>
  );
}

function CalculatorIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="5" width="8" height="3" rx="0.5" stroke={color} strokeWidth="1.2" />
      <circle cx="7.5" cy="12" r="0.8" fill={color} />
      <circle cx="10" cy="12" r="0.8" fill={color} />
      <circle cx="12.5" cy="12" r="0.8" fill={color} />
      <circle cx="7.5" cy="15" r="0.8" fill={color} />
      <circle cx="10" cy="15" r="0.8" fill={color} />
      <circle cx="12.5" cy="15" r="0.8" fill={color} />
    </svg>
  );
}

export default function InstallmentValueScreen({
  locale,
  onBack,
  variant,
}: {
  locale: Locale;
  onBack?: () => void;
  variant?: string;
}) {
  const { palette } = useTheme();
  const t = getTranslations(locale);
  const iv = t.installmentValue;
  const useCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = useCase.currency;
  const fmtAmount = useCallback((v: number) => formatCurrency(v, curr), [curr]);

  const [rawDigits, setRawDigits] = useState('');
  const [tipIndex, setTipIndex] = useState(0);
  const [showError, setShowError] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rules = getRules(locale);
  const debtData = getSimDebtData(locale);

  const hasValue = rawDigits.length > 0;
  const numericValue = hasValue ? parseInt(rawDigits, 10) / 100 : 0;
  const displayAmount = hasValue ? formatCurrency(numericValue, curr, { showSymbol: false }) : '';
  const isBelowMin = hasValue && numericValue > 0 && numericValue < rules.minInstallmentAmount;

  const suggestions = useMemo(() => getSuggestionAmounts(debtData.originalBalance, rules), [debtData.originalBalance, rules]);

  useEffect(() => {
    setShowError(false);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (isBelowMin) {
      errorTimerRef.current = setTimeout(() => setShowError(true), ERROR_DEBOUNCE);
    }
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, [rawDigits, isBelowMin]);

  useEffect(() => {
    if (hasValue) return;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % iv.tips.length);
    }, TIP_INTERVAL);
    return () => clearInterval(interval);
  }, [hasValue, iv.tips.length]);

  const handleDigit = useCallback((d: string) => {
    setRawDigits((prev) => prev.length >= 10 ? prev : prev + d);
  }, []);

  const handleBackspace = useCallback(() => {
    setRawDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleSuggestion = useCallback((amount: number) => {
    setRawDigits(Math.round(amount * 100).toString());
  }, []);

  const currentTip = iv.tips[tipIndex].includes('{amount}')
    ? interpolate(iv.tips[tipIndex], { amount: fmtAmount(rules.minInstallmentAmount) })
    : iv.tips[tipIndex];

  const errorMsg = interpolate(iv.minimumError, { amount: fmtAmount(rules.minInstallmentAmount) });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: palette.background, color: palette.textPrimary,
      transition: 'background 0.3s, color 0.3s',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* NavigationBar */}
      <div style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', minHeight: 64 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              style={{
                width: 44, height: 44, border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowBack color={palette.textPrimary} />
            </button>
          )}
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'center',
            color: palette.textPrimary, transition: 'color 0.3s',
            marginRight: onBack ? 44 : 0,
          }}>
            {iv.title}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px', overflow: 'hidden' }}>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.1 }}
          style={{
            margin: '0 0 24px', fontSize: 28, fontWeight: 500, lineHeight: 1.2,
            letterSpacing: '-0.84px', color: palette.textPrimary, transition: 'color 0.3s',
          }}
        >
          {iv.heading}
        </motion.h1>

        {/* Money Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.36, delay: 0.18 }}
          style={{ marginBottom: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', minHeight: 40 }}>
            <span style={{
              fontSize: 28, fontWeight: 500, lineHeight: 1.2,
              color: hasValue ? palette.textSecondary : withAlpha(palette.textPrimary, 0.3),
              transition: 'color 0.3s',
            }}>
              {curr.symbol}
            </span>
            {hasValue && (
              <span style={{
                fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginLeft: 12,
                color: palette.textPrimary, transition: 'color 0.3s',
              }}>
                {displayAmount}
              </span>
            )}
          </div>
          <div style={{
            height: 2, marginTop: 8,
            background: showError ? '#D01D1C' : palette.border,
            transition: 'background 0.3s',
          }} />
        </motion.div>

        {/* Suggestion Chips (only in "input-with-chips" variant) */}
        {variant === 'input-with-chips' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.36, delay: 0.26 }}
            style={{ display: 'flex', gap: 8, overflow: 'auto', marginBottom: 0, flexShrink: 0, paddingBottom: 4 }}
          >
            {suggestions.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSuggestion(amt)}
                style={{
                  flexShrink: 0, height: 36, padding: '0 16px',
                  borderRadius: 18, border: `1px solid ${palette.border}`,
                  background: palette.background, color: palette.textPrimary,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.3s, color 0.3s',
                  whiteSpace: 'nowrap',
                }}
              >
                {fmtAmount(amt)}
              </button>
            ))}
          </motion.div>
        )}

        {/* Error feedback */}
        <AnimatePresence>
          {showError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              style={{
                margin: '8px 0 4px', fontSize: 12, fontWeight: 400, lineHeight: 1.3,
                color: '#D01D1C', whiteSpace: 'pre-line',
              }}
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Crossfade: Tip Box ↔ Simulate Button */}
        <div style={{ position: 'relative', minHeight: 56, marginBottom: 16 }}>
          <AnimatePresence mode="wait">
            {!hasValue ? (
              <motion.div
                key="tip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 8px', borderRadius: 24,
                  border: `1px solid ${withAlpha(palette.accent, 0.2)}`,
                  background: withAlpha(palette.accent, 0.06),
                  transition: 'background 0.3s, border-color 0.3s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: palette.surface, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CalculatorIcon color={palette.accent} size={16} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 32 }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={tipIndex}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.22 }}
                      style={{
                        display: 'block', fontSize: 12, fontWeight: 600, lineHeight: 1.3,
                        color: palette.accent, letterSpacing: '0.12px',
                      }}
                    >
                      {currentTip}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="btn"
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                onClick={() => {}}
                disabled={isBelowMin}
                style={{
                  width: '100%', height: 48, border: 'none', borderRadius: 24,
                  background: isBelowMin ? '#E3E0E5' : palette.accent,
                  color: '#FFFFFF',
                  fontSize: 16, fontWeight: 600, cursor: isBelowMin ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  overflow: 'hidden',
                }}
              >
                <span>{iv.simulate}</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displayAmount}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.16 }}
                  >
                    {` ${curr.symbol} ${displayAmount}`}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Numeric Keypad */}
      <div style={{
        flexShrink: 0, display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6, padding: 6, paddingBottom: 16,
        background: '#D1D1D6',
      }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            style={{
              height: 48, border: 'none', borderRadius: 5,
              background: '#FFFFFF', cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 0 rgba(0,0,0,0.35)',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 500, color: 'rgba(0,0,0,0.64)', lineHeight: 1.2 }}>{d}</span>
            {KEYPAD_LETTERS[d] && (
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.64)', letterSpacing: 1.9, lineHeight: 1 }}>
                {KEYPAD_LETTERS[d]}
              </span>
            )}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => handleDigit('0')}
          style={{
            height: 48, border: 'none', borderRadius: 5,
            background: '#FFFFFF', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 0 rgba(0,0,0,0.35)',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 500, color: 'rgba(0,0,0,0.64)', lineHeight: 1.2 }}>0</span>
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          style={{
            height: 48, border: 'none', borderRadius: 5,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 20, color: 'rgba(0,0,0,0.64)' }}>⌫</span>
        </button>
      </div>
    </div>
  );
}
