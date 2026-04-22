import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { NText, Badge, Button, TopBar, typographyToCSS, typography } from '../nuds';
import type { NuDSWebTheme } from '../nuds';

/*
 * CURRENCY DISPLAY TYPEFACE
 *
 * The animated currency readouts (`AnimatedNumber`, `CurrencyValue`) render
 * freely-sized numerals at 24–44px. On Expo the equivalent components wrap
 * each slot in `<NText variant="titleMedium">`, which puts the text on
 * NuSansDisplay-Medium — the display cut with thicker stems that reads
 * noticeably heavier at large sizes.
 *
 * The web twins used raw <span>s, which inherited `Nu Sans Text` from
 * `body` and rendered visibly thinner than the Expo Go output even with
 * `fontWeight: 500` applied. Sourcing the fontFamily from the NuDS
 * titleMedium token here — instead of hard-coding "NuSansDisplay-Medium"
 * — keeps this on-token (no deflator) while matching the twin's weight.
 */
const CURRENCY_DISPLAY_FONT_FAMILY = typography.titleMedium.fontFamily;
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
  color,
  letterSpacing = '-1px',
}: {
  value: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  letterSpacing?: string;
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [dir, setDir] = useState<'up' | 'down'>('up');

  if (prevValue !== value) {
    const prevNum = parseFloat(prevValue.replace(/[^0-9.-]/g, '')) || 0;
    const currNum = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    setDir(currNum >= prevNum ? 'up' : 'down');
    setPrevValue(value);
  }

  const lineHeight = Math.ceil(fontSize * 1.2);
  const travel = lineHeight;
  /*
   * Negative `letterSpacing` (-1px / -2px) applied to the numerals below
   * makes the last glyph's right-side bearing extend slightly beyond the
   * inline-block's computed width. Combined with `overflow: hidden` (needed
   * to clip the vertical roulette animation), this clipped the rightmost
   * pixels of numbers like "R$ 496,35". Reserving a small right gutter
   * proportional to the fontSize restores the full glyph without affecting
   * layout.
   */
  const rightGutter = Math.ceil(fontSize * 0.08);

  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', height: lineHeight, position: 'relative', verticalAlign: 'middle', paddingRight: rightGutter, marginRight: -rightGutter }}>
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
            fontFamily: CURRENCY_DISPLAY_FONT_FAMILY,
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
  color,
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
    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span style={{
        fontFamily: CURRENCY_DISPLAY_FONT_FAMILY,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        lineHeight: `${lineHeight}px`,
        fontVariantNumeric: 'tabular-nums',
        /*
         * Explicit padding-right scaled to fontSize so the gap between
         * "R$" and the number matches the Expo twin, which draws a real
         * space character via `{symbol}{' '}` inside a single NText.
         * A flex `gap` or a trailing \u00A0 both got collapsed by some
         * whitespace-normalization paths in the inline-flex container —
         * this formula guarantees the separation at 24px and 44px alike.
         * 0.22em ≈ a NuSansDisplay space glyph width.
         */
        paddingRight: `${Math.round(fontSize * 0.22)}px`,
      }}>
        {symbol}
      </span>
      <AnimatedNumber value={value} delay={delay} fontSize={fontSize} fontWeight={fontWeight} color={color} letterSpacing={letterSpacing} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SVG Icons                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

function ArrowBack({ color }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
      <g transform="translate(5.955, 2.744)">
        <path d="M0.244078 6.66667L6.91074 0L8.08926 1.17851L2.01184 7.25592L8.08926 13.3333L6.91074 14.5118L0.244078 7.84518C-0.0813592 7.51974 -0.0813592 6.9921 0.244078 6.66667Z" fill={color} fillOpacity={0.62} />
      </g>
    </svg>
  );
}

function InfoIcon({ color }: { color?: string }) {
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
  t,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  labelLeft: string;
  labelRight: string;
  t: NuDSWebTheme;
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
    <div className="nf-proto__slider" style={{ width: '100%', padding: `${t.spacing[4]}px ${t.spacing[5]}px` }}>
      <div
        ref={sliderRef}
        style={{ height: containerH, width: '100%', cursor: 'pointer', position: 'relative', touchAction: 'none' }}
        onClick={handleTrackClick}
      >
        {/* Track */}
        <div className="nf-proto__slider__track" style={{ position: 'absolute', top: trackTop, left: 0, right: 0, height: 4, background: t.color.border.secondary, borderRadius: t.radius.md }} />
        {/* Progress */}
        <motion.div
          className="nf-proto__slider__fill"
          animate={{ width: `calc(${pct}% - ${(thumbW / 2) * (1 - pct / 100)}px + ${thumbW / 2}px)` }}
          transition={springConfig}
          style={{ position: 'absolute', top: trackTop, left: 0, height: 4, background: t.color.main, borderRadius: t.radius.md }}
        />
        {/* Thumb */}
        <motion.div
          className="nf-proto__slider__thumb"
          animate={{ left: `calc(${pct}% - ${thumbW / 2}px)` }}
          transition={springConfig}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            position: 'absolute', top: thumbTop,
            width: thumbW, height: thumbW, borderRadius: '50%', background: t.color.main,
            zIndex: 2, touchAction: 'none',
            cursor: dragging ? 'grabbing' : 'grab',
            scale: dragging ? 1.35 : 1,
            boxShadow: dragging ? `0px 4px 16px ${withAlpha(t.color.main, 0.35)}` : 'none',
            transition: 'scale 0.15s, box-shadow 0.15s',
          }}
        >
          <AnimatePresence>
            <motion.div
              key={tickPulse}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${withAlpha(t.color.main, 0.3)}`, pointerEvents: 'none' }}
            />
          </AnimatePresence>
        </motion.div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0 ${t.spacing[1]}px`, marginTop: t.spacing[1] }}>
        <NText variant="labelXSmallStrong" tone="secondary" theme={t}>{labelLeft}</NText>
        <NText variant="labelXSmallStrong" tone="secondary" theme={t}>{labelRight}</NText>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Savings Banner                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function SavingsBanner({ savings, symbol, locale, t }: { savings: number; symbol: string; locale: Locale; t: NuDSWebTheme }) {
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
    const timer = setTimeout(() => {
      bannerControls.start({
        scale: [1, 1.045, 0.98, 1],
        transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [savings, bannerControls]);

  const i18n = getTranslations(locale);

  return (
    <motion.div
      animate={bannerControls}
      initial={{ opacity: 0, scale: 0.92 }}
      style={{
        background: t.color.surface.success, borderRadius: t.radius.lg, padding: `15px ${t.spacing[4]}px`,
        border: `1px solid ${t.color.positive}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        width: '100%',
      }}
    >
      <NText variant="labelSmallDefault" color={t.color.positive} theme={t}>
        {i18n.simulation.totalSavings}
      </NText>
      <NText variant="labelSmallStrong" color={t.color.positive} theme={t}>
        {symbol}
      </NText>
      {/* AnimatedNumber keeps raw fontSize because it's a motion.span primitive
          that directly animates scale/opacity on the number itself. 14px matches
          NuDS labelSmallStrong. */}
      <AnimatedNumber value={formatted} delay={0.2} fontSize={t.typography.labelSmallStrong.fontSize as number} fontWeight={600} color={t.color.positive} letterSpacing="0px" />
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
  t,
}: {
  total: string;
  originalDebt: string;
  symbol: string;
  ctaLabel: string;
  onContinue: () => void;
  t: NuDSWebTheme;
}) {
  return (
    <div style={{
      background: t.color.background.screen, width: '100%', borderTop: `1px solid ${t.color.border.secondary}`,
      position: 'sticky', bottom: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: t.spacing[5] }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: t.spacing[1] }}>
          <NText
            variant="subtitleMediumStrong"
            theme={t}
            tabularNumbers
            style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          >
            Total: {symbol} {total}
          </NText>
          <NText
            variant="subtitleSmallDefault"
            tone="secondary"
            theme={t}
            tabularNumbers
            style={{ textDecoration: 'line-through' }}
          >
            {symbol} {originalDebt}
          </NText>
        </div>
        {/*
         * NuDS <Button> + motion wrapper: hover/tap micro-interactions are
         * preserved via motion.div's whileHover/whileTap. The Button itself
         * gets all of its visual treatment (fill, radius, elevation, typography)
         * from the design system — the inline inset-bevel trickery the old
         * motion.button reproduced by hand is gone.
         */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} style={{ flexShrink: 0 }}>
          <Button variant="primary" label={ctaLabel} onClick={onContinue} theme={t} />
        </motion.div>
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
  t,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  backdropOpacity?: number;
  borderRadius?: number;
  spring?: object;
  t: NuDSWebTheme;
  children: React.ReactNode;
}) {
  const defaultSpring = { type: 'spring', stiffness: 380, damping: 34, mass: 0.75 };
  return (
    <AnimatePresence>
      {visible && (
        <div className="nf-proto__sheet-backdrop" style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            // Dynamic-opacity backdrop (0.4 default, 0.5 for alerts). NuDS web
            // exposes `surface.overlay` as a fixed `rgba(31,2,48,0.62)` token,
            // which can't host variable opacity without string mangling —
            // declared as a documented extension in SCREEN_REPORTS.
            style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${backdropOpacity})` }}
          />
          <motion.div
            className="nf-proto__sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring ?? defaultSpring}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.color.background.screen,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              // NuDS web elevation tokens (level1/2/3) are all downward shadows
              // for floating cards. Bottom-sheets need an upward shadow at the
              // top edge — no equivalent token exists. Kept as a documented
              // extension (same case as the PIN sheet).
              boxShadow: '0px -4px 32px rgba(0,0,0,0.10)',
              position: 'relative', zIndex: 1,
              maxHeight: '90%', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
              <div style={{ width: 36, height: 5, borderRadius: t.radius.full, background: t.color.border.secondary }} />
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
  t,
}: {
  visible: boolean;
  onClose: () => void;
  values: CalculateResult;
  rules: FinancialRules;
  locale: Locale;
  installments: number;
  originalBalance: number;
  t: NuDSWebTheme;
}) {
  const i18n = getTranslations(locale);
  const curr = getUseCaseForLocale(locale).currency;
  const fmt = (v: number) => formatCurrency(v, curr);
  const sim = i18n.simulation;

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
  rows.push({ label: dateStr, value: interpolate(i18n.summary.everyDay, { day: String(dayNum) }) });
  if (values.totalInterest > 0) {
    rows.push({ label: i18n.summary.totalInterest, value: fmt(values.totalInterest), negative: true });
  }
  if (values.savings > SAVINGS_EPSILON) {
    rows.push({ label: i18n.summary.totalAmountToPay, value: `- ${fmt(values.savings)}`, savings: true });
  }
  rows.push({ label: sim.total, value: fmt(values.total), highlight: true });

  return (
    <BottomSheet visible={visible} onClose={onClose} t={t}>
      <div style={{ padding: `${t.spacing[6]}px ${t.spacing[5]}px ${t.spacing[4]}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 22px had no NuDS composite (lives between 20 `titleXSmall` and
            24 `titleSmall`). Aligned up to titleSmall for DS parity. */}
        <NText variant="titleSmall" as="h2" theme={t} style={{ margin: 0 }}>{sim.subtitle}</NText>
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            width: 36, height: 36, borderRadius: 18, border: 'none',
            background: t.color.background.secondary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            // The ✕ glyph is a Unicode character rendered as text; using the
            // NuDS paragraphMediumDefault size (16) as the raw numeric so
            // motion.button's inline style stays in sync.
            fontSize: t.typography.paragraphMediumDefault.fontSize,
            color: t.color.content.primary,
          }}
        >
          ✕
        </motion.button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh', padding: `0 ${t.spacing[5]}px ${t.spacing[3]}px` }}>
        {rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', gap: t.spacing[3] }}>
              <NText
                variant={row.savings ? 'labelSmallStrong' : 'labelSmallDefault'}
                color={row.savings ? t.color.content.primary : t.color.content.secondary}
                theme={t}
              >
                {row.label}
              </NText>
              <NText
                variant="labelSmallStrong"
                color={row.negative ? t.color.negative : row.savings ? t.color.positive : row.highlight ? t.color.content.primary : t.color.content.secondary}
                theme={t}
                tabularNumbers
              >
                {row.value}
              </NText>
            </div>
            {i < rows.length - 1 && <div style={{ height: 1, background: t.color.border.secondary }} />}
          </div>
        ))}
      </div>
      <div style={{ padding: `${t.spacing[2]}px ${t.spacing[5]}px 28px` }}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button variant="primary" label={sim.close} onClick={onClose} expanded theme={t} />
        </motion.div>
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
  t,
}: {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
  t: NuDSWebTheme;
}) {
  const sim = getTranslations(locale).simulation;
  const htmlBody = sim.downPaymentRequiredMessage;
  const parts = htmlBody.split(/<\/?strong>/);

  return (
    <BottomSheet visible={visible} onClose={onClose} backdropOpacity={0.5} borderRadius={32} spring={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }} t={t}>
      <div style={{ padding: `${t.spacing[4]}px ${t.spacing[6]}px 32px`, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: t.color.surface.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={t.color.main} strokeWidth={2} />
            <line x1="12" y1="11" x2="12" y2="16" stroke={t.color.main} strokeWidth={2} strokeLinecap="round" />
            <circle cx="12" cy="8" r="1" fill={t.color.main} />
          </svg>
        </div>
        <NText
          variant="titleSmall"
          as="h2"
          theme={t}
          style={{ margin: `0 0 ${t.spacing[3]}px` }}
        >
          {sim.downPaymentRequired}
        </NText>
        <NText
          variant="paragraphMediumDefault"
          tone="secondary"
          as="p"
          theme={t}
          style={{ margin: `0 0 ${t.spacing[6]}px` }}
        >
          {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>)}
        </NText>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="primary" label={sim.gotIt} onClick={onClose} expanded theme={t} />
        </motion.div>
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
  t,
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
  t: NuDSWebTheme;
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

  const [prevVisibleValue, setPrevVisibleValue] = useState({ visible, currentValue, isCurrency });
  if (
    visible &&
    (prevVisibleValue.visible !== visible ||
     prevVisibleValue.currentValue !== currentValue ||
     prevVisibleValue.isCurrency !== isCurrency)
  ) {
    if (isCurrency) setInputValue(String(Math.round(currentValue * 100)));
    else setInputValue(String(currentValue));
    setHasStarted(false);
    setPrevVisibleValue({ visible, currentValue, isCurrency });
  } else if (
    prevVisibleValue.visible !== visible ||
    prevVisibleValue.currentValue !== currentValue ||
    prevVisibleValue.isCurrency !== isCurrency
  ) {
    setPrevVisibleValue({ visible, currentValue, isCurrency });
  }

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
    <BottomSheet visible={visible} onClose={onClose} spring={{ type: 'spring', stiffness: 400, damping: 36, mass: 0.8 }} t={t}>
      <div style={{ padding: `${t.spacing[2]}px ${t.spacing[2]}px ${t.spacing[1]}px`, display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center', minHeight: 64 }}>
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
          style={{
            width: 44, height: 44, border: 'none', background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.color.content.primary, opacity: 0.62,
            // ✕ glyph sized to NuDS subtitleMedium scale (18px) via token
            // instead of a raw 18 literal.
            fontSize: t.typography.subtitleMediumDefault.fontSize,
          }}
        >
          ✕
        </motion.button>
        <NText variant="labelSmallStrong" theme={t} style={{ textAlign: 'center' }}>{title}</NText>
        <div />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${t.spacing[4]}px ${t.spacing[5]}px` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: t.spacing[1] }}>
          <motion.div
            key={isOutOfRange ? 'shake' : 'still'}
            animate={{ x: isOutOfRange ? [0, -6, 6, -4, 4, 0] : 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'center', gap: t.spacing[1] }}
          >
            {isCurrency && <NText variant="titleLarge" color={isOutOfRange ? t.color.negative : undefined} theme={t} style={{ transition: 'color 0.2s' }}>{curr.symbol}</NText>}
            <NText variant="titleLarge" color={isOutOfRange ? t.color.negative : undefined} theme={t} tabularNumbers style={{ transition: 'color 0.2s' }}>
              {displayValue}
            </NText>
          </motion.div>
          {!isCurrency && <NText variant="labelSmallDefault" tone="secondary" theme={t}>{sim.installmentsSuffix}</NText>}
        </div>

        <AnimatePresence mode="wait">
          {errorText ? (
            <motion.div key="error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
              <NText variant="labelSmallStrong" color={t.color.negative} theme={t} as="p" style={{ margin: '6px 0 0' }}>
                {errorText}
              </NText>
            </motion.div>
          ) : hintText ? (
            <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <NText variant="labelXSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: '4px 0 0' }}>
                {hintText}
              </NText>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {isCurrency && (
          <NText variant="labelXSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: `${t.spacing[2]}px 0 0`, textAlign: 'center', padding: `0 ${t.spacing[3]}px` }}>
            {sim.editorApproximateHint}
          </NText>
        )}
      </div>

      {mandatoryHint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden', margin: `0 ${t.spacing[5]}px` }}
        >
          <div style={{
            padding: `10px 14px`, borderRadius: t.radius.md, marginBottom: t.spacing[3],
            background: `linear-gradient(135deg, ${withAlpha(t.color.main, 0.06)}, ${withAlpha(t.color.main, 0.03)})`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="7" stroke={t.color.main} strokeWidth="1.5" fill="none" />
              <path d="M8 5v3.5M8 10.5h.005" stroke={t.color.main} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <NText variant="labelXSmallDefault" tone="secondary" theme={t}>{mandatoryHint}</NText>
          </div>
        </motion.div>
      )}

      <div style={{ height: 1, background: t.color.border.secondary, margin: `0 ${t.spacing[5]}px` }} />

      <div style={{ padding: `${t.spacing[2]}px ${t.spacing[4]}px ${t.spacing[2]}px` }}>
        {keys.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', marginBottom: t.spacing[1] }}>
            {row.map((k, ci) => (
              <div key={ci} style={{ flex: 1, margin: `0 ${t.spacing[1]}px` }}>
                {k === '' ? <div style={{ height: 52 }} /> : (
                  <motion.button
                    type="button"
                    onClick={() => handleKey(k)}
                    whileTap={{ scale: 0.92, background: withAlpha(t.color.main, 0.12) }}
                    style={{
                      width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: k === 'back' ? t.color.surface.accentSubtle : t.color.background.secondary,
                      fontFamily: t.typography.titleXSmall.fontFamily,
                      fontSize: t.typography.titleXSmall.fontSize,
                      fontWeight: k === 'back' ? 400 : 500,
                      color: k === 'back' ? t.color.main : t.color.content.primary,
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

      <div style={{ padding: `${t.spacing[2]}px ${t.spacing[5]}px 28px` }}>
        <motion.button
          type="button"
          onClick={handleConfirm}
          disabled={isOutOfRange}
          whileHover={!isOutOfRange ? { scale: 1.02 } : undefined}
          whileTap={!isOutOfRange ? { scale: 0.97 } : undefined}
          style={{
            width: '100%', height: 52, borderRadius: t.radius.xl, border: 'none',
            background: isOutOfRange ? t.color.border.secondary : t.color.main, cursor: isOutOfRange ? 'not-allowed' : 'pointer',
            fontFamily: t.typography.labelSmallStrong.fontFamily,
            fontSize: t.typography.labelSmallStrong.fontSize, fontWeight: 600,
            color: isOutOfRange ? t.color.content.secondary : t.color.content.main,
            boxShadow: isOutOfRange ? 'none' : `0px 2px 8px ${withAlpha(t.color.main, 0.25)}`,
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

function ShimmerBar({ width, height, radius = 8, t }: { width: number | string; height: number; radius?: number; t: NuDSWebTheme }) {
  return (
    <motion.div
      animate={{ opacity: [0.25, 0.5, 0.25] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width, height, borderRadius: radius, background: t.color.border.secondary }}
    />
  );
}

function WebSimulationShimmer({ t }: { t: NuDSWebTheme }) {
  return (
    <div style={{ flex: 1, padding: `${t.spacing[3]}px ${t.spacing[5]}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Title placeholder */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: t.spacing[2], marginBottom: 28 }}>
        <ShimmerBar width="75%" height={32} radius={t.radius.md} t={t} />
        <ShimmerBar width="55%" height={32} radius={t.radius.md} t={t} />
      </div>
      {/* Currency value */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: t.spacing[3], height: 148, justifyContent: 'center' }}>
        <ShimmerBar width={200} height={44} radius={10} t={t} />
        <ShimmerBar width="min(220px, 60%)" height={4} radius={2} t={t} />
        <ShimmerBar width={100} height={14} radius={6} t={t} />
      </div>
      {/* Installments */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: t.spacing[3], padding: `${t.spacing[6]}px 0` }}>
        <ShimmerBar width={80} height={44} radius={10} t={t} />
        <ShimmerBar width="min(160px, 45%)" height={4} radius={2} t={t} />
        <ShimmerBar width={120} height={14} radius={6} t={t} />
      </div>
      {/* Savings banner */}
      <div style={{ width: '100%', padding: `0 ${t.spacing[5]}px`, marginBottom: t.spacing[5] }}>
        <ShimmerBar width="100%" height={52} radius={t.radius.lg} t={t} />
      </div>
      {/* Slider */}
      <div style={{ width: '100%', padding: `0 ${t.spacing[5]}px`, display: 'flex', flexDirection: 'column', gap: t.spacing[2] }}>
        <ShimmerBar width="100%" height={4} radius={2} t={t} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <ShimmerBar width={90} height={12} radius={t.spacing[1]} t={t} />
          <ShimmerBar width={70} height={12} radius={t.spacing[1]} t={t} />
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
  const { nuds } = useTheme();
  const t = nuds;
  const { simulatedLatencyMs, debtOverrides, effectiveRules } = useEmulatorConfig();
  const i18n = getTranslations(locale);
  const sim = i18n.simulation;
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
  const [downpaymentFixed] = useState(initialDownpaymentFixed ?? true);
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

  const [initialValues] = useState(() => {
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
  });
  const [displayedSavings, setDisplayedSavings] = useState(initialValues.savings);
  const savingsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const values: CalculateResult = useMemo(() => {
    const effectiveDp = isEntryFrom21 && installments < ENTRY_FROM_THRESHOLD ? 0 : downpayment;
    const result = calculate({ installments, downpayment: effectiveDp, totalDebt: debtData.originalBalance, downpaymentFixed, downpaymentUserSet }, locale, effectiveRules);
    const showDp = isEntryFrom21 ? installments >= ENTRY_FROM_THRESHOLD : true;
    return { ...result, needsDownpayment: showDp };
  }, [installments, downpayment, debtData.originalBalance, downpaymentFixed, downpaymentUserSet, locale, isEntryFrom21, effectiveRules, ENTRY_FROM_THRESHOLD]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), Math.max(400, simulatedLatencyMs));
    return () => clearTimeout(timer);
  }, [simulatedLatencyMs]);

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

  const triggerDpPulse = useCallback(() => {
    setDpPulse(true);
    if (dpPulseTimer.current) clearTimeout(dpPulseTimer.current);
    dpPulseTimer.current = setTimeout(() => setDpPulse(false), 1200);
  }, []);

  useEffect(() => {
    if (skipDownpaymentThreshold || isEntryFrom21) return;
    if (debtExceedsThreshold && downpayment === 0 && !initialDownpayment) {
      const timer = setTimeout(() => {
        setDownpaymentUserSet(false);
        setDownpayment(debtData.originalBalance * rules.downPaymentMinPercent);
        triggerDpPulse();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [isEntryFrom21, installments, hasShownAlertOnce, debtData, rules, triggerDpPulse, ENTRY_FROM_THRESHOLD]);

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
  }, []);

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
      <div className="nf-proto" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.color.background.screen, overflow: 'hidden' }}>
        <div className="nf-proto__safe-top" style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${t.spacing[2]}px`, minHeight: 64 }}>
            <div style={{ width: 44, height: 44 }} />
            <div style={{ flex: 1 }} />
            <div style={{ width: 44, height: 44 }} />
          </div>
        </div>
        <WebSimulationShimmer t={t} />
      </div>
    );
  }

  return (
    <div className="nf-proto" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: t.color.background.screen, position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="nf-proto__safe-top" style={{
        background: withAlpha(t.color.background.screen, 0.67), backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${t.spacing[2]}px`, minHeight: 64 }}>
          {onBack && (
            <motion.button type="button" onClick={onBack} whileHover={{ background: t.color.background.secondary }} whileTap={{ scale: 0.88 }} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowBack color={t.color.content.primary} />
            </motion.button>
          )}
          <div style={{ flex: 1 }} />
          <motion.button type="button" onClick={() => setShowCalcSummary(true)} whileHover={{ background: t.color.background.secondary }} whileTap={{ scale: 0.88 }} aria-label={sim.subtitle} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InfoIcon color={t.color.content.primary} />
          </motion.button>
        </div>
        <div style={{ padding: `${t.spacing[3]}px ${t.spacing[5]}px ${t.spacing[5]}px`, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.96px', color: t.color.content.primary }}>
            {sim.title}
          </h1>
        </div>
      </div>

      {/* Scrollable content */}
      <motion.div className="nf-proto__scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                  boxShadow: [`0 0 0 0px ${withAlpha(t.color.main, 0)}`, `0 0 0 8px ${withAlpha(t.color.main, 0.15)}`, `0 0 0 0px ${withAlpha(t.color.main, 0)}`],
                } : {}}
                transition={dpPulse ? { duration: 0.7, ease: 'easeOut' } : {}}
                style={{ flex: 1, padding: t.spacing[5], display: 'flex', flexDirection: 'column', alignItems: 'center', gap: t.spacing[2], cursor: 'pointer', borderRadius: t.radius.lg }}
              >
                <CurrencyValue symbol={curr.symbol} value={fmtNum(values.downpayment)} delay={0} fontSize={24} color={(dpPulse || dpZeroPulse) ? t.color.main : t.color.content.primary} letterSpacing="-2px" />
                <div style={{ height: 4, width: 'min(140px, 40vw)', background: (dpPulse || dpZeroPulse) ? t.color.main : t.color.border.secondary, borderRadius: 2, transition: 'background 0.4s' }} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={dpLabel}
                    initial={{ opacity: 0, y: 6 }}
                    animate={dpZeroPulse ? { opacity: 1, y: 0, scale: [1, 1.08, 0.96, 1.03, 1] } : { opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={dpZeroPulse ? { duration: 0.6, ease: 'easeOut' } : { duration: 0.25 }}
                    // Animated label — uses the NuDS labelSmall composites
                    // (via typographyToCSS) for correct font/weight/lineHeight
                    // instead of raw fontSize 14 that duplicated the token.
                    style={{
                      ...typographyToCSS(dpIsMandatory ? t.typography.labelSmallStrong : t.typography.labelSmallDefault),
                      color: (dpPulse || dpZeroPulse) ? t.color.main : t.color.content.secondary,
                      transition: 'color 0.4s',
                    }}
                  >
                    {dpLabel}
                    {dpIsMandatory && (
                      // Mandatory-field marker: previously a ● glyph at fontSize 9
                      // (below NuDS composite scale). Now a pure shape — same
                      // visual, zero typography dependency.
                      <span style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        marginLeft: t.spacing[1],
                        verticalAlign: 'super',
                        borderRadius: 3,
                        background: t.color.main,
                      }} />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
              <div style={{ width: 0, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="1" height="90" viewBox="0 0 1 90"><line x1="0.5" y1="0" x2="0.5" y2="90" stroke={t.color.border.secondary} /></svg>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor('monthly')} style={{ flex: 1, padding: t.spacing[5], display: 'flex', flexDirection: 'column', alignItems: 'center', gap: t.spacing[2], cursor: 'pointer' }}>
                <CurrencyValue symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} delay={0.05} fontSize={24} color={t.color.content.primary} letterSpacing="-2px" />
                <div style={{ height: 4, width: 'min(140px, 40vw)', background: t.color.border.secondary, borderRadius: 2 }} />
                <NText variant="labelSmallDefault" tone="secondary" theme={t}>{sim.monthlyPayment}</NText>
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
              style={{ width: '100%', height: 148, padding: t.spacing[5], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: t.spacing[2], cursor: 'pointer' }}
            >
              <CurrencyValue symbol={curr.symbol} value={fmtNum(values.monthlyPayment)} delay={0.05} fontSize={44} color={t.color.content.primary} letterSpacing="-2px" />
              <div style={{ height: 4, width: 'min(220px, 60vw)', background: t.color.border.secondary, borderRadius: 2 }} />
              <NText variant="labelSmallDefault" tone="secondary" theme={t}>{sim.monthlyPayment}</NText>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: t.spacing[2] }} />

        {/* Installments */}
        <div style={{ width: '100%', padding: t.spacing[5], display: 'flex', flexDirection: 'column', alignItems: 'center', gap: t.spacing[2] }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openEditor('installments')} style={{ cursor: 'pointer' }}>
            <AnimatedNumber value={paddedInstallments} delay={0.1} fontSize={44} fontWeight={500} color={t.color.content.primary} letterSpacing="-1.32px" />
          </motion.div>
          <div style={{ height: 4, width: 'min(160px, 45vw)', background: t.color.border.secondary, borderRadius: 2 }} />
          <NText variant="labelSmallDefault" tone="secondary" theme={t}>{sim.installments}</NText>

          {displayedSavings > SAVINGS_EPSILON && (
            <div style={{ padding: `0 ${t.spacing[5]}px`, width: '100%', marginTop: t.spacing[2] }}>
              <SavingsBanner savings={displayedSavings} symbol={curr.symbol} locale={locale} t={t} />
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
          t={t}
        />

        <div style={{ height: t.spacing[4] }} />
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
              background: withAlpha(t.color.background.screen, 0.82),
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: t.spacing[4],
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 36, height: 36, borderRadius: 18,
                border: `3px solid ${t.color.border.secondary}`,
                borderTopColor: t.color.main,
              }}
            />
            <NText variant="labelSmallStrong" tone="secondary" theme={t}>
              Atualizando valores...
            </NText>
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
        t={t}
      />

      {/* Bottom Sheets */}
      <CalcSummarySheet visible={showCalcSummary} onClose={() => setShowCalcSummary(false)} values={values} rules={rules} locale={locale} installments={installments} originalBalance={debtData.originalBalance} t={t} />
      <DownpaymentAlertSheet visible={showDownpaymentAlert} onClose={() => { setShowDownpaymentAlert(false); triggerDpPulse(); }} locale={locale} t={t} />
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
        t={t}
        mandatoryHint={editorMandatoryHint}
      />
    </div>
  );
}
