import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { getTranslations, interpolate } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import { getUseCaseForLocale } from '../../../config/useCases';
import { formatCurrency } from '../../../config/formatters';
import { useEmulatorConfig } from '../context/EmulatorConfigContext';
import { getNextBusinessDays, isBusinessDay, addBusinessDays } from '../../../config/financialCalculator';
import { NText } from '../nuds';
import type { NuDSWebTheme } from '../nuds';
import { useScreenLoading } from '../hooks/useScreenLoading';
import { GenericShimmer } from '../components/ScreenShimmer';

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

function getDayLabel(date: Date, locale: Locale, today: Date, tr: ReturnType<typeof getTranslations>): string {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, today)) return tr.dates.today;
  if (isSameDay(date, tomorrow)) return tr.dates.tomorrow;
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
  t,
  animateDay = false,
}: {
  date: Date;
  selected: boolean;
  dayLabel: string;
  locale: Locale;
  onPress: () => void;
  t: NuDSWebTheme;
  animateDay?: boolean;
}) {
  const monthDayStr = getMonthDayStr(date, locale);
  const [prevMonthDay, setPrevMonthDay] = useState(monthDayStr);
  const [animKey, setAnimKey] = useState(0);

  if (animateDay && monthDayStr !== prevMonthDay) {
    setPrevMonthDay(monthDayStr);
    setAnimKey((k) => k + 1);
  }

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        paddingTop: t.spacing[4],
        paddingBottom: t.spacing[4],
        paddingLeft: t.spacing[4],
        paddingRight: t.spacing[4],
        borderRadius: t.radius.lg,
        border: `${selected ? 2 : 1}px solid ${selected ? t.color.main : t.color.border.secondary}`,
        background: selected ? t.color.surface.accentSubtle : t.color.background.screen,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: t.spacing[1],
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
                color: selected ? t.color.main : t.color.content.primary,
              }}
            >
              {monthDayStr}
            </motion.span>
          </AnimatePresence>
        ) : (
          <NText
            variant="labelSmallStrong"
            theme={t}
            color={selected ? t.color.main : undefined}
            style={{ lineHeight: 1.3, transition: 'color 0.15s' }}
          >
            {monthDayStr}
          </NText>
        )}
      </div>

      <NText
        variant="paragraphSmallDefault"
        tone={selected ? undefined : 'secondary'}
        color={selected ? t.color.main : undefined}
        theme={t}
        style={{
          lineHeight: 1.3,
          textAlign: 'left', maxWidth: '100%',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.15s',
        }}
      >
        {dayLabel}
      </NText>
    </button>
  );
}

function InfoRow({
  label,
  value,
  showDivider,
  t,
  valueColor,
}: {
  label: string;
  value?: string;
  showDivider: boolean;
  t: NuDSWebTheme;
  valueColor?: string;
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `14px ${t.spacing[4]}px`,
      }}>
        <NText variant="paragraphSmallDefault" theme={t} color={valueColor}>
          {label}
        </NText>
        {value && (
          <NText variant="labelSmallStrong" tone="secondary" theme={t}>
            {value}
          </NText>
        )}
      </div>
      {showDivider && <div style={{ height: 1, background: t.color.border.secondary, transition: 'background 0.3s' }} />}
    </div>
  );
}

function MiniCalendar({
  selectedDate,
  minDate,
  maxDate,
  locale,
  onSelect,
  t,
}: {
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  locale: Locale;
  onSelect: (d: Date) => void;
  t: NuDSWebTheme;
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

  const tr = getTranslations(locale);
  const weekDays = tr.dates.weekdayInitial;

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
    <div className="nf-proto__calendar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing[3] }}>
        <button
          type="button"
          onClick={goBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: t.spacing[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft color={t.color.content.secondary} />
        </button>
        <NText variant="labelSmallStrong" theme={t}>
          {monthLabel}
        </NText>
        <button
          type="button"
          onClick={goForward}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: t.spacing[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight color={t.color.content.secondary} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: t.spacing[1] }}>
        {weekDays.map((d, i) => (
          <NText
            key={i}
            variant="label2XSmallDefault"
            tone="secondary"
            theme={t}
            className="nf-proto__calendar__weekday"
            style={{ textAlign: 'center', padding: `${t.spacing[1]}px 0` }}
          >
            {d}
          </NText>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="nf-proto__calendar__day--empty" />;
          const cellDate = new Date(year, month, day);
          const isSelected = isSameDay(cellDate, selectedDate);
          const inRange = cellDate >= minDate && cellDate <= maxDate && isBusinessDay(cellDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isToday = isSameDay(cellDate, today);

          let dayClassName = 'nf-proto__calendar__day';
          if (isSelected) dayClassName += ' nf-proto__calendar__day--selected';
          if (isToday) dayClassName += ' nf-proto__calendar__day--today';
          if (!inRange) dayClassName += ' nf-proto__calendar__day--disabled';

          return (
            <button
              key={i}
              type="button"
              disabled={!inRange}
              onClick={() => inRange && onSelect(cellDate)}
              className={dayClassName}
              style={{
                width: '100%', aspectRatio: '1',
                borderRadius: t.radius.full,
                border: isSelected ? `2px solid ${t.color.main}` : 'none',
                background: isSelected ? t.color.surface.accentSubtle : 'transparent',
                color: isSelected ? t.color.main : inRange ? t.color.content.primary : t.color.content.secondary,
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
  const { nuds } = useTheme();
  const t = nuds;
  const { loading } = useScreenLoading();
  const tr = getTranslations(locale);
  const dd = tr.dueDate;
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

  const handleCalendarConfirm = () => {
    setTile2Date(calendarPreviewDate);
    setSelectedDate(calendarPreviewDate);
    setSheetOpen(false);
  };

  const handleOpenCalendar = () => {
    setCalendarPreviewDate(tile2Date);
    setSheetOpen(true);
  };

  const showDownpayment = (dynamicData?.downpayment ?? 0) > 0;
  const baseDelay = 0.08;

  const selectedDateStr = getMonthDayStr(selectedDate, locale);
  const ctaLabel = dynamicData
    ? `${dd.continue} ${fmtAmount(dynamicData.monthlyPayment)}`
    : dd.continue;

  const tile2DayLabel = getDayLabel(tile2Date, locale, today, tr);

  const [prevDateStr, setPrevDateStr] = useState(selectedDateStr);
  const [dateAnimKey, setDateAnimKey] = useState(0);

  if (selectedDateStr !== prevDateStr) {
    setPrevDateStr(selectedDateStr);
    setDateAnimKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="nf-proto" style={{ background: t.color.background.screen, color: t.color.content.primary, width: '100%', height: '100%' }}>
        <GenericShimmer t={t} />
      </div>
    );
  }

  return (
    <div className="nf-proto" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: t.color.background.screen, color: t.color.content.primary,
      transition: 'background 0.3s, color 0.3s',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* TopBar with title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.36 }}
        className="nf-proto__safe-top"
        style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: `0 ${t.spacing[1]}px`, minHeight: 56 }}>
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
          <NText
            variant="labelSmallStrong"
            theme={t}
            style={{
              flex: 1, textAlign: 'center',
              marginRight: onBack ? 44 : 0,
            }}
          >
            {variantT.title}
          </NText>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div className="nf-proto__scroll" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 96 }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: baseDelay }}
          style={{ padding: `${t.spacing[2]}px ${t.spacing[5]}px ${t.spacing[1]}px` }}
        >
          <NText
            variant="titleMedium"
            as="h2"
            theme={t}
            style={{ letterSpacing: '-0.84px' }}
          >
            {variantT.heading}
          </NText>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: baseDelay + 0.06 }}
          style={{ padding: `${t.spacing[1]}px ${t.spacing[5]}px ${t.spacing[4]}px` }}
        >
          <NText variant="paragraphSmallDefault" tone="secondary" as="p" theme={t}>
            {dd.paymentScheduleInfo}
          </NText>
        </motion.div>

        {/* Simulation info */}
        {dynamicData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: baseDelay + 0.1 }}
            style={{
              marginLeft: t.spacing[5], marginRight: t.spacing[5], marginBottom: t.spacing[4],
              borderRadius: t.radius.lg, border: `1px solid ${t.color.border.secondary}`, overflow: 'hidden',
              transition: 'border-color 0.3s',
            }}
          >
            {showDownpayment && (
              <InfoRow
                label={dd.downpayment}
                value={fmtAmount(dynamicData.downpayment!)}
                showDivider
                t={t}
              />
            )}
            <InfoRow
              label={interpolate(dd.installmentsOf, { count: String(dynamicData.installments) })}
              value={fmtAmount(dynamicData.monthlyPayment)}
              showDivider
              t={t}
            />
            <InfoRow
              label={interpolate(dd.amountOff, { amount: fmtAmount(dynamicData.savings) })}
              showDivider
              t={t}
              valueColor={t.color.positive}
            />
            <InfoRow
              label={`Total: ${fmtAmount(dynamicData.total)}`}
              showDivider={false}
              t={t}
            />
          </motion.div>
        )}

        {/* Section title + "Other dates" link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: baseDelay + 0.14 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${t.spacing[3]}px ${t.spacing[5]}px ${t.spacing[1]}px` }}
        >
          <NText variant="subtitleSmallStrong" theme={t}>
            {dd.sectionTitle}
          </NText>
          <button
            type="button"
            onClick={handleOpenCalendar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <NText variant="labelSmallStrong" color={t.color.main} theme={t}>
              {dd.otherDates}
            </NText>
          </button>
        </motion.div>

        {/* Date tiles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: baseDelay + 0.18 }}
          style={{ display: 'flex', gap: t.spacing[2], padding: `${t.spacing[2]}px ${t.spacing[5]}px ${t.spacing[1]}px` }}
        >
          <DateTile
            date={tile0Date}
            selected={isTile0}
            dayLabel={getDayLabel(tile0Date, locale, today, tr)}
            locale={locale}
            onPress={() => setSelectedDate(tile0Date)}
            t={t}
          />
          <DateTile
            date={tile1Date}
            selected={isTile1}
            dayLabel={getDayLabel(tile1Date, locale, today, tr)}
            locale={locale}
            onPress={() => setSelectedDate(tile1Date)}
            t={t}
          />
          <DateTile
            date={tile2Date}
            selected={isTile2}
            animateDay
            dayLabel={tile2DayLabel}
            locale={locale}
            onPress={() => setSelectedDate(tile2Date)}
            t={t}
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
          padding: `${t.spacing[3]}px ${t.spacing[5]}px 28px`,
          background: `linear-gradient(to top, ${t.color.background.screen} 80%, transparent)`,
          transition: 'background 0.3s',
        }}
      >
        <button
          type="button"
          onClick={() => onContinue?.(selectedDate)}
          style={{
            width: '100%', height: 52, borderRadius: t.radius.full,
            background: t.color.main, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: t.spacing[1],
            transition: 'background 0.15s',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: t.color.content.main }}>{ctaLabel}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.color.content.main }}> • </span>
          <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', height: 22 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={dateAnimKey}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ fontSize: 15, fontWeight: 700, color: t.color.content.main }}
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
              style={{ position: 'absolute', inset: 0, background: t.color.surface.overlay, zIndex: 10 }}
            />

            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: t.color.background.screen,
                borderTopLeftRadius: t.radius.xl,
                borderTopRightRadius: t.radius.xl,
                zIndex: 11,
                padding: '0 0 28px',
                transition: 'background 0.3s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: t.spacing[3], paddingBottom: t.spacing[1] }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: t.color.border.secondary, transition: 'background 0.3s' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', padding: `${t.spacing[2]}px ${t.spacing[5]}px ${t.spacing[4]}px` }}>
                <NText
                  variant="subtitleSmallStrong"
                  theme={t}
                  style={{ flex: 1, fontWeight: 700 }}
                >
                  {dd.calendarTitle}
                </NText>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: t.spacing[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <CloseIcon color={t.color.content.secondary} />
                </button>
              </div>

              <div style={{ padding: `0 ${t.spacing[5]}px` }}>
                <MiniCalendar
                  selectedDate={calendarPreviewDate}
                  minDate={today}
                  maxDate={maxDate}
                  locale={locale}
                  onSelect={handleCalendarPreview}
                  t={t}
                />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: t.spacing[3],
                padding: `${t.spacing[4]}px ${t.spacing[5]}px`,
              }}>
                <CalendarScheduledIcon color={t.color.content.secondary} />
                <div style={{ flex: 1 }}>
                  <NText variant="labelXSmallDefault" tone="secondary" as="p" theme={t}>
                    {tr.summary.monthlyPaymentDate}
                  </NText>
                  <NText variant="labelSmallStrong" as="p" theme={t} style={{ display: 'flex', alignItems: 'center' }}>
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
                  </NText>
                </div>
              </div>

              <div style={{ padding: `0 ${t.spacing[5]}px` }}>
                <button
                  type="button"
                  onClick={handleCalendarConfirm}
                  style={{
                    width: '100%', height: 52, borderRadius: t.radius.full,
                    background: t.color.main, border: 'none', cursor: 'pointer',
                    fontSize: 15, fontWeight: 700, color: t.color.content.main,
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
