import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import {
  calculate,
  getSimDebtData,
  findBestInstallmentsForMonthly,
  getRules,
  getFirstPaymentDate,
  DEFAULT_INITIAL_INSTALLMENTS,
  SAVINGS_EPSILON,
  type CalculateResult,
  type FinancialRules,
} from '../../../config/financialCalculator';
import { formatCurrency, interpolate } from '../../../config/formatters';
import { getUseCaseForLocale } from '../../../config/useCases';
import { useEmulatorConfig } from '../context/EmulatorConfigContext';

type Palette = {
  accent: string;
  accentSubtle: string;
  positive: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
};

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  AnimatedNumber — Roulette with blur                              */
/* ═══════════════════════════════════════════════════════════════════ */

function AnimatedNumber({
  value,
  delay = 0,
  fontSize = 44,
  fontWeight = 500,
  color = '#1f0230',
  letterSpacing = '-1px',
}: {
  value: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  letterSpacing?: string;
}) {
  const prevRef = useRef(value);
  const dirRef = useRef<'up' | 'down'>('up');

  useEffect(() => {
    const prevNum = parseFloat(prevRef.current.replace(/[^0-9.-]/g, '')) || 0;
    const currNum = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    dirRef.current = currNum >= prevNum ? 'up' : 'down';
    prevRef.current = value;
  }, [value]);

  const lineHeight = Math.ceil(fontSize * 1.2);
  const travel = lineHeight;
  const dir = dirRef.current;

  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', height: lineHeight, position: 'relative', verticalAlign: 'middle' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: dir === 'up' ? travel : -travel, filter: 'blur(6px)', opacity: 0.4 }}
          animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
          exit={{ y: dir === 'up' ? -travel : travel, filter: 'blur(6px)', opacity: 0.4 }}
          transition={{
            y: { type: 'tween', duration: 0.45, ease: [0.42, 0, 0.58, 1], delay },
            filter: { duration: 0.35, ease: [0.42, 0, 0.58, 1], delay },
            opacity: { duration: 0.35, ease: [0.42, 0, 0.58, 1], delay },
          }}
          style={{
            display: 'block',
            fontSize,
            fontWeight,
            color,
            letterSpacing,
            lineHeight: `${lineHeight}px`,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CurrencyValue — Static symbol + AnimatedNumber                   */
/* ═══════════════════════════════════════════════════════════════════ */

function CurrencyValue({
  symbol,
  value,
  delay = 0,
  fontSize,
  fontWeight = 500,
  color = '#1f002f',
  letterSpacing = '-2px',
}: {
  symbol: string;
  value: string;
  delay?: number;
  fontSize: number;
  fontWeight?: number;
  color?: string;
  letterSpacing?: string;
}) {
  const lineHeight = Math.ceil(fontSize * 1.2);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize, fontWeight, color, letterSpacing, lineHeight: `${lineHeight}px`, fontVariantNumeric: 'tabular-nums' }}>
        {symbol}
      </span>
      <AnimatedNumber value={value} delay={delay} fontSize={fontSize} fontWeight={fontWeight} color={color} letterSpacing={letterSpacing} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SVG Icons                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function ArrowBack({ color = '#1F0230' }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
      <g transform="translate(5.955, 2.744)">
        <path d="M0.244078 6.66667L6.91074 0L8.08926 1.17851L2.01184 7.25592L8.08926 13.3333L6.91074 14.5118L0.244078 7.84518C-0.0813592 7.51974 -0.0813592 6.9921 0.244078 6.66667Z" fill={color} fillOpacity={0.62} />
      </g>
    </svg>
  );
}

function InfoIcon({ color = '#1F0230' }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity={0.62} strokeWidth={1.75} />
      <line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeOpacity={0.62} strokeWidth={1.75} strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill={color} fillOpacity={0.62} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Haptic tick (Web Audio)                                          */
/* ═══════════════════════════════════════════════════════════════════ */

let audioCtx: AudioContext | null = null;
function ensureAudioCtx(): AudioContext | null {
  if (!audioCtx && typeof AudioContext !== 'undefined') audioCtx = new AudioContext();
  return audioCtx;
}

function warmUpAudio() {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}

function hapticTick() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(18);
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 1800;
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.025);
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  InstallmentsSlider                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function InstallmentsSlider({
  value,
  min,
  max,
  onChange,
  labelLeft,
  labelRight,
  palette,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  labelLeft: string;
  labelRight: string;
  palette: Palette;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastValueRef = useRef(value);
  const [tickPulse, setTickPulse] = useState(0);
  const [dragging, setDragging] = useState(false);

  const pct = ((value - min) / (max - min)) * 100;
  const thumbW = 32;

  const springConfig = { type: 'spring' as const, stiffness: 600, damping: 35, mass: 0.5 };

  const emitWithTick = useCallback((newVal: number) => {
    if (newVal !== lastValueRef.current) {
      lastValueRef.current = newVal;
      hapticTick();
      setTickPulse((p) => p + 1);
    }
    onChange(newVal);
  }, [onChange]);

  const calcValueFromX = useCallback((clientX: number) => {
    if (!sliderRef.current) return value;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const p = x / rect.width;
    return Math.round(min + p * (max - min));
  }, [min, max, value]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      emitWithTick(calcValueFromX(clientX));
    };
    const onUp = () => {
      isDragging.current = false;
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    if (dragging) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [dragging, emitWithTick, calcValueFromX]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    warmUpAudio();
    isDragging.current = true;
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    emitWithTick(calcValueFromX(clientX));
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging.current) return;
    emitWithTick(calcValueFromX(e.clientX));
  };

  const containerH = 40;
  const trackTop = (containerH - 4) / 2;
  const thumbTop = (containerH - thumbW) / 2;

  return (
    <div style={{ width: '100%', padding: '16px 20px' }}>
      <div
        ref={sliderRef}
        style={{ height: containerH, width: '100%', cursor: 'pointer', position: 'relative', touchAction: 'none' }}
        onClick={handleTrackClick}
      >
        {/* Track */}
        <div style={{ position: 'absolute', top: trackTop, left: 0, right: 0, height: 4, background: palette.border, borderRadius: 8 }} />
        {/* Progress */}
        <motion.div
          animate={{ width: `calc(${pct}% - ${(thumbW / 2) * (1 - pct / 100)}px + ${thumbW / 2}px)` }}
          transition={springConfig}
          style={{ position: 'absolute', top: trackTop, left: 0, height: 4, background: palette.accent, borderRadius: 8 }}
        />
        {/* Thumb */}
        <motion.div
          animate={{ left: `calc(${pct}% - ${thumbW / 2}px)` }}
          transition={springConfig}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            position: 'absolute', top: thumbTop,
            width: thumbW, height: thumbW, borderRadius: '50%', background: palette.accent,
            zIndex: 2, touchAction: 'none',
            cursor: dragging ? 'grabbing' : 'grab',
            scale: dragging ? 1.35 : 1,
            boxShadow: dragging ? `0px 4px 16px ${withAlpha(palette.accent, 0.35)}` : 'none',
            transition: 'scale 0.15s, box-shadow 0.15s',
          }}
        >
          <AnimatePresence>
            <motion.div
              key={tickPulse}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${withAlpha(palette.accent, 0.3)}`, pointerEvents: 'none' }}
            />
          </AnimatePresence>
        </motion.div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: palette.textSecondary, letterSpacing: '0.12px' }}>{labelLeft}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: palette.textSecondary, letterSpacing: '0.12px' }}>{labelRight}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Savings Banner                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function SavingsBanner({ savings, symbol, locale, palette }: { savings: number; symbol: string; locale: Locale; palette: Palette }) {
  const bannerControls = useAnimation();
  const prevSavingsRef = useRef(savings);
  const curr = getUseCaseForLocale(locale).currency;
  const formatted = formatCurrency(savings, curr, { showSymbol: false });

  useEffect(() => {
    bannerControls.start({
      opacity: 1, scale: 1,
      transition: {
        opacity: { duration: 0.4, delay: 0.15 },
        scale: { duration: 0.6, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] },
      },
    });
  }, [bannerControls]);

  useEffect(() => {
    if (savings === prevSavingsRef.current) return;
    prevSavingsRef.current = savings;
    const t = setTimeout(() => {
      bannerControls.start({
        scale: [1, 1.045, 0.98, 1],
        transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
      });
    }, 280);
    return () => clearTimeout(t);
  }, [savings, bannerControls]);

  const t = getTranslations(locale);

  return (
    <motion.div
      animate={bannerControls}
      initial={{ opacity: 0, scale: 0.92 }}
      style={{
        background: '#ddf5e5', borderRadius: 16, padding: '15px 16px',
        border: '1px solid rgba(30,165,84,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        width: '100%',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 400, color: palette.positive }}>
        {t.simulation.totalSavings}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: palette.positive }}>
        {symbol}
      </span>
      <AnimatedNumber value={formatted} delay={0.2} fontSize={14} fontWeight={700} color={palette.positive} letterSpacing="0px" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CheckoutBottomBar                                                */
/* ═══════════════════════════════════════════════════════════════════ */

function CheckoutBottomBar({
  total,
  originalDebt,
  symbol,
  ctaLabel,
  onContinue,
  palette,
}: {
  total: string;
  originalDebt: string;
  symbol: string;
  ctaLabel: string;
  onContinue: () => void;
  palette: Palette;
}) {
  return (
    <div style={{
      background: palette.background, width: '100%', borderTop: `1px solid ${palette.border}`,
      position: 'sticky', bottom: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 20 }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: palette.textPrimary, letterSpacing: '-0.54px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontVariantNumeric: 'tabular-nums' }}>
            Total: {symbol} {total}
          </span>
          <span style={{ fontSize: 16, fontWeight: 500, color: palette.textSecondary, textDecoration: 'line-through', letterSpacing: '-0.48px', fontVariantNumeric: 'tabular-nums' }}>
            {symbol} {originalDebt}
          </span>
        </div>
        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          style={{
            height: 48, padding: '0 24px', borderRadius: 64, background: palette.accent, border: 'none', cursor: 'pointer', flexShrink: 0,
            boxShadow: `0px 1px 0px 0px ${withAlpha(palette.textPrimary, 0.05)}, inset 0px 1px 0px 0px rgba(255,255,255,0.08), inset 0px -1px 0px 0px ${withAlpha(palette.textPrimary, 0.46)}`,
            fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: 0,
          }}
        >
          {ctaLabel}
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Bottom Sheet Backdrop + Container (shared)                       */
/* ═══════════════════════════════════════════════════════════════════ */

function BottomSheet({
  visible,
  onClose,
  backdropOpacity = 0.4,
  borderRadius = 28,
  spring,
  palette,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  backdropOpacity?: number;
  borderRadius?: number;
  spring?: object;
  palette: Palette;
  children: React.ReactNode;
}) {
  const defaultSpring = { type: 'spring', stiffness: 380, damping: 34, mass: 0.75 };
  return (
    <AnimatePresence>
      {visible && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${backdropOpacity})` }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring ?? defaultSpring}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: palette.background,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              boxShadow: '0px -4px 32px rgba(0,0,0,0.10)',
              position: 'relative', zIndex: 1,
              maxHeight: '90%', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
              <div style={{ width: 36, height: 5, borderRadius: 999, background: palette.border }} />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CalcSummarySheet                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function CalcSummarySheet({
  visible,
  onClose,
  values,
  rules,
  locale,
  installments,
  originalBalance,
  palette,
}: {
  visible: boolean;
  onClose: () => void;
  values: CalculateResult;
  rules: FinancialRules;
  locale: Locale;
  installments: number;
  originalBalance: number;
  palette: Palette;
}) {
  const t = getTranslations(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const fmt = (v: number) => formatCurrency(v, curr);
  const sim = t.simulation;

  const firstPayment = getFirstPaymentDate();
  const dayNum = firstPayment.getDate();
  const dateStr = firstPayment.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

  type Row = { label: string; value: string; highlight?: boolean; negative?: boolean; savings?: boolean };
  const rows: Row[] = [
    { label: sim.total, value: fmt(originalBalance) },
  ];
  if (values.needsDownpayment && values.downpayment > 0) {
    rows.push({ label: sim.downPayment, value: fmt(values.downpayment) });
  }
  if (values.effectiveRate > 0) {
    rows.push({ label: `${rules.taxLabel}`, value: `${values.effectiveRate.toFixed(2)}% a.m.` });
  }
  rows.push({ label: sim.installments, value: `${installments}x` });
  rows.push({ label: sim.monthlyPayment, value: fmt(values.monthlyPayment), highlight: true });
  rows.push({ label: dateStr, value: interpolate(t.summary.everyDay, { day: String(dayNum) }) });
  if (values.totalInterest > 0) {
    rows.push({ label: t.summary.totalInterest, value: fmt(values.totalInterest), negative: true });
  }
  if (values.savings > SAVINGS_EPSILON) {
    rows.push({ label: t.summary.totalAmountToPay, value: `- ${fmt(values.savings)}`, savings: true });
  }
  rows.push({ label: sim.total, value: fmt(values.total), highlight: true });

  return (
    <BottomSheet visible={visible} onClose={onClose} palette={palette}>
      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: palette.textPrimary, letterSpacing: '-0.66px' }}>{sim.subtitle}</h2>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: palette.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: palette.textPrimary }}>
          ✕
        </motion.button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh', padding: '0 20px 12px' }}>
        {rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: row.savings ? 500 : 400, color: row.savings ? palette.textPrimary : palette.textSecondary, letterSpacing: '-0.14px' }}>
                {row.label}
              </span>
              <span style={{
                fontSize: 14, fontWeight: 600, letterSpacing: '-0.14px', fontVariantNumeric: 'tabular-nums',
                color: row.negative ? '#c0392b' : row.savings ? '#2eab57' : row.highlight ? palette.textPrimary : palette.textSecondary,
              }}>
                {row.value}
              </span>
            </div>
            {i < rows.length - 1 && <div style={{ height: 1, background: palette.border }} />}
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 20px 28px' }}>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: '100%', height: 52, borderRadius: 26, background: palette.accent, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#fff', boxShadow: `0px 2px 8px ${withAlpha(palette.accent, 0.25)}` }}>
          {sim.close}
        </motion.button>
      </div>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DownpaymentAlertSheet                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function DownpaymentAlertSheet({
  visible,
  onClose,
  locale,
  palette,
}: {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
  palette: Palette;
}) {
  const sim = getTranslations(locale).simulation;
  const htmlBody = sim.downPaymentRequiredMessage;
  const parts = htmlBody.split(/<\/?strong>/);

  return (
    <BottomSheet visible={visible} onClose={onClose} backdropOpacity={0.5} borderRadius={32} spring={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }} palette={palette}>
      <div style={{ padding: '16px 24px 32px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: palette.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={palette.accent} strokeWidth={2} />
            <line x1="12" y1="11" x2="12" y2="16" stroke={palette.accent} strokeWidth={2} strokeLinecap="round" />
            <circle cx="12" cy="8" r="1" fill={palette.accent} />
          </svg>
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 500, color: palette.textPrimary, letterSpacing: '-0.72px' }}>
          {sim.downPaymentRequired}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 15, fontWeight: 400, color: palette.textSecondary, lineHeight: 1.5 }}>
          {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>)}
        </p>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%', height: 52, borderRadius: 26, background: palette.accent, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#fff', boxShadow: `0px 2px 8px ${withAlpha(palette.accent, 0.25)}` }}>
          {sim.gotIt}
        </motion.button>
      </div>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  BottomSheetEditor — ATM-style keypad                             */
/* ═══════════════════════════════════════════════════════════════════ */

function BottomSheetEditor({
  visible,
  onClose,
  type,
  title,
  currentValue,
  minValue,
  maxValue,
  locale,
  onValueChange,
  palette,
  mandatoryHint,
}: {
  visible: boolean;
  onClose: () => void;
  type: 'downpayment' | 'monthly' | 'installments';
  title: string;
  currentValue: number;
  minValue?: number;
  maxValue?: number;
  locale: Locale;
  onValueChange: (v: number) => void;
  palette: Palette;
  mandatoryHint?: string;
}) {
  const curr = getUseCaseForLocale(locale).currency;
  const sim = getTranslations(locale).simulation;
  const isCurrency = type !== 'installments';
  const [inputValue, setInputValue] = useState(() => {
    if (isCurrency) return String(Math.round(currentValue * 100));
    return String(currentValue);
  });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (visible) {
      if (isCurrency) setInputValue(String(Math.round(currentValue * 100)));
      else setInputValue(String(currentValue));
      setHasStarted(false);
    }
  }, [visible, currentValue, isCurrency]);

  const numericValue = isCurrency ? parseInt(inputValue || '0', 10) / 100 : parseInt(inputValue || '0', 10);
  const isBelowMin = minValue !== undefined && minValue > 0 && numericValue < minValue;
  const isAboveMax = maxValue !== undefined && numericValue > maxValue;
  const isOutOfRange = isBelowMin || isAboveMax;

  const displayValue = isCurrency
    ? formatCurrency(numericValue, curr, { showSymbol: false })
    : inputValue || '0';

  const handleKey = (key: string) => {
    if (key === 'back') {
      setInputValue((prev) => prev.length > 1 ? prev.slice(0, -1) : '0');
      setHasStarted(true);
      return;
    }
    if (!hasStarted) {
      setInputValue(key);
      setHasStarted(true);
      return;
    }
    if (isCurrency && inputValue.length >= 8) return;
    if (!isCurrency && inputValue.length >= 3) return;
    setInputValue((prev) => (prev === '0' ? key : prev + key));
  };

  const handleConfirm = () => {
    if (isOutOfRange) return;
    let final = numericValue;
    if (minValue) final = Math.max(minValue, final);
    if (maxValue) final = Math.min(maxValue, final);
    onValueChange(final);
    onClose();
  };

  const hintText = type === 'downpayment' && maxValue !== undefined
    ? (minValue && minValue > 0
      ? `${interpolate(sim.downPaymentMinimum, { amount: formatCurrency(minValue, curr) })} · ${interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) })}`
      : interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) }))
    : type === 'installments' && minValue !== undefined && maxValue !== undefined
      ? `${minValue}x — ${maxValue}x`
      : undefined;

  const errorText = isBelowMin && minValue !== undefined
    ? interpolate(sim.downPaymentBelowMinimum, { amount: formatCurrency(minValue, curr) })
    : isAboveMax && maxValue !== undefined
      ? interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) })
      : (type === 'downpayment' && mandatoryHint && numericValue === 0)
        ? interpolate(sim.downPaymentBelowMinimum, { amount: formatCurrency(minValue ?? 0, curr) })
        : undefined;

  const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'back']];

  return (
    <BottomSheet visible={visible} onClose={onClose} spring={{ type: 'spring', stiffness: 400, damping: 36, mass: 0.8 }} palette={palette}>
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: palette.textPrimary, letterSpacing: '-0.6px' }}>{title}</span>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: palette.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: palette.textPrimary }}>
          ✕
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px' }}>
        <motion.div
          key={isOutOfRange ? 'shake' : 'still'}
          animate={{ x: isOutOfRange ? [0, -6, 6, -4, 4, 0] : 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {isCurrency && <span style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.96px', color: isOutOfRange ? '#d4183d' : palette.textPrimary, transition: 'color 0.2s' }}>{curr.symbol}</span>}
          <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-1.2px', color: isOutOfRange ? '#d4183d' : palette.textPrimary, fontVariantNumeric: 'tabular-nums', transition: 'color 0.2s' }}>
            {displayValue}
          </span>
          {!isCurrency && <span style={{ fontSize: 18, fontWeight: 400, color: palette.textSecondary, marginLeft: 2 }}>x</span>}
        </motion.div>

        <AnimatePresence mode="wait">
          {errorText ? (
            <motion.p key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 500, color: '#d4183d' }}>
              {errorText}
            </motion.p>
          ) : hintText ? (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 400, color: palette.textSecondary }}>
              {hintText}
            </motion.p>
          ) : null}
        </AnimatePresence>

      </div>

      {mandatoryHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden', margin: '0 20px' }}
        >
          <div style={{
            padding: '10px 14px', borderRadius: 12, marginBottom: 12,
            background: `linear-gradient(135deg, ${withAlpha(palette.accent, 0.06)}, ${withAlpha(palette.accent, 0.03)})`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="7" stroke={palette.accent} strokeWidth="1.5" fill="none" />
              <path d="M8 5v3.5M8 10.5h.005" stroke={palette.accent} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 400, color: palette.textSecondary, lineHeight: 1.45 }}>{mandatoryHint}</span>
          </div>
        </motion.div>
      )}

      <div style={{ height: 1, background: palette.border, margin: '0 20px' }} />

      <div style={{ padding: '8px 16px 8px' }}>
        {keys.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', marginBottom: 4 }}>
            {row.map((k, ci) => (
              <div key={ci} style={{ flex: 1, margin: '0 4px' }}>
                {k === '' ? <div style={{ height: 52 }} /> : (
                  <motion.button
                    type="button"
                    onClick={() => handleKey(k)}
                    whileTap={{ scale: 0.92, background: withAlpha(palette.accent, 0.12) }}
                    style={{
                      width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: k === 'back' ? palette.accentSubtle : palette.surface,
                      fontSize: 20, fontWeight: k === 'back' ? 400 : 600,
                      color: k === 'back' ? palette.accent : palette.textPrimary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {k === 'back' ? '⌫' : k}
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 20px 28px' }}>
        <motion.button
          type="button"
          onClick={handleConfirm}
          disabled={isOutOfRange}
          whileHover={!isOutOfRange ? { scale: 1.02 } : undefined}
          whileTap={!isOutOfRange ? { scale: 0.97 } : undefined}
          style={{
            width: '100%', height: 52, borderRadius: 26, border: 'none',
            background: isOutOfRange ? '#c7c7cc' : palette.accent, cursor: isOutOfRange ? 'not-allowed' : 'pointer',
            fontSize: 15, fontWeight: 600, color: isOutOfRange ? 'rgba(255,255,255,0.72)' : '#fff',
            boxShadow: isOutOfRange ? 'none' : `0px 2px 8px ${withAlpha(palette.accent, 0.25)}`,
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        >
          {sim.confirm}
        </motion.button>
      </div>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Web Shimmer skeleton                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function ShimmerBar({ width, height, radius = 8, palette }: { width: number | string; height: number; radius?: number; palette: Palette }) {
  return (
    <motion.div
      animate={{ opacity: [0.25, 0.5, 0.25] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width, height, borderRadius: radius, background: palette.border }}
    />
  );
}

function WebSimulationShimmer({ palette }: { palette: Palette }) {
  return (
    <div style={{ flex: 1, padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Title placeholder */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <ShimmerBar width="75%" height={32} radius={12} palette={palette} />
        <ShimmerBar width="55%" height={32} radius={12} palette={palette} />
      </div>
      {/* Currency value */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, height: 148, justifyContent: 'center' }}>
        <ShimmerBar width={200} height={44} radius={10} palette={palette} />
        <ShimmerBar width="min(220px, 60%)" height={4} radius={2} palette={palette} />
        <ShimmerBar width={100} height={14} radius={6} palette={palette} />
      </div>
      {/* Installments */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
        <ShimmerBar width={80} height={44} radius={10} palette={palette} />
        <ShimmerBar width="min(160px, 45%)" height={4} radius={2} palette={palette} />
        <ShimmerBar width={120} height={14} radius={6} palette={palette} />
      </div>
      {/* Savings banner */}
      <div style={{ width: '100%', padding: '0 20px', marginBottom: 20 }}>
        <ShimmerBar width="100%" height={52} radius={16} palette={palette} />
      </div>
      {/* Slider */}
      <div style={{ width: '100%', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ShimmerBar width="100%" height={4} radius={2} palette={palette} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <ShimmerBar width={90} height={12} radius={4} palette={palette} />
          <ShimmerBar width={70} height={12} radius={4} palette={palette} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main SimulationScreen                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SimulationScreen({
  locale,
  onBack,
  onContinue,
  initialInstallments = DEFAULT_INITIAL_INSTALLMENTS,
  initialDownpayment,
  initialDownpaymentFixed,
  skipDownpaymentThreshold = false,
  variant,
}: {
  locale: Locale;
  onBack?: () => void;
  onContinue?: (data: {
    installments: number;
    monthlyPayment: number;
    savings: number;
    total: number;
    downpayment?: number;
    hasDownpayment?: boolean;
    downpaymentFixed?: boolean;
    totalInterest?: number;
    effectiveRate?: number;
  }) => void;
  initialInstallments?: number;
  initialDownpayment?: number;
  initialDownpaymentFixed?: boolean;
  skipDownpaymentThreshold?: boolean;
  variant?: string;
}) {
  const isEntryFrom21 = variant === 'entry-from-21';
  const ENTRY_FROM_THRESHOLD = getRules(locale).downPaymentThreshold + 1;
  const { palette } = useTheme();
  const { simulatedLatencyMs, debtOverrides, effectiveRules } = useEmulatorConfig();
  const t = getTranslations(locale);
  const sim = t.simulation;
  const rules = effectiveRules;
  const baseDebtData = getSimDebtData(locale);
  const overrideTotal = debtOverrides.cardBalance + debtOverrides.loanBalance;
  const debtData = useMemo(() => ({
    ...baseDebtData,
    originalBalance: overrideTotal > 0 ? overrideTotal : baseDebtData.originalBalance,
  }), [baseDebtData, overrideTotal]);
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtNum = useCallback((v: number) => formatCurrency(v, curr, { showSymbol: false }), [curr]);

  const debtExceedsThreshold = debtData.originalBalance > rules.downPaymentDebtThreshold;

  const [installments, setInstallments] = useState(initialInstallments);
  const [downpayment, setDownpayment] = useState(() => {
    if (initialDownpayment != null) return initialDownpayment;
    if (isEntryFrom21 && initialInstallments < ENTRY_FROM_THRESHOLD) return 0;
    return debtExceedsThreshold ? debtData.originalBalance * rules.downPaymentMinPercent : 0;
  });
  const [downpaymentFixed, setDownpaymentFixed] = useState(initialDownpaymentFixed ?? true);
  const [downpaymentUserSet, setDownpaymentUserSet] = useState(false);

  const [showDownpaymentAlert, setShowDownpaymentAlert] = useState(false);
  const [hasShownAlertOnce, setHasShownAlertOnce] = useState(!isEntryFrom21);
  const [showCalcSummary, setShowCalcSummary] = useState(false);
  const [sheetState, setSheetState] = useState<{ isOpen: boolean; type: 'downpayment' | 'monthly' | 'installments'; title: string }>({ isOpen: false, type: 'monthly', title: '' });

  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const recalcTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [dpPulse, setDpPulse] = useState(false);
  const dpPulseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [dpZeroPulse, setDpZeroPulse] = useState(false);
  const dpZeroPulseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const initialValues = useMemo(() => {
    const initDp = initialDownpayment ?? (
      (isEntryFrom21 && initialInstallments < ENTRY_FROM_THRESHOLD) ? 0
      : debtExceedsThreshold ? debtData.originalBalance * rules.downPaymentMinPercent : 0
    );
    return calculate({
      installments: initialInstallments,
      downpayment: initDp,
      totalDebt: debtData.originalBalance,
      downpaymentFixed: initialDownpaymentFixed ?? true,
    }, locale);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [displayedSavings, setDisplayedSavings] = useState(initialValues.savings);
  const savingsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const values: CalculateResult = useMemo(() => {
    const effectiveDp = isEntryFrom21 && installments < ENTRY_FROM_THRESHOLD ? 0 : downpayment;
    const result = calculate({ installments, downpayment: effectiveDp, totalDebt: debtData.originalBalance, downpaymentFixed, downpaymentUserSet }, locale, effectiveRules);
    const showDp = isEntryFrom21 ? installments >= ENTRY_FROM_THRESHOLD : true;
    return { ...result, needsDownpayment: showDp };
  }, [installments, downpayment, debtData.originalBalance, downpaymentFixed, downpaymentUserSet, locale, isEntryFrom21, effectiveRules]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
      if (dpPulseTimer.current) clearTimeout(dpPulseTimer.current);
      if (dpZeroPulseTimer.current) clearTimeout(dpZeroPulseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (savingsTimerRef.current) clearTimeout(savingsTimerRef.current);
    savingsTimerRef.current = setTimeout(() => setDisplayedSavings(values.savings), 250);
    return () => { if (savingsTimerRef.current) clearTimeout(savingsTimerRef.current); };
  }, [values.savings]);

  useEffect(() => {
    if (skipDownpaymentThreshold || isEntryFrom21) return;
    if (debtExceedsThreshold && downpayment === 0 && !initialDownpayment) {
      setDownpaymentUserSet(false);
      setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
      triggerDpPulse();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerDpPulse = useCallback(() => {
    setDpPulse(true);
    if (dpPulseTimer.current) clearTimeout(dpPulseTimer.current);
    dpPulseTimer.current = setTimeout(() => setDpPulse(false), 1200);
  }, []);

  const handleInstallmentsChange = useCallback((newN: number) => {
    setInstallments(newN);
    if (!isEntryFrom21) return;
    const prevNeeds = installments >= ENTRY_FROM_THRESHOLD;
    const nowNeeds = newN >= ENTRY_FROM_THRESHOLD;
    if (!prevNeeds && nowNeeds) {
      if (!hasShownAlertOnce) {
        setShowDownpaymentAlert(true);
        setHasShownAlertOnce(true);
      } else {
        triggerDpPulse();
      }
      setDownpaymentUserSet(false);
      setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
    }
    if (prevNeeds && !nowNeeds) {
      setDownpaymentUserSet(false);
      setDownpayment(0);
    }
  }, [isEntryFrom21, installments, hasShownAlertOnce, debtData, rules, triggerDpPulse]);

  const handleMonthlyChange = useCallback((newMonthly: number) => {
    const bestN = findBestInstallmentsForMonthly(newMonthly, downpayment, debtData.originalBalance, downpaymentFixed, locale);
    handleInstallmentsChange(bestN);
  }, [downpayment, debtData, downpaymentFixed, locale, handleInstallmentsChange]);

  const handleDownpaymentChange = useCallback((newDp: number) => {
    setDownpaymentUserSet(true);
    setDownpayment(newDp);
    if (newDp === 0) {
      setDpZeroPulse(true);
      if (dpZeroPulseTimer.current) clearTimeout(dpZeroPulseTimer.current);
      dpZeroPulseTimer.current = setTimeout(() => setDpZeroPulse(false), 900);
    }
  }, [debtData, rules, debtExceedsThreshold]);

  const handleContinue = () => {
    onContinue?.({
      installments,
      monthlyPayment: values.monthlyPayment,
      savings: values.savings,
      total: values.total,
      downpayment: skipDownpaymentThreshold ? 0 : downpayment,
      hasDownpayment: skipDownpaymentThreshold ? false : values.needsDownpayment,
      downpaymentFixed: skipDownpaymentThreshold ? false : downpaymentFixed,
      totalInterest: values.totalInterest,
      effectiveRate: values.effectiveRate,
    });
  };

  const paddedInstallments = installments < 10 ? `0${installments}` : String(installments);

  const openEditor = (type: 'downpayment' | 'monthly' | 'installments') => {
    const titles: Record<string, string> = { downpayment: sim.downPayment, monthly: sim.monthlyPayment, installments: sim.installments };
    setSheetState({ isOpen: true, type, title: titles[type] });
  };

  const applyEditorValue = useCallback((type: 'downpayment' | 'monthly' | 'installments', v: number) => {
    switch (type) {
      case 'monthly': handleMonthlyChange(v); break;
      case 'downpayment': handleDownpaymentChange(v); break;
      case 'installments': handleInstallmentsChange(Math.max(rules.minInstallments, Math.min(rules.maxInstallments, v))); break;
    }
  }, [handleMonthlyChange, handleDownpaymentChange, handleInstallmentsChange, rules]);

  const handleEditorConfirm = useCallback((v: number) => {
    const editorType = sheetState.type;
    if (simulatedLatencyMs > 0) {
      setRecalculating(true);
      if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
      recalcTimerRef.current = setTimeout(() => {
        applyEditorValue(editorType, v);
        setRecalculating(false);
      }, simulatedLatencyMs);
    } else {
      applyEditorValue(editorType, v);
    }
  }, [sheetState.type, simulatedLatencyMs, applyEditorValue]);

  const dpIsMandatory = debtExceedsThreshold && !isEntryFrom21;
  const dpHasValue = values.needsDownpayment && values.downpayment > 0;
  const dpLabel = dpHasValue ? sim.downPayment : sim.noDownPayment;
  const editorMin = sheetState.type === 'downpayment'
    ? (debtExceedsThreshold ? debtData.originalBalance * rules.downPaymentMinPercent : 0)
    : sheetState.type === 'installments' ? rules.minInstallments : undefined;
  const editorMax = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMaxPercent : sheetState.type === 'installments' ? rules.maxInstallments : undefined;
  const editorMandatoryHint = sheetState.type === 'downpayment' && dpIsMandatory ? sim.downPaymentMandatoryHint : undefined;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: palette.background, overflow: 'hidden' }}>
        <div style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', minHeight: 64 }}>
            <div style={{ width: 44, height: 44 }} />
            <div style={{ flex: 1 }} />
            <div style={{ width: 44, height: 44 }} />
          </div>
        </div>
        <WebSimulationShimmer palette={palette} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: palette.background, position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: withAlpha(palette.background, 0.67), backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', minHeight: 64 }}>
          {onBack && (
            <motion.button type="button" onClick={onBack} whileHover={{ background: palette.surface }} whileTap={{ scale: 0.88 }} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowBack color={palette.textPrimary} />
            </motion.button>
          )}
          <div style={{ flex: 1 }} />
          <motion.button type="button" onClick={() => setShowCalcSummary(true)} whileHover={{ background: palette.surface }} whileTap={{ scale: 0.88 }} aria-label={sim.subtitle} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InfoIcon color={palette.textPrimary} />
          </motion.button>
        </div>
        <div style={{ padding: '12px 20px 20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.96px', color: palette.textPrimary }}>
            {sim.title}
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Input zone */}
        <AnimatePresence mode="wait">
          {values.needsDownpayment ? (
            <motion.div
              key="inputs-horizontal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 148 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openEditor('downpayment')}
                animate={dpPulse ? {
                  scale: [1, 1.06, 0.97, 1.03, 1],
                  boxShadow: [`0 0 0 0px ${withAlpha(palette.accent, 0)}`, `0 0 0 8px ${withAlpha(palette.accent, 0.15)}`, `0 0 0 0px ${withAlpha(palette.accent, 0)}`],
                } : {}}
                transition={dpPulse ? { duration: 0.7, ease: 'easeOut' } : {}}
                style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 16 }}
              >
                <CurrencyValue symbol={curr.symbol} value={fmtNum(values.downpayment)} delay={0} fontSize={24} color={(dpPulse || dpZeroPulse) ? palette.accent : palette.textPrimary} letterSpacing="-2px" />
                <div style={{ height: 4, width: 'min(140px, 40vw)', background: (dpPulse || dpZeroPulse) ? palette.accent : palette.border, borderRadius: 2, transition: 'background 0.4s' }} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={dpLabel}
                    initial={{ opacity: 0, y: 6 }}
                    animate={dpZeroPulse ? { opacity: 1, y: 0, scale: [1, 1.08, 0.96, 1.03, 1] } : { opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={dpZeroPulse ? { duration: 0.6, ease: 'easeOut' } : { duration: 0.25 }}
                    style={{ fontSize: 14, fontWeight: dpIsMandatory ? 500 : 400, color: (dpPulse || dpZeroPulse) ? palette.accent : palette.textSecondary, letterSpacing: '-0.14px', transition: 'color 0.4s' }}
                  >
                    {dpLabel}
                    {dpIsMandatory && <span style={{ fontSize: 9, marginLeft: 4, verticalAlign: 'super', color: palette.accent }}>●</span>}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
              <div style={{ width: 0, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="1" height="90" viewBox="0 0 1 90"><line x1="0.5" y1="0" x2="0.5" y2="90" stroke={palette.border} /></svg>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor('monthly')} style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <CurrencyValue symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} delay={0.05} fontSize={24} color={palette.textPrimary} letterSpacing="-2px" />
                <div style={{ height: 4, width: 'min(140px, 40vw)', background: palette.border, borderRadius: 2 }} />
                <span style={{ fontSize: 14, fontWeight: 400, color: palette.textSecondary, letterSpacing: '-0.14px' }}>{sim.monthlyPayment}</span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="input-large"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openEditor('monthly')}
              style={{ width: '100%', height: 148, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
            >
              <CurrencyValue symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} delay={0.05} fontSize={44} color={palette.textPrimary} letterSpacing="-2px" />
              <div style={{ height: 4, width: 'min(220px, 60vw)', background: palette.border, borderRadius: 2 }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: palette.textSecondary, letterSpacing: '-0.14px' }}>{sim.monthlyPayment}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: 8 }} />

        {/* Installments */}
        <div style={{ width: '100%', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor('installments')} style={{ cursor: 'pointer' }}>
            <AnimatedNumber value={paddedInstallments} delay={0.1} fontSize={44} fontWeight={500} color={palette.textPrimary} letterSpacing="-1.32px" />
          </motion.div>
          <div style={{ height: 4, width: 'min(160px, 45vw)', background: palette.border, borderRadius: 2 }} />
          <span style={{ fontSize: 14, fontWeight: 400, color: palette.textSecondary, letterSpacing: '-0.14px' }}>{sim.installments}</span>

          {displayedSavings > SAVINGS_EPSILON && (
            <div style={{ padding: '0 20px', width: '100%', marginTop: 8 }}>
              <SavingsBanner savings={displayedSavings} symbol={curr.symbol} locale={locale} palette={palette} />
            </div>
          )}
        </div>

        {/* Slider */}
        <InstallmentsSlider
          value={installments}
          min={rules.minInstallments}
          max={rules.maxInstallments}
          onChange={handleInstallmentsChange}
          labelLeft={sim.sliderMoreDiscount}
          labelRight={sim.sliderMoreTime}
          palette={palette}
        />

        <div style={{ height: 16 }} />
      </motion.div>

      {/* Recalculating overlay (simulated server latency) */}
      <AnimatePresence>
        {recalculating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 20,
              background: withAlpha(palette.background, 0.82),
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 36, height: 36, borderRadius: 18,
                border: `3px solid ${palette.border}`,
                borderTopColor: palette.accent,
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: palette.textSecondary, letterSpacing: '-0.14px' }}>
              Atualizando valores...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout bar */}
      <CheckoutBottomBar
        total={fmtNum(values.total)}
        originalDebt={fmtNum(debtData.originalBalance)}
        symbol={curr.symbol}
        ctaLabel={sim.continue}
        onContinue={handleContinue}
        palette={palette}
      />

      {/* Bottom Sheets */}
      <CalcSummarySheet visible={showCalcSummary} onClose={() => setShowCalcSummary(false)} values={values} rules={rules} locale={locale} installments={installments} originalBalance={debtData.originalBalance} palette={palette} />
      <DownpaymentAlertSheet visible={showDownpaymentAlert} onClose={() => { setShowDownpaymentAlert(false); triggerDpPulse(); }} locale={locale} palette={palette} />
      <BottomSheetEditor
        visible={sheetState.isOpen}
        onClose={() => setSheetState((s) => ({ ...s, isOpen: false }))}
        type={sheetState.type}
        title={sheetState.title}
        currentValue={sheetState.type === 'downpayment' ? values.downpayment : sheetState.type === 'monthly' ? values.monthlyPayment : installments}
        minValue={editorMin}
        maxValue={editorMax}
        locale={locale}
        onValueChange={handleEditorConfirm}
        palette={palette}
        mandatoryHint={editorMandatoryHint}
      />
    </div>
  );
}
