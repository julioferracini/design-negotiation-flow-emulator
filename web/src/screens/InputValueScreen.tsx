import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { NText, Button, TopBar } from '../nuds';
import type { NuDSWebTheme } from '../nuds';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
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

export default function InputValueScreen({
  locale,
  onBack,
  variant = 'installment-value',
}: {
  locale: Locale;
  onBack?: () => void;
  variant?: string;
}) {
  const { nuds } = useTheme();
  const t = nuds;
  const translations = getTranslations(locale);
  const iv = translations.inputValue;
  const variantKey = variant?.includes('downpayment') ? 'downpaymentValue' : 'installmentValue';
  const variantT = iv.variants[variantKey];
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
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (isBelowMin) {
      errorTimerRef.current = setTimeout(() => setShowError(true), ERROR_DEBOUNCE);
    } else {
      errorTimerRef.current = setTimeout(() => setShowError(false), 0);
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
    <div className="nf-proto" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: t.color.background.screen, color: t.color.content.primary,
      transition: 'background 0.3s, color 0.3s',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* NavigationBar */}
      <div className="nf-proto__safe-top" style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: `0 ${t.spacing[1]}px`, minHeight: 64 }}>
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
              <ArrowBack color={t.color.content.primary} />
            </button>
          )}
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'center',
            color: t.color.content.primary, transition: 'color 0.3s',
            marginRight: onBack ? 44 : 0,
          }}>
            {variantT.title}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="nf-proto__scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px', overflow: 'hidden' }}>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.1 }}
          style={{
            margin: '0 0 24px', fontSize: 28, fontWeight: 500, lineHeight: 1.2,
            letterSpacing: '-0.84px', color: t.color.content.primary, transition: 'color 0.3s',
          }}
        >
          {variantT.heading}
        </motion.h1>

        {/* Money Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.36, delay: 0.18 }}
          style={{ marginBottom: t.spacing[3] }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', minHeight: 40 }}>
            <span style={{
              fontSize: 28, fontWeight: 500, lineHeight: 1.2,
              color: hasValue ? t.color.content.secondary : withAlpha(t.color.content.primary, 0.3),
              transition: 'color 0.3s',
            }}>
              {curr.symbol}
            </span>
            {hasValue && (
              <span style={{
                fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginLeft: t.spacing[3],
                color: t.color.content.primary, transition: 'color 0.3s',
              }}>
                {displayAmount}
              </span>
            )}
          </div>
          <div style={{
            height: 2, marginTop: t.spacing[2],
            background: showError ? t.color.negative : t.color.border.secondary,
            transition: 'background 0.3s',
          }} />
        </motion.div>

        {/* Suggestion Chips (show in variants ending with "-chips") */}
        {variant?.includes('-chips') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.36, delay: 0.26 }}
            style={{ display: 'flex', gap: t.spacing[2], overflow: 'auto', marginBottom: 0, flexShrink: 0, paddingBottom: t.spacing[1] }}
          >
            {suggestions.map((amt) => {
              const isActive = hasValue && numericValue === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSuggestion(amt)}
                  className={`nf-proto__chip${isActive ? ' nf-proto__chip--active' : ''}`}
                  style={{
                    flexShrink: 0, height: 36, padding: `0 ${t.spacing[4]}px`,
                    borderRadius: 18, border: `1px solid ${t.color.border.secondary}`,
                    background: t.color.background.screen, color: t.color.content.primary,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.2s, border-color 0.3s, color 0.3s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtAmount(amt)}
                </button>
              );
            })}
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
                margin: `${t.spacing[2]}px 0 ${t.spacing[1]}px`, fontSize: 12, fontWeight: 400, lineHeight: 1.3,
                color: t.color.negative, whiteSpace: 'pre-line',
              }}
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Crossfade: Tip Box ↔ Simulate Button */}
        <div style={{ position: 'relative', minHeight: 56, marginBottom: t.spacing[4] }}>
          <AnimatePresence mode="wait">
            {!hasValue ? (
              <motion.div
                key="tip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: t.spacing[2],
                  padding: `${t.spacing[3]}px ${t.spacing[2]}px`, borderRadius: t.radius.xl,
                  border: `1px solid ${withAlpha(t.color.main, 0.2)}`,
                  background: withAlpha(t.color.main, 0.06),
                  transition: 'background 0.3s, border-color 0.3s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: t.radius.lg,
                  background: t.color.background.secondary, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CalculatorIcon color={t.color.main} size={16} />
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
                        color: t.color.main, letterSpacing: '0.12px',
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
                  width: '100%', height: 48, border: 'none', borderRadius: t.radius.xl,
                  background: isBelowMin ? t.color.border.secondary : t.color.main,
                  color: t.color.content.main,
                  fontSize: 16, fontWeight: 600, cursor: isBelowMin ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: t.spacing[1],
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
      <div className="nf-proto__keypad" style={{
        flexShrink: 0, display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6, padding: 6, paddingBottom: t.spacing[4],
        background: t.color.background.secondary,
      }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="nf-proto__keypad__key"
            style={{
              height: 48, border: 'none', borderRadius: t.radius.sm,
              background: t.color.background.primary, cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 1px 0 ${withAlpha(t.color.content.primary, 0.15)}`,
            }}
          >
            <span style={{ fontSize: t.typography.titleXSmall.fontSize, fontWeight: 500, color: t.color.content.secondary, lineHeight: 1.2 }}>{d}</span>
            {KEYPAD_LETTERS[d] && (
              <span style={{ fontSize: 9, fontWeight: 700, color: t.color.content.secondary, letterSpacing: 1.9, lineHeight: 1 }}>
                {KEYPAD_LETTERS[d]}
              </span>
            )}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="nf-proto__keypad__key"
          style={{
            height: 48, border: 'none', borderRadius: t.radius.sm,
            background: t.color.background.primary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 1px 0 ${withAlpha(t.color.content.primary, 0.15)}`,
          }}
        >
          <span style={{ fontSize: t.typography.titleXSmall.fontSize, fontWeight: 500, color: t.color.content.secondary, lineHeight: 1.2 }}>0</span>
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="nf-proto__keypad__key"
          style={{
            height: 48, border: 'none', borderRadius: t.radius.sm,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: t.typography.titleXSmall.fontSize, color: t.color.content.secondary }}>⌫</span>
        </button>
      </div>
    </div>
  );
}
