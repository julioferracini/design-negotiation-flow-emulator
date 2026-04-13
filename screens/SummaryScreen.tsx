import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  NText,
  Badge,
  Button,
  ButtonLink,
  SectionTitle,
  Avatar,
  Box,
  ArrowBackIcon,
  CalendarRenewIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import ShimmerPlaceholder from '../components/ui/ShimmerPlaceholder';
import { getUseCaseForLocale } from '../config/useCases';
import { formatCurrency, interpolate } from '../config/formatters';
import {
  getRules,
  getSimDebtData,
  getFirstPaymentDate,
  round2,
  SAVINGS_EPSILON,
} from '../config/financialCalculator';

const ANIM_DURATION = 420;
const STAGGER = 80;

export interface SummaryDynamicData {
  installments: number;
  monthlyPayment: number;
  total: number;
  savings: number;
  downpayment: number;
  totalInterest: number;
  effectiveRate: number;
}

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

function ReadOnlyRow({
  label,
  value,
  showDivider = true,
  bold = false,
  theme,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
  bold?: boolean;
  theme: ReturnType<typeof useNuDSTheme>;
}) {
  return (
    <View>
      <View style={s.readOnlyRow}>
        <NText variant={bold ? 'labelSmallStrong' : 'labelSmallDefault'} style={{ flex: 1 }}>
          {label}
        </NText>
        <NText variant={bold ? 'labelSmallStrong' : 'labelSmallDefault'} tone="secondary">
          {value}
        </NText>
      </View>
      {showDivider && (
        <View style={{ height: 1, backgroundColor: theme.color.border.secondary }} />
      )}
    </View>
  );
}

export default function SummaryScreen({
  locale = 'pt-BR',
  onBack,
  dynamicData,
}: {
  locale?: Locale;
  onBack?: () => void;
  dynamicData?: SummaryDynamicData;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const sm = t.summary;
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);
  const rules = getRules(locale);
  const debtData = getSimDebtData(locale);

  const firstPayment = getFirstPaymentDate();
  const firstDateStr = firstPayment.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const dayOfMonth = firstPayment.getDate();

  const data = dynamicData
    ? {
        installmentCount: dynamicData.installments,
        installmentAmount: dynamicData.monthlyPayment,
        firstInstallmentDate: firstDateStr,
        monthlyPaymentDay: dayOfMonth,
        totalAmountFinanced: round2(debtData.originalBalance - dynamicData.savings),
        totalInterest: round2(Math.max(0, dynamicData.total - (debtData.originalBalance - dynamicData.savings))),
        monthlyInterestRate: round2(dynamicData.effectiveRate * 100) / 100,
        totalAmountToPay: dynamicData.total,
        totalDiscount: dynamicData.savings,
      }
    : useCase.summaryData;

  const [loading, setLoading] = useState(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    Animated.timing(headerOpacity, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, [loading, headerOpacity]);

  if (loading) {
    return (
      <Box surface="screen" style={s.screen}>
        <StatusBar style="dark" />
        <ShimmerPlaceholder />
      </Box>
    );
  }

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />

      <Animated.View style={{ opacity: headerOpacity }}>
        <TopBar
          title={sm.title}
          variant="default"
          showStatusBar={false}
          leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
          onPressLeading={onBack}
          show1stAction={false}
          show2ndAction={false}
        />
      </Animated.View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero: Avatar + Amount + Badge + Note */}
        <AnimatedSection delay={200} style={s.heroSection}>
          <Avatar
            variant="icon"
            size="large"
            icon={<CalendarRenewIcon size={32} color={theme.color.content.primary} />}
          />
          <NText variant="subtitleSmallDefault" tone="secondary" style={{ marginTop: 4 }}>
            {sm.yourMonthlyPayment}
          </NText>
          <NText variant="titleLarge" style={{ marginTop: 7 }}>
            {fmtAmount(data.installmentAmount)}
          </NText>
          <View style={{ marginTop: 4 }}>
            <Badge
              label={interpolate(sm.totalDiscount, { amount: fmtAmount(data.totalDiscount) })}
              color="success"
            />
          </View>
          <NText
            variant="paragraphSmallDefault"
            tone="secondary"
            style={{ marginTop: 12, textAlign: 'center', paddingHorizontal: 34 }}
          >
            {sm.renegotiationNote}
          </NText>
        </AnimatedSection>

        {/* Section: Your Payment Plan */}
        <AnimatedSection delay={200 + 2 * STAGGER}>
          <SectionTitle
            title={sm.sectionPaymentPlan}
            compact={false}
            secondary={sm.changeButton}
            secondaryTone="accent"
            onSecondaryPress={() => {}}
          />
        </AnimatedSection>

        <AnimatedSection delay={200 + 3 * STAGGER} style={s.listWrap}>
          <View style={[s.listCard, { borderColor: theme.color.border.secondary }]}>
            <ReadOnlyRow label={sm.numberOfInstallments} value={String(data.installmentCount)} theme={theme} />
            <ReadOnlyRow label={sm.installmentAmount} value={fmtAmount(data.installmentAmount)} theme={theme} />
            <ReadOnlyRow label={sm.firstInstallmentDate} value={data.firstInstallmentDate} theme={theme} />
            <ReadOnlyRow
              label={sm.monthlyPaymentDate}
              value={interpolate(sm.everyDay, { day: String(data.monthlyPaymentDay) })}
              showDivider={false}
              theme={theme}
            />
          </View>
        </AnimatedSection>

        {/* Spacer / Divider */}
        <View style={s.sectionSpacer} />

        {/* Section: Billing Details */}
        <AnimatedSection delay={200 + 4 * STAGGER}>
          <SectionTitle title={sm.sectionBillingDetails} compact={false} />
        </AnimatedSection>

        <AnimatedSection delay={200 + 5 * STAGGER} style={s.listWrap}>
          <View style={[s.listCard, { borderColor: theme.color.border.secondary }]}>
            <ReadOnlyRow label={sm.totalAmountFinanced} value={fmtAmount(data.totalAmountFinanced)} theme={theme} />
            <ReadOnlyRow label={sm.totalInterest} value={fmtAmount(data.totalInterest)} theme={theme} />
            <ReadOnlyRow label={`${sm.monthlyInterest} (${rules.taxLabel})`} value={`${data.monthlyInterestRate}%`} theme={theme} />
            <ReadOnlyRow
              label={sm.totalAmountToPay}
              value={fmtAmount(data.totalAmountToPay)}
              showDivider={false}
              bold
              theme={theme}
            />
          </View>
        </AnimatedSection>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { backgroundColor: `${theme.color.background.primary}E0` }]}>
        <Button
          label={sm.confirm}
          variant="primary"
          expanded
          onPress={() => {}}
        />
        <NText variant="labelXSmallDefault" tone="secondary" style={{ textAlign: 'center', marginTop: 12 }}>
          {sm.confirmNote}{' '}
          <NText variant="labelXSmallStrong" color={theme.color.main}>
            {sm.termsLinkText}
          </NText>
        </NText>
      </View>
    </Box>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 34,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  heroSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listWrap: { paddingHorizontal: 20 },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionSpacer: { height: 40 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
});
