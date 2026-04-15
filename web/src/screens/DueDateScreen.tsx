import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { getTranslations, interpolate } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import { getUseCaseForLocale } from '../../../config/useCases';
import { formatCurrency } from '../../../config/formatters';
import { useEmulatorConfig } from '../context/EmulatorConfigContext';
import { getNextBusinessDays, isBusinessDay, addBusinessDays } from '../../../config/financialCalculator';

const STAGGER = 0.08;

export interface DueDateDynamicData {
  installments: number;
  monthlyPayment: number;
  savings: number;
  total: number;
  downpayment?: number;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function getDayLabel(date: Date, locale: Locale, today: Date, t: ReturnType<typeof getTranslations>): string {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, today)) return t.dates.today;
  if (isSameDay(date, tomorrow)) return t.dates.tomorrow;
  return date
    .toLocaleDateString(locale, { weekday: 'short' })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function getMonthDayStr(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
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

function CloseIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5L15 15M15 5L5 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeft({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12 5L7 10L12 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M8 5L13 10L8 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarScheduledIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6.66667 1.66667V3.33333M13.3333 1.66667V3.33333M2.5 8.33333H17.5M4.16667 3.33333H15.8333C16.7538 3.33333 17.5 4.07953 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16667C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07953 3.24619 3.33333 4.16667 3.33333Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="13" r="2" fill={color} />
    </svg>
  );
}

function DateTile({
  date,
  selected,
  dayLabel,
  locale,
  onPress,
  palette,
  animateDay = false,
}: {
  date: Date;
  selected: boolean;
  dayLabel: string;
  locale: Locale;
  onPress: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
  animateDay?: boolean;
}) {
  const monthDayStr = getMonthDayStr(date, locale);
  const prevStr = useRef(monthDayStr);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (animateDay && monthDayStr !== prevStr.current) {
      prevStr.current = monthDayStr;
      setAnimKey((k) => k + 1);
    }
  }, [monthDayStr, animateDay]);

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
        borderRadius: 16,
        border: `${selected ? 2 : 1}px solid ${selected ? palette.accent : palette.border}`,
        background: selected ? palette.accentSubtle : palette.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ height: 18, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {animateDay ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={animKey}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                fontSize: 14, fontWeight: 600, lineHeight: 1.3,
                color: selected ? palette.accent : palette.textPrimary,
              }}
            >
              {monthDayStr}
            </motion.span>
          </AnimatePresence>
        ) : (
          <span style={{
            fontSize: 14, fontWeight: 600, lineHeight: 1.3,
            color: selected ? palette.accent : palette.textPrimary,
            transition: 'color 0.15s',
          }}>
            {monthDayStr}
          </span>
        )}
      </div>

      <span style={{
        fontSize: 14, fontWeight: 400, lineHeight: 1.3,
        color: selected ? palette.accent : palette.textSecondary,
        textAlign: 'left', maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        transition: 'color 0.15s',
      }}>
        {dayLabel}
      </span>
    </button>
  );
}

function InfoRow({
  label,
  value,
  showDivider,
  palette,
  valueColor,
}: {
  label: string;
  value?: string;
  showDivider: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  valueColor?: string;
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
      }}>
        <span style={{ fontSize: 14, color: valueColor || palette.textPrimary, transition: 'color 0.3s' }}>{label}</span>
        {value && (
          <span style={{ fontSize: 14, fontWeight: 600, color: palette.textSecondary, transition: 'color 0.3s' }}>
            {value}
          </span>
        )}
      </div>
      {showDivider && <div style={{ height: 1, background: palette.border, transition: 'background 0.3s' }} />}
    </div>
  );
}

function MiniCalendar({
  selectedDate,
  minDate,
  maxDate,
  locale,
  onSelect,
  palette,
}: {
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  locale: Locale;
  onSelect: (d: Date) => void;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate);
    d.setDate(1);
    return d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthLabel = viewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase());

  const t = getTranslations(locale);
  const weekDays = t.dates.weekdayInitial;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goBack = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };
  const goForward = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={goBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft color={palette.textSecondary} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary, transition: 'color 0.3s' }}>
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={goForward}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight color={palette.textSecondary} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {weekDays.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 500, color: palette.textSecondary, padding: '4px 0', transition: 'color 0.3s' }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const cellDate = new Date(year, month, day);
          const isSelected = isSameDay(cellDate, selectedDate);
          const inRange = cellDate >= minDate && cellDate <= maxDate && isBusinessDay(cellDate);
          return (
            <button
              key={i}
              type="button"
              disabled={!inRange}
              onClick={() => inRange && onSelect(cellDate)}
              style={{
                width: '100%', aspectRatio: '1',
                borderRadius: '50%',
                border: isSelected ? `2px solid ${palette.accent}` : 'none',
                background: isSelected ? palette.accentSubtle : 'transparent',
                color: isSelected ? palette.accent : inRange ? palette.textPrimary : palette.textSecondary,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 400,
                cursor: inRange ? 'pointer' : 'default',
                opacity: inRange ? 1 : 0.35,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type DueDateVariant = 'first-installment-date' | 'downpayment-date' | 'single-payment-date';

export default function DueDateScreen({
  locale = 'pt-BR',
  onBack,
  onContinue,
  dynamicData,
  variant = 'first-installment-date',
}: {
  locale?: Locale;
  onBack?: () => void;
  onContinue?: (date: Date) => void;
  dynamicData?: DueDateDynamicData;
  variant?: DueDateVariant;
}) {
  const { palette } = useTheme();
  const t = getTranslations(locale);
  const dd = t.dueDate;
  const variantKey = variant === 'downpayment-date' ? 'downpaymentDate' : variant === 'single-payment-date' ? 'singlePaymentDate' : 'firstInstallmentDate';
  const variantT = dd.variants[variantKey];
  const useCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const { effectiveRules } = useEmulatorConfig();
  const businessDays = effectiveRules.dueDateBusinessDays;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const firstThreeBusinessDays = useMemo(() => getNextBusinessDays(today, 3), [today]);
  const tile0Date = firstThreeBusinessDays[0];
  const tile1Date = firstThreeBusinessDays[1];
  const defaultTile2Date = firstThreeBusinessDays[2];

  const maxDate = useMemo(() => addBusinessDays(today, businessDays), [today, businessDays]);

  const [selectedDate, setSelectedDate] = useState<Date>(tile0Date);
  const [tile2Date, setTile2Date] = useState<Date>(defaultTile2Date);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [calendarPreviewDate, setCalendarPreviewDate] = useState<Date>(defaultTile2Date);

  const isTile0 = isSameDay(selectedDate, tile0Date);
  const isTile1 = isSameDay(selectedDate, tile1Date);
  const isTile2 = isSameDay(selectedDate, tile2Date);

  const handleCalendarPreview = useCallback((date: Date) => {
    if (isBusinessDay(date) && date >= today && date <= maxDate) {
      setCalendarPreviewDate(date);
    }
  }, [today, maxDate]);

  const handleCalendarConfirm = useCallback(() => {
    setTile2Date(calendarPreviewDate);
    setSelectedDate(calendarPreviewDate);
    setSheetOpen(false);
  }, [calendarPreviewDate]);

  const handleOpenCalendar = useCallback(() => {
    setCalendarPreviewDate(tile2Date);
    setSheetOpen(true);
  }, [tile2Date]);

  const showDownpayment = (dynamicData?.downpayment ?? 0) > 0;
  const baseDelay = 0.08;

  const selectedDateStr = getMonthDayStr(selectedDate, locale);
  const ctaLabel = dynamicData
    ? `${dd.continue} ${fmtAmount(dynamicData.monthlyPayment)}`
    : dd.continue;

  const tile2DayLabel = getDayLabel(tile2Date, locale, today, t);

  const prevDateStr = useRef(selectedDateStr);
  const [dateAnimKey, setDateAnimKey] = useState(0);
  useEffect(() => {
    if (selectedDateStr !== prevDateStr.current) {
      prevDateStr.current = selectedDateStr;
      setDateAnimKey((k) => k + 1);
    }
  }, [selectedDateStr]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: palette.background, color: palette.textPrimary,
      transition: 'background 0.3s, color 0.3s',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* TopBar with title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.36 }}
        style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', minHeight: 56 }}>
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
            {variantT.title}
          </span>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 96 }}>
        {/* Heading - Title Medium (same as InstallmentValueScreen) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: baseDelay }}
          style={{ padding: '8px 20px 4px' }}
        >
          <h2 style={{
            fontSize: 28, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.84px',
            margin: 0, color: palette.textPrimary, transition: 'color 0.3s',
          }}>
            {variantT.heading}
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: baseDelay + 0.06 }}
          style={{ padding: '4px 20px 16px' }}
        >
          <p style={{ fontSize: 14, color: palette.textSecondary, margin: 0, lineHeight: 1.5, transition: 'color 0.3s' }}>
            {dd.paymentScheduleInfo}
          </p>
        </motion.div>

        {/* Simulation info */}
        {dynamicData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: baseDelay + 0.1 }}
            style={{
              marginLeft: 20, marginRight: 20, marginBottom: 16,
              borderRadius: 16, border: `1px solid ${palette.border}`, overflow: 'hidden',
              transition: 'border-color 0.3s',
            }}
          >
            {showDownpayment && (
              <InfoRow
                label={dd.downpayment}
                value={fmtAmount(dynamicData.downpayment!)}
                showDivider
                palette={palette}
              />
            )}
            <InfoRow
              label={interpolate(dd.installmentsOf, { count: String(dynamicData.installments) })}
              value={fmtAmount(dynamicData.monthlyPayment)}
              showDivider
              palette={palette}
            />
            <InfoRow
              label={interpolate(dd.amountOff, { amount: fmtAmount(dynamicData.savings) })}
              showDivider
              palette={palette}
              valueColor={palette.positive}
            />
            <InfoRow
              label={`Total: ${fmtAmount(dynamicData.total)}`}
              showDivider={false}
              palette={palette}
            />
          </motion.div>
        )}

        {/* Section title + "Other dates" link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: baseDelay + 0.14 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 4px' }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: palette.textPrimary, transition: 'color 0.3s' }}>
            {dd.sectionTitle}
          </span>
          <button
            type="button"
            onClick={handleOpenCalendar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: palette.accent, padding: 0 }}
          >
            {dd.otherDates}
          </button>
        </motion.div>

        {/* Date tiles - flex 1 for 100% width distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: baseDelay + 0.18 }}
          style={{ display: 'flex', gap: 8, padding: '8px 20px 4px' }}
        >
          <DateTile
            date={tile0Date}
            selected={isTile0}
            dayLabel={getDayLabel(tile0Date, locale, today, t)}
            locale={locale}
            onPress={() => setSelectedDate(tile0Date)}
            palette={palette}
          />
          <DateTile
            date={tile1Date}
            selected={isTile1}
            dayLabel={getDayLabel(tile1Date, locale, today, t)}
            locale={locale}
            onPress={() => setSelectedDate(tile1Date)}
            palette={palette}
          />
          <DateTile
            date={tile2Date}
            selected={isTile2}
            animateDay
            dayLabel={tile2DayLabel}
            locale={locale}
            onPress={() => setSelectedDate(tile2Date)}
            palette={palette}
          />
        </motion.div>
      </div>

      {/* CTA with dynamic value + roulette date */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 28px',
          background: `linear-gradient(to top, ${palette.background} 80%, transparent)`,
          transition: 'background 0.3s',
        }}
      >
        <button
          type="button"
          onClick={() => onContinue?.(selectedDate)}
          style={{
            width: '100%', height: 52, borderRadius: 26,
            background: palette.accent, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'background 0.15s',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: palette.textOnAccent }}>{ctaLabel}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: palette.textOnAccent }}> • </span>
          <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', height: 22 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={dateAnimKey}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ fontSize: 15, fontWeight: 700, color: palette.textOnAccent }}
              >
                {selectedDateStr}
              </motion.span>
            </AnimatePresence>
          </div>
        </button>
      </motion.div>

      {/* Calendar bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setSheetOpen(false)}
              style={{ position: 'absolute', inset: 0, background: palette.overlay, zIndex: 10 }}
            />

            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: palette.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                zIndex: 11,
                padding: '0 0 28px',
                transition: 'background 0.3s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: palette.border, transition: 'background 0.3s' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 16px' }}>
                <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: palette.textPrimary, transition: 'color 0.3s' }}>
                  {dd.calendarTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <CloseIcon color={palette.textSecondary} />
                </button>
              </div>

              <div style={{ padding: '0 20px' }}>
                <MiniCalendar
                  selectedDate={calendarPreviewDate}
                  minDate={today}
                  maxDate={maxDate}
                  locale={locale}
                  onSelect={handleCalendarPreview}
                  palette={palette}
                />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 20px',
              }}>
                <CalendarScheduledIcon color={palette.textSecondary} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: palette.textSecondary, margin: 0, transition: 'color 0.3s' }}>
                    {t.summary.monthlyPaymentDate}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary, margin: 0, display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 2 }}>{variantT.calendarInfoPrefix}</span>
                    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', overflow: 'hidden', height: 20, minWidth: 16 }}>
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={calendarPreviewDate.getDate()}
                          initial={{ y: 16, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -16, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          style={{ display: 'block', lineHeight: '20px' }}
                        >
                          {calendarPreviewDate.getDate()}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span>{variantT.calendarInfoSuffix}</span>
                  </p>
                </div>
              </div>

              <div style={{ padding: '0 20px' }}>
                <button
                  type="button"
                  onClick={handleCalendarConfirm}
                  style={{
                    width: '100%', height: 52, borderRadius: 26,
                    background: palette.accent, border: 'none', cursor: 'pointer',
                    fontSize: 15, fontWeight: 700, color: palette.textOnAccent,
                    transition: 'background 0.15s',
                  }}
                >
                  {dd.calendarSelectDate}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
