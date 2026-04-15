import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { NText, Badge, Button, TopBar } from '../nuds';
import type { NuDSWebTheme } from '../nuds';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import { getUseCaseForLocale } from '../../../config/useCases';
import { formatCurrency, interpolate } from '../../../config/formatters';
import {
  getRules,
  getSimDebtData,
  getFirstPaymentDate,
  round2,
} from '../../../config/financialCalculator';

const STAGGER = 0.08;

export interface SummaryDynamicData {
  installments: number;
  monthlyPayment: number;
  total: number;
  savings: number;
  downpayment: number;
  totalInterest: number;
  effectiveRate: number;
}

function CalendarRenewIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <g transform="translate(2.389, 1.506)">
        <path
          d="M10.3896 14.9873H9.78223C10.0342 15.2923 10.3587 15.5345 10.7295 15.6885L10.9404 15.7646C11.4387 15.9197 11.9763 15.9116 12.4727 15.7383L12.6807 15.6543C13.1552 15.4378 13.5502 15.074 13.8047 14.6143L13.875 14.4766C13.9412 14.3367 13.9939 14.1914 14.0322 14.043L14.0762 13.875H15.2061L15.1514 14.1426C15.0976 14.4058 15.0132 14.6635 14.9004 14.9102L14.7783 15.1533C14.355 15.9182 13.6642 16.5008 12.8389 16.7891C12.0653 17.0589 11.2233 17.0532 10.4561 16.7754L10.3027 16.7158C9.8991 16.5482 9.53477 16.3073 9.22266 16.0117V16.6543H8.11035V14.4316C8.11035 14.1244 8.35976 13.875 8.66699 13.875H10.3896V14.9873ZM4.16699 1.66602H10.833V0H12.5V1.66602H15V8.33301H13.333V6.66602H1.66699V15H6.66699V16.666H0V1.66602H2.5V0H4.16699V1.66602ZM10.6504 10.0234C11.4325 9.7902 12.2734 9.8324 13.0303 10.1465L13.248 10.2461C13.5658 10.4038 13.8555 10.6084 14.1104 10.8496V10.209H15.2227V12.4316C15.2225 12.7004 15.0318 12.9248 14.7783 12.9766L14.666 12.9883H12.9434V11.875H13.5508C13.3411 11.6212 13.081 11.4118 12.7861 11.2598L12.6035 11.1748C12.1181 10.9733 11.5824 10.9335 11.0762 11.0596L10.8613 11.124C10.3651 11.2973 9.93894 11.6252 9.64551 12.0566L9.52832 12.248C9.42779 12.4297 9.35193 12.6223 9.30078 12.8203L9.25684 12.9883H8.12695L8.18164 12.7197L8.24609 12.459C8.31969 12.2001 8.4225 11.9479 8.55469 11.709L8.6377 11.5674C9.06544 10.8723 9.72143 10.3434 10.4951 10.0732L10.6504 10.0234ZM1.66699 5H13.333V3.33301H1.66699V5Z"
          fill={color}
        />
      </g>
    </svg>
  );
}

function ReadOnlyRow({
  label,
  value,
  showDivider = true,
  bold = false,
  t,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
  bold?: boolean;
  t: NuDSWebTheme;
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${t.spacing[4]}px ${t.spacing[4]}px`,
      }}>
        <NText
          variant={bold ? 'labelSmallStrong' : 'labelSmallDefault'}
          theme={t}
        >
          {label}
        </NText>
        <NText
          variant={bold ? 'labelSmallStrong' : 'labelSmallDefault'}
          tone="secondary"
          theme={t}
        >
          {value}
        </NText>
      </div>
      {showDivider && (
        <div style={{ height: 1, background: t.color.border.secondary, transition: 'background 0.3s' }} />
      )}
    </div>
  );
}

export default function SummaryScreen({
  locale,
  onBack,
  dynamicData,
}: {
  locale: Locale;
  onBack?: () => void;
  dynamicData?: SummaryDynamicData;
}) {
  const { nuds } = useTheme();
  const t = nuds;
  const tr = getTranslations(locale);
  const sm = tr.summary;
  const rules = getRules(locale);
  const debtData = getSimDebtData(locale);

  const useCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const firstPayment = useMemo(() => getFirstPaymentDate(), []);
  const firstDateStr = firstPayment.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const dayOfMonth = firstPayment.getDate();

  const data = useMemo(() => {
    if (!dynamicData) return useCase.summaryData;
    return {
      installmentCount: dynamicData.installments,
      installmentAmount: dynamicData.monthlyPayment,
      firstInstallmentDate: firstDateStr,
      monthlyPaymentDay: dayOfMonth,
      totalAmountFinanced: round2(debtData.originalBalance - dynamicData.savings),
      totalInterest: round2(Math.max(0, dynamicData.total - (debtData.originalBalance - dynamicData.savings))),
      monthlyInterestRate: round2(dynamicData.effectiveRate * 100) / 100,
      totalAmountToPay: dynamicData.total,
      totalDiscount: dynamicData.savings,
    };
  }, [dynamicData, useCase.summaryData, firstDateStr, dayOfMonth, debtData.originalBalance]);

  const baseDelay = 0.1;

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
          title={sm.title}
          variant="modal"
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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: baseDelay }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: t.spacing[5] }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: t.radius.xxl,
            background: t.color.background.secondary, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.3s',
          }}>
            <CalendarRenewIcon color={t.color.content.primary} size={32} />
          </div>
          <NText variant="subtitleSmallDefault" tone="secondary" theme={t} style={{ marginTop: t.spacing[1] }}>
            {sm.yourMonthlyPayment}
          </NText>
          <NText variant="titleLarge" theme={t} style={{ marginTop: 7 }}>
            {fmtAmount(data.installmentAmount)}
          </NText>
          <Badge
            label={interpolate(sm.totalDiscount, { amount: fmtAmount(data.totalDiscount) })}
            color="success"
            theme={t}
            style={{ marginTop: t.spacing[1] }}
          />
          <NText
            variant="paragraphSmallDefault"
            tone="secondary"
            theme={t}
            as="p"
            style={{ marginTop: t.spacing[3], textAlign: 'center', padding: `0 34px` }}
          >
            {sm.renegotiationNote}
          </NText>
        </motion.div>

        {/* Section: Your Payment Plan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.36, delay: baseDelay + STAGGER * 2 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: `0 ${t.spacing[5]}px`, minHeight: 48,
          }}
        >
          <NText variant="titleXSmall" theme={t}>
            {sm.sectionPaymentPlan}
          </NText>
          <button
            type="button"
            onClick={() => {}}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              padding: `${t.spacing[2]}px ${t.spacing[3]}px`,
            }}
          >
            <NText variant="labelSmallStrong" color={t.color.main} theme={t}>
              {sm.changeButton}
            </NText>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: baseDelay + STAGGER * 3 }}
          style={{ padding: `0 ${t.spacing[5]}px 0` }}
        >
          <div style={{
            borderRadius: t.radius.xl, border: `1px solid ${t.color.border.secondary}`,
            overflow: 'hidden', transition: 'border-color 0.3s',
          }}>
            <ReadOnlyRow label={sm.numberOfInstallments} value={String(data.installmentCount)} t={t} />
            <ReadOnlyRow label={sm.installmentAmount} value={fmtAmount(data.installmentAmount)} t={t} />
            <ReadOnlyRow label={sm.firstInstallmentDate} value={data.firstInstallmentDate} t={t} />
            <ReadOnlyRow
              label={sm.monthlyPaymentDate}
              value={interpolate(sm.everyDay, { day: String(data.monthlyPaymentDay) })}
              showDivider={false}
              t={t}
            />
          </div>
        </motion.div>

        <div style={{ height: t.spacing[10] }} />

        {/* Section: Billing Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.36, delay: baseDelay + STAGGER * 4 }}
          style={{ padding: `0 ${t.spacing[5]}px`, minHeight: 48, display: 'flex', alignItems: 'center' }}
        >
          <NText variant="titleXSmall" theme={t}>
            {sm.sectionBillingDetails}
          </NText>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: baseDelay + STAGGER * 5 }}
          style={{ padding: `0 ${t.spacing[5]}px` }}
        >
          <div style={{
            borderRadius: t.radius.xl, border: `1px solid ${t.color.border.secondary}`,
            overflow: 'hidden', transition: 'border-color 0.3s',
          }}>
            <ReadOnlyRow label={sm.totalAmountFinanced} value={fmtAmount(data.totalAmountFinanced)} t={t} />
            <ReadOnlyRow label={sm.totalInterest} value={fmtAmount(data.totalInterest)} t={t} />
            <ReadOnlyRow label={`${sm.monthlyInterest} (${rules.taxLabel})`} value={`${data.monthlyInterestRate}%`} t={t} />
            <ReadOnlyRow label={sm.totalAmountToPay} value={fmtAmount(data.totalAmountToPay)} showDivider={false} bold t={t} />
          </div>
        </motion.div>

        <div style={{ height: 120 }} />
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: `${t.spacing[5]}px ${t.spacing[5]}px ${t.spacing[6]}px`,
        background: `${t.color.background.screen}E0`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'background 0.3s',
      }}>
        <Button
          label={sm.confirm}
          variant="primary"
          expanded
          theme={t}
          onClick={() => {}}
        />
        <NText
          variant="labelXSmallDefault"
          tone="secondary"
          theme={t}
          as="p"
          style={{ margin: `${t.spacing[3]}px 0 0`, textAlign: 'center' }}
        >
          {sm.confirmNote}{' '}
          <NText variant="labelXSmallStrong" color={t.color.main} theme={t}>
            {sm.termsLinkText}
          </NText>
        </NText>
      </div>
    </div>
  );
}
