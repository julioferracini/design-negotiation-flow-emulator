import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { NText, Badge, TopBar, boxShadow } from '../nuds';
import type { NuDSWebTheme } from '../nuds';
import { useScreenLoading } from '../hooks/useScreenLoading';
import { CardShimmer } from '../components/ScreenShimmer';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import {
  getUseCaseForLocale,
  generateInstallmentList,
  type PlanConfig,
  type UseCase,
} from '../../../config/useCases';
import { formatCurrency, interpolate } from '../../../config/formatters';

const ANIM_DURATION = 0.42;
const STAGGER = 0.08;

function formatPlan(
  plan: PlanConfig,
  sg: ReturnType<typeof getTranslations>['suggested'],
  fmtAmount: (v: number) => string,
) {
  const installments =
    plan.installmentCount === 1
      ? interpolate(sg.installmentOf, { amount: fmtAmount(plan.installmentAmount) })
      : interpolate(sg.installmentsOf, { count: String(plan.installmentCount), amount: fmtAmount(plan.installmentAmount) });
  const discount = interpolate(sg.discountAmount, { amount: fmtAmount(plan.discountAmount) });
  const total = interpolate(sg.totalLabel, { amount: fmtAmount(plan.totalAmount) });
  return { installments, discount, total };
}

/* ── SVG Icons ─────────────────────────────────────────────────── */

function ChevronRight({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ transform: 'rotate(-90deg)' }}>
      <g transform="translate(4.827, 6.997)">
        <path d="M5.17259 3.99408L1.17851 0L0 1.17851L4.58333 5.76184C4.90877 6.08728 5.43641 6.08728 5.76184 5.76184L10.3452 1.17851L9.16667 0L5.17259 3.99408Z" fill={color} />
      </g>
    </svg>
  );
}

function HelpCircleIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <g transform="translate(1.667, 1.667)">
        <path d="M9.16667 5.22329C8.84893 5.03985 8.47954 4.96637 8.11579 5.01426C7.75204 5.06215 7.41426 5.22873 7.15483 5.48816C6.89539 5.74759 6.72882 6.08537 6.68093 6.44913C6.65911 6.61488 6.66248 6.78177 6.68998 6.94444L5.04663 7.22222C4.99163 6.8969 4.98488 6.56306 5.02852 6.23158C5.1243 5.50408 5.45745 4.82851 5.97631 4.30965C6.49518 3.79079 7.17075 3.45763 7.89825 3.36185C8.62575 3.26608 9.36453 3.41303 10 3.77992C10.6355 4.14681 11.1321 4.71313 11.4129 5.39106C11.6937 6.06898 11.743 6.82062 11.5531 7.5294C11.3632 8.23818 10.9447 8.86448 10.3625 9.31118C10.0103 9.58147 9.69651 9.84447 9.47113 10.1207C9.24918 10.3927 9.16667 10.6122 9.16667 10.8029V10.8333H7.5V10.8029C7.5 10.0899 7.81998 9.50803 8.17976 9.06707C8.5361 8.63033 8.98327 8.26875 9.34794 7.98893C9.63901 7.76558 9.84826 7.45242 9.94321 7.09804C10.0382 6.74365 10.0135 6.36783 9.87314 6.02886C9.73273 5.6899 9.48441 5.40674 9.16667 5.22329Z" fill={color} />
        <path d="M9.16667 13.3333V11.6667H7.5V13.3333H9.16667Z" fill={color} />
        <path d="M8.33333 16.6667C12.9357 16.6667 16.6667 12.9357 16.6667 8.33333C16.6667 3.73096 12.9357 0 8.33333 0C3.73096 0 0 3.73096 0 8.33333C0 12.9357 3.73096 16.6667 8.33333 16.6667ZM8.33333 15C4.65143 15 1.66667 12.0152 1.66667 8.33333C1.66667 4.65143 4.65143 1.66667 8.33333 1.66667C12.0152 1.66667 15 4.65143 15 8.33333C15 12.0152 12.0152 15 8.33333 15Z" fill={color} />
      </g>
    </svg>
  );
}

/* ── Navigation Row ──────────────────────────────────────────────── */

function NavRow({
  label, description, description2, trailing, chevronColor,
  showDivider = false, onPress, t,
}: {
  label: string; description?: string; description2?: string;
  trailing?: React.ReactNode; chevronColor?: string;
  showDivider?: boolean; onPress?: () => void; t: NuDSWebTheme;
}) {
  return (
    <div>
      <div
        role={onPress ? 'button' : undefined}
        tabIndex={onPress ? 0 : undefined}
        onClick={onPress}
        style={{
          display: 'flex', alignItems: 'center', gap: t.spacing[3],
          padding: `${t.spacing[4]}px ${t.spacing[4]}px`,
          cursor: onPress ? 'pointer' : 'default',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: t.spacing[1], minWidth: 0 }}>
          <NText variant="labelSmallStrong" theme={t}>{label}</NText>
          {description != null && <NText variant="paragraphSmallDefault" color={t.color.positive} theme={t}>{description}</NText>}
          {description2 != null && <NText variant="paragraphSmallDefault" tone="secondary" theme={t}>{description2}</NText>}
        </div>
        {trailing && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: t.spacing[2] }}>{trailing}</div>}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <ChevronRight color={chevronColor ?? t.color.content.secondary} />
        </div>
      </div>
      {showDivider && <div style={{ height: 1, background: t.color.border.secondary, transition: 'background 0.3s' }} />}
    </div>
  );
}

/* ── List Card ───────────────────────────────────────────────────── */

function ListCard({ children, accentHighlight = false, t }: {
  children: React.ReactNode; accentHighlight?: boolean; t: NuDSWebTheme;
}) {
  return (
    <div style={{
      borderRadius: t.radius.xl,
      border: `1px solid ${accentHighlight ? t.color.surface.accentStrong : t.color.border.secondary}`,
      background: accentHighlight ? t.color.surface.accentSubtle : t.color.background.primary,
      overflow: 'hidden',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {children}
    </div>
  );
}

/* ── Installment List Bottom Sheet ──────────────────────────────── */

function InstallmentListSheet({
  visible, onClose, locale, t,
}: {
  visible: boolean; onClose: () => void; locale: Locale; t: NuDSWebTheme;
}) {
  const tr = getTranslations(locale);
  const sg = tr.suggested;
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);
  const items = generateInstallmentList(useCase.debt);

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: t.color.surface.overlay, zIndex: t.zIndex.overlay,
            }}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              maxHeight: '85%', background: t.color.background.primary,
              borderTopLeftRadius: t.radius.xxl, borderTopRightRadius: t.radius.xxl,
              zIndex: t.zIndex.sheet, display: 'flex', flexDirection: 'column',
              boxShadow: boxShadow.modal,
              transition: 'background 0.3s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: `${t.spacing[3]}px 0 ${t.spacing[1]}px` }}>
              <div style={{ width: 36, height: 4, borderRadius: t.radius.full, background: t.color.border.secondary }} />
            </div>
            <div style={{ padding: `${t.spacing[3]}px ${t.spacing[6]}px ${t.spacing[4]}px` }}>
              <NText variant="titleXSmall" theme={t} as="h2" style={{ margin: 0 }}>
                {tr.installmentList.title}
              </NText>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: t.spacing[6] }}>
              {items.map((item, i) => {
                const installments = item.count === 1
                  ? interpolate(sg.installmentOf, { amount: fmtAmount(item.amount) })
                  : interpolate(sg.installmentsOf, { count: String(item.count), amount: fmtAmount(item.amount) });
                const discount = interpolate(sg.discountAmount, { amount: fmtAmount(item.discount) });
                const total = interpolate(sg.totalLabel, { amount: fmtAmount(item.total) });
                return (
                  <NavRow
                    key={item.count}
                    label={installments}
                    description={discount}
                    description2={total}
                    trailing={item.recommended ? <Badge label={tr.installmentList.recommendedLabel} color="accent" theme={t} /> : undefined}
                    chevronColor={item.recommended ? t.color.main : undefined}
                    showDivider={i < items.length - 1}
                    t={t}
                  />
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Main Screen ────────────────────────────────────────────────── */

export default function SuggestedConditionsScreen({
  locale, plans: plansProp, onBack, onSelectPlan,
}: {
  locale: Locale; plans?: PlanConfig[];
  onBack?: () => void; onSelectPlan?: (plan: PlanConfig) => void;
}) {
  const { nuds } = useTheme();
  const t = nuds;
  const { loading } = useScreenLoading();
  const tr = getTranslations(locale);
  const sg = tr.suggested;
  const [showSheet, setShowSheet] = useState(false);

  const useCase: UseCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = useCase.currency;
  const fmtAmount = useCallback((v: number) => formatCurrency(v, curr), [curr]);

  const plans = plansProp ?? useCase.plans;
  const highlightPlan = plans.find((p) => p.bestMatch) ?? plans[0];
  const secondaryPlans = plans.filter((p) => p.id !== highlightPlan.id);
  const hp = formatPlan(highlightPlan, sg, fmtAmount);

  const baseDelay = 0.1;

  if (loading) {
    return (
      <div className="nf-proto" style={{ background: t.color.background.screen, color: t.color.content.primary, width: '100%', height: '100%' }}>
        <CardShimmer t={t} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: t.color.background.screen, color: t.color.content.primary,
      transition: 'background 0.3s, color 0.3s',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* NavigationBar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.36 }}
        style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}
      >
        <TopBar
          title={sg.headerTitle}
          variant="default"
          leading={
            onBack ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6.2 6.67 12.87 0l1.18 1.18-6.08 6.08 6.08 6.07-1.18 1.18L6.2 7.85a.83.83 0 0 1 0-1.18Z" fill={t.color.content.primary} transform="translate(5.955, 2.744)" />
              </svg>
            ) : undefined
          }
          onPressLeading={onBack}
          theme={t}
        />
      </motion.div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ opacity: { duration: 0.36, delay: baseDelay }, y: { type: 'spring', stiffness: 200, damping: 24, delay: baseDelay } }}
          style={{ padding: `${t.spacing[2]}px ${t.spacing[6]}px 0` }}
        >
          <NText variant="titleMedium" theme={t} as="h1" style={{ margin: `0 0 ${t.spacing[6]}px`, whiteSpace: 'pre-line' }}>
            {sg.title}
          </NText>
        </motion.div>

        {/* Target Amount */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ opacity: { duration: 0.36, delay: baseDelay + STAGGER }, y: { type: 'spring', stiffness: 200, damping: 24, delay: baseDelay + STAGGER } }}
          style={{ padding: `0 ${t.spacing[6]}px ${t.spacing[6]}px` }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: t.spacing[3] }}>
            <NText variant="titleMedium" tone="secondary" theme={t}>{curr.symbol}</NText>
            <NText variant="titleMedium" theme={t}>
              {formatCurrency(useCase.targetAmount, curr, { showSymbol: false })}
            </NText>
          </div>
          <NText variant="paragraphSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: `${t.spacing[2]}px 0 0` }}>
            {sg.targetLabel}
          </NText>
        </motion.div>

        {/* Highlight Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ opacity: { duration: ANIM_DURATION, delay: baseDelay + STAGGER * 3 }, y: { type: 'spring', stiffness: 180, damping: 22, delay: baseDelay + STAGGER * 3 } }}
          style={{ padding: `0 ${t.spacing[4]}px ${t.spacing[3]}px` }}
        >
          <ListCard accentHighlight t={t}>
            <NavRow
              label={hp.installments}
              description={hp.discount}
              description2={hp.total}
              trailing={highlightPlan.bestMatch ? <Badge label={sg.bestMatchBadge} color="accent" theme={t} /> : undefined}
              chevronColor={t.color.main}
              onPress={onSelectPlan ? () => onSelectPlan(highlightPlan) : undefined}
              t={t}
            />
          </ListCard>
        </motion.div>

        {/* Secondary Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ opacity: { duration: ANIM_DURATION, delay: baseDelay + STAGGER * 4 }, y: { type: 'spring', stiffness: 180, damping: 22, delay: baseDelay + STAGGER * 4 } }}
          style={{ padding: `0 ${t.spacing[4]}px` }}
        >
          <ListCard t={t}>
            {secondaryPlans.map((plan) => {
              const fp = formatPlan(plan, sg, fmtAmount);
              return (
                <NavRow
                  key={plan.id}
                  label={fp.installments}
                  description={fp.discount}
                  description2={fp.total}
                  showDivider
                  onPress={onSelectPlan ? () => onSelectPlan(plan) : undefined}
                  t={t}
                />
              );
            })}
            <NavRow
              label={sg.moreOptions}
              description2={interpolate(sg.moreOptionsSubtitle, { max: String(useCase.debt.installmentRange.max) })}
              chevronColor={t.color.main}
              onPress={() => setShowSheet(true)}
              t={t}
            />
          </ListCard>
        </motion.div>

        {/* FAQ Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ opacity: { duration: ANIM_DURATION, delay: baseDelay + STAGGER * 5 }, y: { type: 'spring', stiffness: 180, damping: 22, delay: baseDelay + STAGGER * 5 } }}
          style={{ padding: `${t.spacing[6]}px ${t.spacing[5]}px` }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: t.spacing[4], borderRadius: t.radius.xl,
            background: t.color.background.secondary, cursor: 'pointer',
            transition: 'background 0.3s',
          }}>
            <NText variant="subtitleSmallStrong" theme={t}>{sg.faqTitle}</NText>
            <div style={{
              width: 40, height: 40, borderRadius: t.radius.xl,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: t.color.background.primary, flexShrink: 0, marginLeft: t.spacing[3],
              transition: 'background 0.3s',
            }}>
              <HelpCircleIcon color={t.color.content.secondary} size={24} />
            </div>
          </div>
        </motion.div>

        <div style={{ height: t.spacing[4] }} />
      </div>

      {/* Installment List Bottom Sheet */}
      <InstallmentListSheet visible={showSheet} onClose={() => setShowSheet(false)} locale={locale} t={t} />
    </div>
  );
}
