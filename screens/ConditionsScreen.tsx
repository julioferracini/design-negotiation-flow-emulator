import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  TopBar,
  NText,
  Badge,
  Box,
  ArrowBackIcon,
  ChevronIcon,
  HelpIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useTranslation } from '../i18n';
import type { Locale } from '../i18n';
import ShimmerPlaceholder from '../components/ui/ShimmerPlaceholder';
import { getUseCaseForLocale } from '../config/useCases';
import type { PlanConfig } from '../config/useCases';
import { formatCurrency, interpolate } from '../config/formatters';
import { useEmulatorConfig } from '../config/EmulatorConfigContext';

const ANIM_DURATION = 420;
const STAGGER = 80;

function AnimatedRow({ children, delay, style }: { children: React.ReactNode; delay: number; style?: object }) {
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

function formatPlan(plan: PlanConfig, sg: ReturnType<typeof useTranslation>['suggested'], fmtAmount: (v: number) => string) {
  const installments = plan.installmentCount === 1
    ? interpolate(sg.installmentOf, { amount: fmtAmount(plan.installmentAmount) })
    : interpolate(sg.installmentsOf, { count: String(plan.installmentCount), amount: fmtAmount(plan.installmentAmount) });
  const discount = interpolate(sg.discountAmount, { amount: fmtAmount(plan.discountAmount) });
  const total = interpolate(sg.totalLabel, { amount: fmtAmount(plan.totalAmount) });
  return { installments, discount, total };
}

function NavRow({
  label,
  description,
  description2,
  trailing,
  chevronColor,
  showDivider,
  onPress,
  theme,
}: {
  label: string;
  description?: string;
  description2?: string;
  trailing?: React.ReactNode;
  chevronColor?: string;
  showDivider: boolean;
  onPress?: () => void;
  theme: ReturnType<typeof useNuDSTheme>;
}) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[4],
          gap: theme.spacing[3],
          backgroundColor: pressed ? theme.color.background.secondaryFeedback : 'transparent',
        })}
      >
        <View style={{ flex: 1, gap: theme.spacing[1] }}>
          <NText variant="labelSmallStrong">{label}</NText>
          {description != null && (
            <NText variant="paragraphSmallDefault" tone="positive">{description}</NText>
          )}
          {description2 != null && (
            <NText variant="paragraphSmallDefault" tone="secondary">{description2}</NText>
          )}
        </View>
        {trailing && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            {trailing}
          </View>
        )}
        <View style={{ transform: [{ rotate: '-90deg' }] }}>
          <ChevronIcon size={20} color={chevronColor ?? theme.color.content.secondary} />
        </View>
      </Pressable>
      {showDivider && (
        <View style={{ height: 1, backgroundColor: theme.color.border.secondary }} />
      )}
    </View>
  );
}

function FaqBanner({ label, theme }: { label: string; theme: ReturnType<typeof useNuDSTheme> }) {
  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: pressed
          ? theme.color.background.secondaryFeedback
          : theme.color.background.secondary,
      })}
    >
      <NText variant="subtitleSmallStrong" style={{ flex: 1 }}>{label}</NText>
      <View style={s.faqIcon}>
        <View style={[s.faqIconCircle, { backgroundColor: theme.color.background.primary }]}>
          <HelpIcon size={24} color={theme.color.content.secondary} />
        </View>
      </View>
    </Pressable>
  );
}

export default function ConditionsScreen({
  locale = 'pt-BR',
  plans: plansProp,
  onBack,
  onMoreOptions,
  onSelectPlan,
}: {
  locale?: Locale;
  plans?: PlanConfig[];
  onBack?: () => void;
  onMoreOptions?: () => void;
  onSelectPlan?: (plan: PlanConfig) => void;
}) {
  const theme = useNuDSTheme();
  const t = useTranslation(locale);
  const sg = t.suggested;
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);
  const plans = plansProp ?? useCase.plans;

  const { simulatedLatencyMs } = useEmulatorConfig();
  const [loading, setLoading] = useState(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const questionOpacity = useRef(new Animated.Value(0)).current;
  const amountOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), Math.max(400, simulatedLatencyMs));
    return () => clearTimeout(timer);
  }, [simulatedLatencyMs]);

  useEffect(() => {
    if (loading) return;
    Animated.stagger(60, [
      Animated.timing(headerOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(questionOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(amountOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [loading, headerOpacity, questionOpacity, amountOpacity]);

  if (loading) {
    return (
      <Box surface="screen" style={s.screen}>
        <StatusBar style="dark" />
        <ShimmerPlaceholder />
      </Box>
    );
  }

  const highlightPlan = plans.find((p) => p.bestMatch) ?? plans[0];
  const secondaryPlans = plans.filter((p) => p.id !== highlightPlan.id);
  const hp = formatPlan(highlightPlan, sg, fmtAmount);

  const accentBg = theme.color.surface.accentSubtle;
  const accentBorder = theme.color.surface.accentStrong;

  return (
    <Box surface="screen" style={s.screen}>
      <StatusBar style="dark" />

      <Animated.View style={{ opacity: headerOpacity }}>
        <TopBar
          title={sg.headerTitle}
          variant="default"
          showStatusBar={false}
          leading={<ArrowBackIcon size={24} color={theme.color.content.primary} />}
          onPressLeading={onBack}
          show1stAction={false}
          show2ndAction={false}
        />
      </Animated.View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.contentHeader}>
          <Animated.View style={{ opacity: questionOpacity }}>
            <NText variant="titleMedium" style={s.question}>{sg.title}</NText>
          </Animated.View>

          <Animated.View style={[s.amountBlock, { opacity: amountOpacity }]}>
            <View style={s.amountRow}>
              <NText variant="titleMedium" tone="secondary">{curr.symbol}  </NText>
              <NText variant="titleMedium">
                {formatCurrency(useCase.targetAmount, curr, { showSymbol: false })}
              </NText>
            </View>
            <NText variant="labelSmallDefault" tone="secondary" style={{ marginTop: 8 }}>
              {sg.targetLabel}
            </NText>
          </Animated.View>
        </View>

        {/* Highlight Card */}
        <AnimatedRow delay={400 + 3 * STAGGER} style={s.cardWrap}>
          <View style={[s.listCard, { borderColor: accentBorder, backgroundColor: accentBg }]}>
            <NavRow
              label={hp.installments}
              description={hp.discount}
              description2={hp.total}
              trailing={highlightPlan.bestMatch ? <Badge label={sg.bestMatchBadge} color="accent" /> : undefined}
              chevronColor={theme.color.main}
              showDivider={false}
              onPress={onSelectPlan ? () => onSelectPlan(highlightPlan) : undefined}
              theme={theme}
            />
          </View>
        </AnimatedRow>

        {/* Secondary Plans */}
        <AnimatedRow delay={400 + 4 * STAGGER} style={s.cardWrap}>
          <View style={[s.listCard, { borderColor: theme.color.border.secondary }]}>
            {secondaryPlans.map((plan, i) => {
              const fp = formatPlan(plan, sg, fmtAmount);
              return (
                <NavRow
                  key={plan.id}
                  label={fp.installments}
                  description={fp.discount}
                  description2={fp.total}
                  showDivider={true}
                  onPress={onSelectPlan ? () => onSelectPlan(plan) : undefined}
                  theme={theme}
                />
              );
            })}
            <NavRow
              label={sg.moreOptions}
              description2={interpolate(sg.moreOptionsSubtitle, { max: String(useCase.debt.installmentRange.max) })}
              chevronColor={theme.color.main}
              showDivider={false}
              onPress={onMoreOptions}
              theme={theme}
            />
          </View>
        </AnimatedRow>

        {/* FAQ Banner */}
        <AnimatedRow delay={400 + 5 * STAGGER} style={s.faqWrap}>
          <FaqBanner label={sg.faqTitle} theme={theme} />
        </AnimatedRow>
      </ScrollView>
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
  contentHeader: { paddingHorizontal: 24 },
  question: { marginBottom: 24 },
  amountBlock: { marginBottom: 24 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline' },
  cardWrap: { paddingHorizontal: 16, marginBottom: 12 },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqWrap: { marginTop: 12, paddingHorizontal: 20 },
  faqIcon: { marginLeft: 12 },
  faqIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
