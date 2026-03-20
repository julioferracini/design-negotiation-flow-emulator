import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { getTranslations } from '../../../i18n';
import type { Locale } from '../../../i18n/types';
import {
  calculate,
  getRules,
  getSimDebtData,
  findBestInstallmentsForMonthly,
  type CalculateResult,
  type FinancialRules,
} from '../../../config/financialCalculator';
import { formatCurrency, interpolate } from '../../../config/formatters';
import { getUseCaseForLocale } from '../../../config/useCases';

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
  accentColor,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  labelLeft: string;
  labelRight: string;
  accentColor: string;
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
        <div style={{ position: 'absolute', top: trackTop, left: 0, right: 0, height: 4, background: '#e3e0e5', borderRadius: 8 }} />
        {/* Progress */}
        <motion.div
          animate={{ width: `calc(${pct}% - ${(thumbW / 2) * (1 - pct / 100)}px + ${thumbW / 2}px)` }}
          transition={springConfig}
          style={{ position: 'absolute', top: trackTop, left: 0, height: 4, background: accentColor, borderRadius: 8 }}
        />
        {/* Thumb */}
        <motion.div
          animate={{ left: `calc(${pct}% - ${thumbW / 2}px)` }}
          transition={springConfig}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            position: 'absolute', top: thumbTop,
            width: thumbW, height: thumbW, borderRadius: '50%', background: accentColor,
            zIndex: 2, touchAction: 'none',
            cursor: dragging ? 'grabbing' : 'grab',
            scale: dragging ? 1.35 : 1,
            boxShadow: dragging ? '0px 4px 16px rgba(130,10,209,0.35)' : 'none',
            transition: 'scale 0.15s, box-shadow 0.15s',
          }}
        >
          <AnimatePresence>
            <motion.div
              key={tickPulse}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(130,10,209,0.3)', pointerEvents: 'none' }}
            />
          </AnimatePresence>
        </motion.div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(31,2,48,0.62)', letterSpacing: '0.12px' }}>{labelLeft}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(31,2,48,0.62)', letterSpacing: '0.12px' }}>{labelRight}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Savings Banner                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function SavingsBanner({ savings, symbol, locale }: { savings: number; symbol: string; locale: Locale }) {
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
      <span style={{ fontSize: 14, fontWeight: 400, color: '#0c7a3a' }}>
        {t.simulation.totalSavings}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0c7a3a' }}>
        {symbol}
      </span>
      <AnimatedNumber value={formatted} delay={0.2} fontSize={14} fontWeight={700} color="#0c7a3a" letterSpacing="0px" />
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
  locale,
  ctaLabel,
  onContinue,
}: {
  total: string;
  originalDebt: string;
  symbol: string;
  locale: Locale;
  ctaLabel: string;
  onContinue: () => void;
}) {
  return (
    <div style={{
      background: '#fff', width: '100%', borderTop: '1px solid rgba(31,2,48,0.08)',
      position: 'sticky', bottom: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 20 }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1f0230', letterSpacing: '-0.54px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontVariantNumeric: 'tabular-nums' }}>
            Total: {symbol} {total}
          </span>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(31,2,48,0.62)', textDecoration: 'line-through', letterSpacing: '-0.48px', fontVariantNumeric: 'tabular-nums' }}>
            {symbol} {originalDebt}
          </span>
        </div>
        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          style={{
            height: 48, padding: '0 24px', borderRadius: 64, background: '#820ad1', border: 'none', cursor: 'pointer', flexShrink: 0,
            boxShadow: '0px 1px 0px 0px rgba(31,0,47,0.05), inset 0px 1px 0px 0px rgba(255,255,255,0.08), inset 0px -1px 0px 0px rgba(31,2,48,0.46)',
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
  children,
}: {
  visible: boolean;
  onClose: () => void;
  backdropOpacity?: number;
  borderRadius?: number;
  spring?: object;
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
              background: '#fff',
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              boxShadow: '0px -4px 32px rgba(0,0,0,0.10)',
              position: 'relative', zIndex: 1,
              maxHeight: '90%', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
              <div style={{ width: 36, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.12)' }} />
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
}: {
  visible: boolean;
  onClose: () => void;
  values: CalculateResult;
  rules: FinancialRules;
  locale: Locale;
  installments: number;
}) {
  const t = getTranslations(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const fmt = (v: number) => formatCurrency(v, curr);
  const sim = t.simulation;

  const today = new Date();
  const firstPayment = new Date(today);
  firstPayment.setDate(firstPayment.getDate() + 30);
  const dayNum = firstPayment.getDate();
  const dateStr = firstPayment.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

  type Row = { label: string; value: string; highlight?: boolean; negative?: boolean; savings?: boolean };
  const rows: Row[] = [
    { label: sim.total, value: fmt(getSimDebtData(locale).originalBalance) },
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
  if (values.savings > 0.01) {
    rows.push({ label: t.summary.totalAmountToPay, value: `- ${fmt(values.savings)}`, savings: true });
  }
  rows.push({ label: sim.total, value: fmt(values.total), highlight: true });

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1f0230', letterSpacing: '-0.66px' }}>{sim.subtitle}</h2>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#1f0230' }}>
          ✕
        </motion.button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh', padding: '0 20px 12px' }}>
        {rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: row.savings ? 500 : 400, color: row.savings ? '#1f0230' : 'rgba(0,0,0,0.52)', letterSpacing: '-0.14px' }}>
                {row.label}
              </span>
              <span style={{
                fontSize: 14, fontWeight: 600, letterSpacing: '-0.14px', fontVariantNumeric: 'tabular-nums',
                color: row.negative ? '#c0392b' : row.savings ? '#2eab57' : row.highlight ? '#1f0230' : 'rgba(0,0,0,0.78)',
              }}>
                {row.value}
              </span>
            </div>
            {i < rows.length - 1 && <div style={{ height: 1, background: 'rgba(31,2,48,0.07)' }} />}
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 20px 28px' }}>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: '100%', height: 52, borderRadius: 26, background: '#820ad1', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#fff', boxShadow: '0px 2px 8px rgba(130,10,209,0.25)' }}>
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
}: {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
}) {
  const sim = getTranslations(locale).simulation;
  const htmlBody = sim.downPaymentRequiredMessage;
  const parts = htmlBody.split(/<\/?strong>/);

  return (
    <BottomSheet visible={visible} onClose={onClose} backdropOpacity={0.5} borderRadius={32} spring={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}>
      <div style={{ padding: '16px 24px 32px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(130,10,209,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#820AD1" strokeWidth={2} />
            <line x1="12" y1="11" x2="12" y2="16" stroke="#820AD1" strokeWidth={2} strokeLinecap="round" />
            <circle cx="12" cy="8" r="1" fill="#820AD1" />
          </svg>
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 500, color: '#1f0230', letterSpacing: '-0.72px' }}>
          {sim.downPaymentRequired}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 15, fontWeight: 400, color: 'rgba(0,0,0,0.64)', lineHeight: 1.5 }}>
          {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>)}
        </p>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%', height: 52, borderRadius: 26, background: '#820ad1', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#fff', boxShadow: '0px 2px 8px rgba(130,10,209,0.25)' }}>
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
  downpaymentFixed,
  onToggleFixed,
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
  downpaymentFixed?: boolean;
  onToggleFixed?: () => void;
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
  const isBelowMin = minValue !== undefined && numericValue < minValue && numericValue > 0;
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

  const hintText = minValue !== undefined && maxValue !== undefined
    ? `${interpolate(sim.downPaymentMinimum, { amount: formatCurrency(minValue, curr) })} · ${interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) })}`
    : undefined;

  const errorText = isBelowMin && minValue !== undefined
    ? interpolate(sim.downPaymentBelowMinimum, { amount: formatCurrency(minValue, curr) })
    : isAboveMax && maxValue !== undefined
      ? interpolate(sim.downPaymentMaximum, { amount: formatCurrency(maxValue, curr) })
      : undefined;

  const keys = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'back']];

  return (
    <BottomSheet visible={visible} onClose={onClose} spring={{ type: 'spring', stiffness: 400, damping: 36, mass: 0.8 }}>
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: '#1f0230', letterSpacing: '-0.6px' }}>{title}</span>
        <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#1f0230' }}>
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
          {isCurrency && <span style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.96px', color: isOutOfRange ? '#d4183d' : '#1f0230', transition: 'color 0.2s' }}>{curr.symbol}</span>}
          <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-1.2px', color: isOutOfRange ? '#d4183d' : '#1f0230', fontVariantNumeric: 'tabular-nums', transition: 'color 0.2s' }}>
            {displayValue}
          </span>
          {!isCurrency && <span style={{ fontSize: 18, fontWeight: 400, color: 'rgba(0,0,0,0.44)', marginLeft: 2 }}>x</span>}
        </motion.div>

        <AnimatePresence mode="wait">
          {errorText ? (
            <motion.p key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 500, color: '#d4183d' }}>
              {errorText}
            </motion.p>
          ) : hintText ? (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.4)' }}>
              {hintText}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {type === 'downpayment' && onToggleFixed && (
          <button
            type="button"
            onClick={onToggleFixed}
            style={{
              width: '100%', marginTop: 12, padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: downpaymentFixed ? 'rgba(130,10,209,0.06)' : 'rgba(0,0,0,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: downpaymentFixed ? '#820ad1' : 'rgba(0,0,0,0.56)' }}>{sim.keepForAllInstallments}</div>
              <div style={{ fontSize: 11, fontWeight: 400, color: downpaymentFixed ? 'rgba(130,10,209,0.5)' : 'rgba(0,0,0,0.32)' }}>{sim.keepForAllInstallmentsSubtitle}</div>
            </div>
            <div style={{ width: 40, height: 24, borderRadius: 12, background: downpaymentFixed ? '#820ad1' : 'rgba(0,0,0,0.16)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <motion.div animate={{ left: downpaymentFixed ? 18 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 10, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </div>
          </button>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(31,2,48,0.07)', margin: '0 20px' }} />

      <div style={{ padding: '8px 16px 8px' }}>
        {keys.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', marginBottom: 4 }}>
            {row.map((k, ci) => (
              <div key={ci} style={{ flex: 1, margin: '0 4px' }}>
                {k === '' ? <div style={{ height: 52 }} /> : (
                  <motion.button
                    type="button"
                    onClick={() => handleKey(k)}
                    whileTap={{ scale: 0.92, background: 'rgba(130,10,209,0.12)' }}
                    style={{
                      width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: k === 'back' ? 'rgba(130,10,209,0.06)' : 'rgba(31,2,48,0.04)',
                      fontSize: 20, fontWeight: k === 'back' ? 400 : 600,
                      color: k === 'back' ? '#820ad1' : '#1f0230',
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
            background: isOutOfRange ? '#c7c7cc' : '#820ad1', cursor: isOutOfRange ? 'not-allowed' : 'pointer',
            fontSize: 15, fontWeight: 600, color: isOutOfRange ? 'rgba(255,255,255,0.72)' : '#fff',
            boxShadow: isOutOfRange ? 'none' : '0px 2px 8px rgba(130,10,209,0.25)',
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
/*  Main SimulationScreen                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export default function SimulationScreen({
  locale,
  onBack,
  onContinue,
  initialInstallments = 10,
  initialDownpayment,
  initialDownpaymentFixed,
  skipDownpaymentThreshold = false,
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
  }) => void;
  initialInstallments?: number;
  initialDownpayment?: number;
  initialDownpaymentFixed?: boolean;
  skipDownpaymentThreshold?: boolean;
}) {
  const { palette } = useTheme();
  const t = getTranslations(locale);
  const sim = t.simulation;
  const rules = getRules(locale);
  const debtData = getSimDebtData(locale);
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtNum = useCallback((v: number) => formatCurrency(v, curr, { showSymbol: false }), [curr]);

  const [installments, setInstallments] = useState(initialInstallments);
  const [downpayment, setDownpayment] = useState(initialDownpayment ?? 0);
  const [downpaymentFixed, setDownpaymentFixed] = useState(initialDownpaymentFixed ?? false);

  const [showDownpaymentAlert, setShowDownpaymentAlert] = useState(false);
  const [hasShownAlertOnce, setHasShownAlertOnce] = useState(false);
  const [showCalcSummary, setShowCalcSummary] = useState(false);
  const [sheetState, setSheetState] = useState<{ isOpen: boolean; type: 'downpayment' | 'monthly' | 'installments'; title: string }>({ isOpen: false, type: 'monthly', title: '' });

  const [displayedSavings, setDisplayedSavings] = useState(0);
  const savingsDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const values: CalculateResult = useMemo(
    () => calculate({ installments, downpayment, totalDebt: debtData.originalBalance, downpaymentFixed }, locale),
    [installments, downpayment, debtData.originalBalance, downpaymentFixed, locale],
  );

  useEffect(() => {
    if (savingsDebounceRef.current) clearTimeout(savingsDebounceRef.current);
    savingsDebounceRef.current = setTimeout(() => setDisplayedSavings(values.savings), 520);
    return () => { if (savingsDebounceRef.current) clearTimeout(savingsDebounceRef.current); };
  }, [values.savings]);

  useEffect(() => {
    if (skipDownpaymentThreshold) return;
    if (initialInstallments > rules.downPaymentThreshold && downpayment === 0 && !initialDownpayment) {
      setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstallmentsChange = useCallback((newN: number) => {
    const prevNeeds = installments > rules.downPaymentThreshold;
    const nowNeeds = newN > rules.downPaymentThreshold;
    setInstallments(newN);
    if (skipDownpaymentThreshold) return;
    if (!prevNeeds && nowNeeds) {
      if (!hasShownAlertOnce) {
        setShowDownpaymentAlert(true);
        setHasShownAlertOnce(true);
      }
      if (!downpaymentFixed) setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
    }
    if (prevNeeds && !nowNeeds && !downpaymentFixed) {
      setDownpayment(0);
    }
  }, [installments, rules, skipDownpaymentThreshold, hasShownAlertOnce, downpaymentFixed, debtData]);

  const handleMonthlyChange = useCallback((newMonthly: number) => {
    const bestN = findBestInstallmentsForMonthly(newMonthly, downpayment, debtData.originalBalance, downpaymentFixed, locale);
    handleInstallmentsChange(bestN);
  }, [downpayment, debtData, downpaymentFixed, locale, handleInstallmentsChange]);

  const handleDownpaymentChange = useCallback((newDp: number) => {
    const minDp = debtData.originalBalance * rules.downPaymentMinPercent;
    const maxDp = debtData.originalBalance * rules.downPaymentMaxPercent;
    setDownpayment(Math.max(minDp, Math.min(maxDp, newDp)));
  }, [debtData, rules]);

  const handleContinue = () => {
    onContinue?.({
      installments,
      monthlyPayment: values.monthlyPayment,
      savings: values.savings,
      total: values.total,
      downpayment: skipDownpaymentThreshold ? 0 : downpayment,
      hasDownpayment: skipDownpaymentThreshold ? false : values.needsDownpayment,
      downpaymentFixed: skipDownpaymentThreshold ? false : downpaymentFixed,
    });
  };

  const paddedInstallments = installments < 10 ? `0${installments}` : String(installments);

  const openEditor = (type: 'downpayment' | 'monthly' | 'installments') => {
    const titles: Record<string, string> = { downpayment: sim.downPayment, monthly: sim.monthlyPayment, installments: sim.installments };
    setSheetState({ isOpen: true, type, title: titles[type] });
  };

  const handleEditorConfirm = (v: number) => {
    switch (sheetState.type) {
      case 'monthly': handleMonthlyChange(v); break;
      case 'downpayment': handleDownpaymentChange(v); break;
      case 'installments': handleInstallmentsChange(Math.max(rules.minInstallments, Math.min(rules.maxInstallments, v))); break;
    }
  };

  const editorMin = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMinPercent : sheetState.type === 'installments' ? rules.minInstallments : undefined;
  const editorMax = sheetState.type === 'downpayment' ? debtData.originalBalance * rules.downPaymentMaxPercent : sheetState.type === 'installments' ? rules.maxInstallments : undefined;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: palette.background, position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.67)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', minHeight: 64 }}>
          {onBack && (
            <motion.button type="button" onClick={onBack} whileHover={{ background: 'rgba(31,2,48,0.05)' }} whileTap={{ scale: 0.88 }} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowBack />
            </motion.button>
          )}
          <div style={{ flex: 1 }} />
          <motion.button type="button" onClick={() => setShowCalcSummary(true)} whileHover={{ background: 'rgba(31,2,48,0.06)' }} whileTap={{ scale: 0.88 }} aria-label={sim.subtitle} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InfoIcon />
          </motion.button>
        </div>
        <div style={{ padding: '12px 20px 20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.96px', color: '#1f0230' }}>
            {sim.title}
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Input zone */}
        <AnimatePresence mode="wait">
          {values.needsDownpayment ? (
            <motion.div
              key="inputs-horizontal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 148 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor('downpayment')} style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <CurrencyValue symbol={curr.symbol} value={fmtNum(values.downpayment)} delay={0} fontSize={24} color="#1f002f" letterSpacing="-2px" />
                <div style={{ height: 4, width: 'min(140px, 40vw)', background: '#efefef', borderRadius: 2 }} />
                <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.64)', letterSpacing: '-0.14px' }}>{sim.downPayment}</span>
              </motion.div>
              <div style={{ width: 0, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="1" height="90" viewBox="0 0 1 90"><line x1="0.5" y1="0" x2="0.5" y2="90" stroke="#1F0230" strokeOpacity={0.08} /></svg>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor('monthly')} style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <CurrencyValue symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} delay={0.05} fontSize={24} color="#1f002f" letterSpacing="-2px" />
                <div style={{ height: 4, width: 'min(140px, 40vw)', background: '#efefef', borderRadius: 2 }} />
                <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.64)', letterSpacing: '-0.14px' }}>{sim.monthlyPayment}</span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="input-large"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openEditor('monthly')}
              style={{ width: '100%', height: 148, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
            >
              <CurrencyValue symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} delay={0.05} fontSize={44} color="#1f002f" letterSpacing="-2px" />
              <div style={{ height: 4, width: 'min(220px, 60vw)', background: '#efefef', borderRadius: 2 }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.64)', letterSpacing: '-0.14px' }}>{sim.monthlyPayment}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: 8 }} />

        {/* Installments */}
        <div style={{ width: '100%', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor('installments')} style={{ cursor: 'pointer' }}>
            <AnimatedNumber value={paddedInstallments} delay={0.1} fontSize={44} fontWeight={500} color="#1f0230" letterSpacing="-1.32px" />
          </motion.div>
          <div style={{ height: 4, width: 'min(160px, 45vw)', background: '#efefef', borderRadius: 2 }} />
          <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0,0,0,0.64)', letterSpacing: '-0.14px' }}>{sim.installments}</span>

          {displayedSavings > 0.01 && (
            <div style={{ padding: '0 20px', width: '100%', marginTop: 8 }}>
              <SavingsBanner savings={displayedSavings} symbol={curr.symbol} locale={locale} />
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
          accentColor="#820ad1"
        />

        <div style={{ height: 16 }} />
      </div>

      {/* Checkout bar */}
      <CheckoutBottomBar
        total={fmtNum(values.total)}
        originalDebt={fmtNum(debtData.originalBalance)}
        symbol={curr.symbol}
        locale={locale}
        ctaLabel={sim.continue}
        onContinue={handleContinue}
      />

      {/* Bottom Sheets */}
      <CalcSummarySheet visible={showCalcSummary} onClose={() => setShowCalcSummary(false)} values={values} rules={rules} locale={locale} installments={installments} />
      <DownpaymentAlertSheet visible={showDownpaymentAlert} onClose={() => setShowDownpaymentAlert(false)} locale={locale} />
      <BottomSheetEditor
        visible={sheetState.isOpen}
        onClose={() => setSheetState((s) => ({ ...s, isOpen: false }))}
        type={sheetState.type}
        title={sheetState.title}
        currentValue={sheetState.type === 'downpayment' ? downpayment : sheetState.type === 'monthly' ? values.monthlyPayment : installments}
        minValue={editorMin}
        maxValue={editorMax}
        locale={locale}
        onValueChange={handleEditorConfirm}
        downpaymentFixed={downpaymentFixed}
        onToggleFixed={sheetState.type === 'downpayment' ? () => setDownpaymentFixed((f) => !f) : undefined}
      />
    </div>
  );
}
