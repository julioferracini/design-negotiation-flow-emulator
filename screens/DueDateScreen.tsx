import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  NText,
  Button,
  SectionTitle,
  ListRow,
  BottomSheet,
  Box,
  ArrowBackIcon,
  CalendarScheduledIcon,
  ChevronIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation, interpolate } from '../i18n';
import type { Locale } from '../i18n';
import { formatCurrency } from '../config/formatters';
import { getUseCaseForLocale } from '../config/useCases';
import { useEmulatorConfig } from '../config/EmulatorConfigContext';
import { getNextBusinessDays, isBusinessDay, addBusinessDays } from '../config/financialCalculator';

const ANIM_DURATION = 420;
const STAGGER = 80;

type Theme = ReturnType<typeof useNuDSTheme>;

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

function getDayLabel(date: Date, locale: Locale, today: Date, t: ReturnType<typeof useTranslation>): string {
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

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_SIZE = 44;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

type DayState = 'unavailable' | 'available' | 'selected';

function DayCell({
  day,
  state,
  onPress,
  theme,
}: {
  day: number;
  state: DayState;
  onPress: () => void;
  theme: Theme;
}) {
  const isSelected = state === 'selected';
  const isUnavailable = state === 'unavailable';

  const textColor = isSelected
    ? theme.color.main
    : isUnavailable
      ? theme.color.content.disabled
      : theme.color.content.primary;

  const fontVariant = isSelected ? 'subtitleMediumStrong' : 'subtitleMediumDefault';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isUnavailable}
      onPress={onPress}
      style={[
        calStyles.dayCell,
        isSelected && {
          backgroundColor: theme.color.surface.accentSubtle,
          borderWidth: 2,
          borderColor: theme.color.main,
        },
      ]}
    >
      <NText variant={fontVariant} color={textColor}>
        {day}
      </NText>
    </Pressable>
  );
}

function CustomDatePicker({
  month,
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  theme,
}: {
  month: Date;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onSelectDate?: (date: Date) => void;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  theme: Theme;
}) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevMonthRef = useRef(month);

  useEffect(() => {
    const prevKey = prevMonthRef.current.getFullYear() * 12 + prevMonthRef.current.getMonth();
    const nextKey = month.getFullYear() * 12 + month.getMonth();

    if (prevKey !== nextKey) {
      const slideOut = nextKey > prevKey ? -40 : 40;
      const slideIn = nextKey > prevKey ? 40 : -40;

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: slideOut, duration: 120, useNativeDriver: true }),
      ]).start(() => {
        slideAnim.setValue(slideIn);
        prevMonthRef.current = month;
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [month, fadeAnim, slideAnim]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const startDay = getStartDayOfWeek(year, monthIndex);
  const prevMonthDays = getDaysInMonth(year, monthIndex - 1);

  const isDateInRange = (date: Date): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return isBusinessDay(date);
  };

  const weeks: { day: number; state: DayState; date: Date }[][] = [];
  let currentWeek: { day: number; state: DayState; date: Date }[] = [];

  for (let i = 0; i < startDay; i++) {
    const d = prevMonthDays - startDay + 1 + i;
    currentWeek.push({ day: d, state: 'unavailable', date: new Date(year, monthIndex - 1, d) });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    let state: DayState = isDateInRange(date) ? 'available' : 'unavailable';
    if (selectedDate && isSameDay(date, selectedDate)) state = 'selected';
    currentWeek.push({ day: d, state, date });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    let nextDay = 1;
    while (currentWeek.length < 7) {
      currentWeek.push({ day: nextDay, state: 'unavailable', date: new Date(year, monthIndex + 1, nextDay) });
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  return (
    <View style={calStyles.root}>
      <View style={calStyles.header}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <NText variant="subtitleSmallStrong" color={theme.color.content.primary}>
            {formatMonthYear(month)}
          </NText>
        </Animated.View>
        <View style={calStyles.navigation}>
          <Pressable onPress={onPreviousMonth} style={calStyles.navButton}>
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <ChevronIcon size={20} color={theme.color.content.primary} />
            </View>
          </Pressable>
          <Pressable onPress={onNextMonth} style={calStyles.navButton}>
            <View style={{ transform: [{ rotate: '-90deg' }] }}>
              <ChevronIcon size={20} color={theme.color.content.primary} />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={calStyles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={calStyles.weekdayCell}>
            <NText variant="labelXSmallStrong" color={theme.color.content.secondary}>
              {label}
            </NText>
          </View>
        ))}
      </View>

      <Animated.View style={[calStyles.monthGrid, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={calStyles.weekRow}>
            {week.map((cell, dayIndex) => (
              <DayCell
                key={`${weekIndex}-${dayIndex}`}
                day={cell.day}
                state={cell.state}
                onPress={() => cell.state !== 'unavailable' && onSelectDate?.(cell.date)}
                theme={theme}
              />
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  root: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  navigation: { flexDirection: 'row', gap: 8 },
  navButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  weekdayRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  weekdayCell: { width: DAY_SIZE, alignItems: 'center' },
  monthGrid: { gap: 4 },
  weekRow: { flexDirection: 'row', gap: 4 },
  dayCell: { width: DAY_SIZE, height: DAY_SIZE, borderRadius: DAY_SIZE, alignItems: 'center', justifyContent: 'center' },
});

function AnimatedSection({ children, delay, style }: { children: React.ReactNode; delay: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: ANIM_DURATION, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: ANIM_DURATION, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function RouletteText({
  value,
  style,
  textStyle,
}: {
  value: string;
  style?: object;
  textStyle?: object;
}) {
  const slideY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;
    Animated.parallel([
      Animated.timing(slideY, { toValue: -14, duration: 120, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      slideY.setValue(14);
      Animated.parallel([
        Animated.timing(slideY, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }, [value, slideY, textOpacity]);

  return (
    <Animated.View style={[{ transform: [{ translateY: slideY }], opacity: textOpacity }, style]}>
      <Animated.Text style={textStyle}>{value}</Animated.Text>
    </Animated.View>
  );
}

function FadeNumber({ value, theme }: { value: string; theme: ReturnType<typeof useNuDSTheme> }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;
    Animated.timing(opacity, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(() => {
      setDisplayValue(value);
      Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();
    });
  }, [value, opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <NText variant="labelSmallStrong" color={theme.color.content.primary}>
        {displayValue}
      </NText>
    </Animated.View>
  );
}

function DateTile({
  date,
  selected,
  animateDay = false,
  dayLabel,
  locale,
  onPress,
  theme,
}: {
  date: Date;
  selected: boolean;
  animateDay?: boolean;
  dayLabel: string;
  locale: Locale;
  onPress: () => void;
  theme: Theme;
}) {
  const monthDayStr = getMonthDayStr(date, locale);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.tile,
        {
          borderColor: selected ? theme.color.main : theme.color.border.primary,
          borderWidth: selected ? 2 : 1,
          backgroundColor: selected
            ? theme.color.surface.accentSubtle
            : pressed
              ? theme.color.background.secondaryFeedback
              : theme.color.background.primary,
        },
      ]}
    >
      <View style={s.tileContent}>
        {animateDay ? (
          <RouletteText
            value={monthDayStr}
            textStyle={{
              fontSize: 14,
              fontWeight: '600',
              color: selected ? theme.color.main : theme.color.content.primary,
            }}
          />
        ) : (
          <NText
            variant="labelSmallStrong"
            color={selected ? theme.color.main : theme.color.content.primary}
          >
            {monthDayStr}
          </NText>
        )}
        <NText
          variant="labelSmallDefault"
          color={selected ? theme.color.main : theme.color.content.secondary}
          numberOfLines={1}
        >
          {dayLabel}
        </NText>
      </View>
    </Pressable>
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
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const dd = t.dueDate;
  const variantKey = variant === 'downpayment-date' ? 'downpaymentDate' : variant === 'single-payment-date' ? 'singlePaymentDate' : 'firstInstallmentDate';
  const variantT = dd.variants[variantKey];
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const { effectiveRules } = useEmulatorConfig();
  const businessDays = effectiveRules.dueDateBusinessDays;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstThreeBusinessDays = getNextBusinessDays(today, 3);
  const tile0Date = firstThreeBusinessDays[0];
  const tile1Date = firstThreeBusinessDays[1];
  const defaultTile2Date = firstThreeBusinessDays[2];

  const maxDate = addBusinessDays(today, businessDays);

  const [selectedDate, setSelectedDate] = useState<Date>(tile0Date);
  const [tile2Date, setTile2Date] = useState<Date>(defaultTile2Date);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(today));
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

  const headerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, [headerOpacity]);

  const showDownpayment = (dynamicData?.downpayment ?? 0) > 0;

  const selectedDateStr = getMonthDayStr(selectedDate, locale);
  const ctaLabel = dynamicData
    ? `${dd.continue} ${fmtAmount(dynamicData.monthlyPayment)}`
    : dd.continue;

  const tile2DayLabel = getDayLabel(tile2Date, locale, today, t);

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />

      <Animated.View style={{ opacity: headerOpacity }}>
        <TopBar
          title={variantT.title}
          variant="default"
          showStatusBar={false}
          leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
          onPressLeading={onBack}
          show1stAction={false}
          show2ndAction={false}
        />
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedSection delay={100}>
          <NText variant="titleMedium" style={s.heading}>{variantT.heading}</NText>
          <NText variant="paragraphSmallDefault" tone="secondary" style={s.subtitle}>
            {dd.paymentScheduleInfo}
          </NText>
        </AnimatedSection>

        {dynamicData && (
          <AnimatedSection delay={100 + STAGGER} style={s.listWrap}>
            <View style={[s.listCard, { borderColor: theme.color.border.secondary }]}>
              {showDownpayment && (
                <ListRow
                  label={dd.downpayment}
                  secondaryLabel={fmtAmount(dynamicData.downpayment!)}
                  showDivider
                />
              )}
              <ListRow
                label={interpolate(dd.installmentsOf, { count: String(dynamicData.installments) })}
                secondaryLabel={fmtAmount(dynamicData.monthlyPayment)}
                showDivider
              />
              <ListRow
                label={interpolate(dd.amountOff, { amount: fmtAmount(dynamicData.savings) })}
                secondaryLabelColor={theme.color.positive}
                showDivider
              />
              <ListRow
                label={`Total: ${fmtAmount(dynamicData.total)}`}
                showDivider={false}
              />
            </View>
          </AnimatedSection>
        )}

        <AnimatedSection delay={100 + 2 * STAGGER}>
          <SectionTitle
            title={dd.sectionTitle}
            compact
            secondary={dd.otherDates}
            secondaryTone="accent"
            onSecondaryPress={handleOpenCalendar}
          />
        </AnimatedSection>

        <AnimatedSection delay={100 + 3 * STAGGER}>
          <View style={s.tilesRow}>
            <DateTile
              date={tile0Date}
              selected={isTile0}
              dayLabel={getDayLabel(tile0Date, locale, today, t)}
              locale={locale}
              onPress={() => setSelectedDate(tile0Date)}
              theme={theme}
            />
            <DateTile
              date={tile1Date}
              selected={isTile1}
              dayLabel={getDayLabel(tile1Date, locale, today, t)}
              locale={locale}
              onPress={() => setSelectedDate(tile1Date)}
              theme={theme}
            />
            <DateTile
              date={tile2Date}
              selected={isTile2}
              animateDay
              dayLabel={tile2DayLabel}
              locale={locale}
              onPress={() => setSelectedDate(tile2Date)}
              theme={theme}
            />
          </View>
        </AnimatedSection>
      </ScrollView>

      <View style={[s.bottomBar, { backgroundColor: theme.color.background.primary }]}>
        <Pressable
          onPress={() => onContinue?.(selectedDate)}
          style={({ pressed }) => [
            s.ctaButton,
            {
              backgroundColor: pressed ? theme.color.mainFeedback : theme.color.main,
            },
          ]}
        >
          <View style={s.ctaContent}>
            <NText variant="labelMediumStrong" color={theme.color.content.inverse}>
              {ctaLabel}
            </NText>
            <NText variant="labelMediumStrong" color={theme.color.content.inverse}> • </NText>
            <RouletteText
              value={selectedDateStr}
              textStyle={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.color.content.inverse,
              }}
            />
          </View>
        </Pressable>
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={dd.calendarTitle}
        showHandle
        show1stAction={false}
        show2ndAction={false}
      >
        <View style={s.sheetContent}>
          <CustomDatePicker
            month={calendarMonth}
            selectedDate={calendarPreviewDate}
            minDate={today}
            maxDate={maxDate}
            onSelectDate={handleCalendarPreview}
            onPreviousMonth={() => {
              const prev = new Date(calendarMonth);
              prev.setDate(1);
              prev.setMonth(prev.getMonth() - 1);
              setCalendarMonth(prev);
            }}
            onNextMonth={() => {
              const next = new Date(calendarMonth);
              next.setDate(1);
              next.setMonth(next.getMonth() + 1);
              setCalendarMonth(next);
            }}
            theme={theme}
          />

          <View style={s.calendarInfo}>
            <CalendarScheduledIcon size={20} color={theme.color.content.secondary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <NText variant="labelSmallDefault" tone="secondary">
                {t.summary.monthlyPaymentDate}
              </NText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <NText variant="labelSmallStrong">{variantT.calendarInfoPrefix}</NText>
                <View style={{ overflow: 'hidden', height: 18 }}>
                  <RouletteText
                    value={String(calendarPreviewDate.getDate())}
                    textStyle={{ fontSize: 13, fontWeight: '600', color: theme.color.content.primary, lineHeight: 18 }}
                  />
                </View>
                <NText variant="labelSmallStrong">{variantT.calendarInfoSuffix}</NText>
              </View>
            </View>
          </View>

          <Button
            label={dd.calendarSelectDate}
            variant="primary"
            expanded
            onPress={handleCalendarConfirm}
          />
        </View>
      </BottomSheet>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 34 },
  scrollContent: { paddingBottom: 120 },
  heading: { marginTop: 8, marginHorizontal: 20, marginBottom: 6 },
  subtitle: { marginHorizontal: 20, marginBottom: 20 },
  listWrap: { paddingHorizontal: 20, marginBottom: 16 },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tile: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  tileContent: {
    gap: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  calendarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
});
