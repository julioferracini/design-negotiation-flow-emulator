import type { Locale } from '../i18n';

/* ─────────────── Types ─────────────── */

export type CurrencyConfig = {
  symbol: string;
  code: string;
  decimalSeparator: '.' | ',';
  thousandSeparator: '.' | ',';
};

export type OfferConfig = {
  id: string;
  /** Which tab this offer belongs to */
  tab: string;
  badge?: string;
  badgeType?: 'purple' | 'green';
  /** i18n key suffix for the offer title (e.g. 'offerSolveAllMonthly') */
  titleKey: string;
  /** i18n key suffix for the payment label (e.g. 'firstPaymentFrom') */
  paymentLabelKey: string;
  paymentValue: number;
  /** i18n key suffix for the benefit label (e.g. 'upToAmount') */
  benefitKey: string;
  benefitValue: number;
  /** i18n key suffix for the CTA button (e.g. 'cta' or 'checkDetailsButton') */
  ctaKey: string;
  highlighted: boolean;
};

export type TabConfig = {
  key: string;
  originalTotal: number;
  discountedTotal: number;
  discountValue: number;
};

export type PlanConfig = {
  id: string;
  installmentCount: number;
  installmentAmount: number;
  discountAmount: number;
  totalAmount: number;
  highlight: boolean;
  bestMatch: boolean;
};

export type DebtData = {
  totalOriginal: number;
  discountPercentageMax: number;
  interestRateMonthly: number;
  installmentRange: { min: number; max: number };
};

export type UseCase = {
  id: string;
  name: string;
  description: string;
  locale: Locale;
  currency: CurrencyConfig;
  debt: DebtData;
  tabs: TabConfig[];
  offers: OfferConfig[];
  plans: PlanConfig[];
  targetAmount: number;
};

/* ─────────────── Calculation Helpers ─────────────── */

export function calculateInstallment(total: number, count: number): number {
  return total / count;
}

export function calculateDiscount(original: number, count: number, baseRate = 0.25, decay = 0.0035): number {
  const factor = Math.max(0.05, baseRate - (count - 2) * decay);
  return original * factor;
}

export function generateInstallmentList(
  debt: DebtData,
  recommendedCount = 12,
): Array<{ count: number; amount: number; discount: number; total: number; recommended: boolean }> {
  const items = [];
  for (let n = debt.installmentRange.min; n <= debt.installmentRange.max; n++) {
    const discount = calculateDiscount(debt.totalOriginal, n);
    const total = debt.totalOriginal - discount;
    const amount = total / n;
    items.push({
      count: n,
      amount,
      discount,
      total,
      recommended: n === recommendedCount,
    });
  }
  return items;
}

/* ─────────────── Use Case Definitions ─────────────── */

export const USE_CASES: Record<string, UseCase> = {
  debtResolutionBR: {
    id: 'debtResolutionBR',
    name: 'Debt Resolution (Brazil)',
    description: 'Standard debt renegotiation flow for Brazilian customers.',
    locale: 'pt-BR',
    currency: { symbol: 'R$', code: 'BRL', decimalSeparator: ',', thousandSeparator: '.' },
    debt: {
      totalOriginal: 5230.00,
      discountPercentageMax: 37,
      interestRateMonthly: 1.99,
      installmentRange: { min: 2, max: 60 },
    },
    targetAmount: 200.00,
    tabs: [
      { key: 'all', originalTotal: 5230.00, discountedTotal: 3290.00, discountValue: 1940.00 },
      { key: 'card', originalTotal: 1890.00, discountedTotal: 1290.00, discountValue: 600.00 },
      { key: 'loans', originalTotal: 3340.00, discountedTotal: 2000.00, discountValue: 1340.00 },
    ],
    offers: [
      { id: '1', tab: 'all', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerSolveAllMonthly', paymentLabelKey: 'firstPaymentFrom', paymentValue: 50.00, benefitKey: 'upToAmount', benefitValue: 1940.00, ctaKey: 'cta', highlighted: true },
      { id: '2', tab: 'all', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 3290.00, benefitKey: 'discount', benefitValue: 1940.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '3', tab: 'all', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 621.67, benefitKey: 'discount', benefitValue: 604.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '4', tab: 'card', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayCurrentBill', paymentLabelKey: 'firstPaymentFrom', paymentValue: 40.00, benefitKey: 'upToAmount', benefitValue: 600.00, ctaKey: 'cta', highlighted: true },
      { id: '5', tab: 'card', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 1290.00, benefitKey: 'discount', benefitValue: 600.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '6', tab: 'loans', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayLateLoan', paymentLabelKey: 'firstPaymentFrom', paymentValue: 60.00, benefitKey: 'upToAmount', benefitValue: 1340.00, ctaKey: 'cta', highlighted: true },
      { id: '7', tab: 'loans', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 2000.00, benefitKey: 'discount', benefitValue: 1340.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '8', tab: 'loans', badge: 'badgeBestDiscount', badgeType: 'green', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 367.00, benefitKey: 'discount', benefitValue: 1138.00, ctaKey: 'checkDetailsButton', highlighted: false },
    ],
    plans: [
      { id: 'best-match', installmentCount: 6, installmentAmount: 201.96, discountAmount: 377.74, totalAmount: 1211.76, highlight: true, bestMatch: true },
      { id: '10', installmentCount: 10, installmentAmount: 127.36, discountAmount: 315.90, totalAmount: 1273.60, highlight: false, bestMatch: false },
      { id: '14', installmentCount: 14, installmentAmount: 95.25, discountAmount: 256.00, totalAmount: 1333.50, highlight: false, bestMatch: false },
    ],
  },

  debtResolutionUS: {
    id: 'debtResolutionUS',
    name: 'Debt Resolution (USA)',
    description: 'Standard debt resolution flow for US customers.',
    locale: 'en-US',
    currency: { symbol: '$', code: 'USD', decimalSeparator: '.', thousandSeparator: ',' },
    debt: {
      totalOriginal: 1589.50,
      discountPercentageMax: 29,
      interestRateMonthly: 1.49,
      installmentRange: { min: 2, max: 60 },
    },
    targetAmount: 200.00,
    tabs: [
      { key: 'all', originalTotal: 1589.50, discountedTotal: 1126.50, discountValue: 463.00 },
      { key: 'card', originalTotal: 589.50, discountedTotal: 426.50, discountValue: 163.00 },
      { key: 'loans', originalTotal: 1000.00, discountedTotal: 700.00, discountValue: 300.00 },
    ],
    offers: [
      { id: '1', tab: 'all', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerSolveAllMonthly', paymentLabelKey: 'firstPaymentFrom', paymentValue: 50.00, benefitKey: 'upToAmount', benefitValue: 381.50, ctaKey: 'cta', highlighted: true },
      { id: '2', tab: 'all', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 1126.50, benefitKey: 'discount', benefitValue: 463.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '3', tab: 'all', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 211.08, benefitKey: 'discount', benefitValue: 323.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '4', tab: 'card', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayCurrentBill', paymentLabelKey: 'firstPaymentFrom', paymentValue: 40.00, benefitKey: 'upToAmount', benefitValue: 163.00, ctaKey: 'cta', highlighted: true },
      { id: '5', tab: 'card', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 426.50, benefitKey: 'discount', benefitValue: 163.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '6', tab: 'loans', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayLateLoan', paymentLabelKey: 'firstPaymentFrom', paymentValue: 60.00, benefitKey: 'upToAmount', benefitValue: 300.00, ctaKey: 'cta', highlighted: true },
      { id: '7', tab: 'loans', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 700.00, benefitKey: 'discount', benefitValue: 300.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '8', tab: 'loans', badge: 'badgeBestDiscount', badgeType: 'green', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 120.00, benefitKey: 'discount', benefitValue: 280.00, ctaKey: 'checkDetailsButton', highlighted: false },
    ],
    plans: [
      { id: 'best-match', installmentCount: 6, installmentAmount: 201.96, discountAmount: 377.74, totalAmount: 1211.76, highlight: true, bestMatch: true },
      { id: '10', installmentCount: 10, installmentAmount: 127.36, discountAmount: 315.90, totalAmount: 1273.60, highlight: false, bestMatch: false },
      { id: '14', installmentCount: 14, installmentAmount: 95.25, discountAmount: 256.00, totalAmount: 1333.50, highlight: false, bestMatch: false },
    ],
  },

  debtResolutionCO: {
    id: 'debtResolutionCO',
    name: 'Debt Resolution (Colombia)',
    description: 'Standard debt renegotiation flow for Colombian customers.',
    locale: 'es-CO',
    currency: { symbol: '$', code: 'COP', decimalSeparator: ',', thousandSeparator: '.' },
    debt: {
      totalOriginal: 2500000.0,
      discountPercentageMax: 32,
      interestRateMonthly: 2.19,
      installmentRange: { min: 2, max: 48 },
    },
    targetAmount: 100000.0,
    tabs: [
      { key: 'all', originalTotal: 2500000.0, discountedTotal: 1700000.0, discountValue: 800000.0 },
      { key: 'card', originalTotal: 900000.0, discountedTotal: 620000.0, discountValue: 280000.0 },
      { key: 'loans', originalTotal: 1600000.0, discountedTotal: 1080000.0, discountValue: 520000.0 },
    ],
    offers: [
      { id: '1', tab: 'all', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerSolveAllMonthly', paymentLabelKey: 'firstPaymentFrom', paymentValue: 25000.0, benefitKey: 'upToAmount', benefitValue: 800000.0, ctaKey: 'cta', highlighted: true },
      { id: '2', tab: 'all', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 1700000.0, benefitKey: 'discount', benefitValue: 800000.0, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '3', tab: 'all', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 296667.0, benefitKey: 'discount', benefitValue: 290000.0, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '4', tab: 'card', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayCurrentBill', paymentLabelKey: 'firstPaymentFrom', paymentValue: 20000.0, benefitKey: 'upToAmount', benefitValue: 280000.0, ctaKey: 'cta', highlighted: true },
      { id: '5', tab: 'card', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 620000.0, benefitKey: 'discount', benefitValue: 280000.0, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '6', tab: 'loans', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayLateLoan', paymentLabelKey: 'firstPaymentFrom', paymentValue: 30000.0, benefitKey: 'upToAmount', benefitValue: 520000.0, ctaKey: 'cta', highlighted: true },
      { id: '7', tab: 'loans', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 1080000.0, benefitKey: 'discount', benefitValue: 520000.0, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '8', tab: 'loans', badge: 'badgeBestDiscount', badgeType: 'green', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 180000.0, benefitKey: 'discount', benefitValue: 440000.0, ctaKey: 'checkDetailsButton', highlighted: false },
    ],
    plans: [
      { id: 'best-match', installmentCount: 6, installmentAmount: 201.96, discountAmount: 377.74, totalAmount: 1211.76, highlight: true, bestMatch: true },
      { id: '10', installmentCount: 10, installmentAmount: 127.36, discountAmount: 315.90, totalAmount: 1273.60, highlight: false, bestMatch: false },
      { id: '14', installmentCount: 14, installmentAmount: 95.25, discountAmount: 256.00, totalAmount: 1333.50, highlight: false, bestMatch: false },
    ],
  },

  debtResolutionMX: {
    id: 'debtResolutionMX',
    name: 'Debt Resolution (Mexico)',
    description: 'Standard debt renegotiation flow for Mexican customers.',
    locale: 'es-MX',
    currency: { symbol: '$', code: 'MXN', decimalSeparator: '.', thousandSeparator: ',' },
    debt: {
      totalOriginal: 5230.00,
      discountPercentageMax: 37,
      interestRateMonthly: 2.39,
      installmentRange: { min: 2, max: 60 },
    },
    targetAmount: 200.00,
    tabs: [
      { key: 'all', originalTotal: 5230.00, discountedTotal: 3290.00, discountValue: 1940.00 },
      { key: 'card', originalTotal: 1890.00, discountedTotal: 1290.00, discountValue: 600.00 },
      { key: 'loans', originalTotal: 3340.00, discountedTotal: 2000.00, discountValue: 1340.00 },
    ],
    offers: [
      { id: '1', tab: 'all', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerSolveAllMonthly', paymentLabelKey: 'firstPaymentFrom', paymentValue: 50.00, benefitKey: 'upToAmount', benefitValue: 1940.00, ctaKey: 'cta', highlighted: true },
      { id: '2', tab: 'all', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 3290.00, benefitKey: 'discount', benefitValue: 1940.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '3', tab: 'all', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 621.67, benefitKey: 'discount', benefitValue: 604.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '4', tab: 'card', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayCurrentBill', paymentLabelKey: 'firstPaymentFrom', paymentValue: 40.00, benefitKey: 'upToAmount', benefitValue: 600.00, ctaKey: 'cta', highlighted: true },
      { id: '5', tab: 'card', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 1290.00, benefitKey: 'discount', benefitValue: 600.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '6', tab: 'loans', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayLateLoan', paymentLabelKey: 'firstPaymentFrom', paymentValue: 60.00, benefitKey: 'upToAmount', benefitValue: 1340.00, ctaKey: 'cta', highlighted: true },
      { id: '7', tab: 'loans', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: 2000.00, benefitKey: 'discount', benefitValue: 1340.00, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: '8', tab: 'loans', badge: 'badgeBestDiscount', badgeType: 'green', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: 367.00, benefitKey: 'discount', benefitValue: 1138.00, ctaKey: 'checkDetailsButton', highlighted: false },
    ],
    plans: [
      { id: 'best-match', installmentCount: 6, installmentAmount: 201.96, discountAmount: 377.74, totalAmount: 1211.76, highlight: true, bestMatch: true },
      { id: '10', installmentCount: 10, installmentAmount: 127.36, discountAmount: 315.90, totalAmount: 1273.60, highlight: false, bestMatch: false },
      { id: '14', installmentCount: 14, installmentAmount: 95.25, discountAmount: 256.00, totalAmount: 1333.50, highlight: false, bestMatch: false },
    ],
  },
};

/* ─────────────── Active Use Case ─────────────── */

export const ACTIVE_USE_CASE_ID = 'debtResolutionBR';

export function getActiveUseCase(): UseCase {
  return USE_CASES[ACTIVE_USE_CASE_ID] ?? USE_CASES.debtResolutionBR;
}

export function getUseCaseById(id: string): UseCase | undefined {
  return USE_CASES[id];
}

/**
 * Returns all use cases matching a locale (supports multiple per locale).
 * Falls back to the active use case if none match.
 */
export function getUseCasesForLocale(locale: Locale): UseCase[] {
  const matches = Object.values(USE_CASES).filter((uc) => uc.locale === locale);
  return matches.length > 0 ? matches : [getActiveUseCase()];
}

/**
 * Returns the first use case matching a locale.
 * For multi-scenario setups, prefer getUseCaseById() with a specific ID.
 */
export function getUseCaseForLocale(locale: Locale): UseCase {
  return getUseCasesForLocale(locale)[0];
}

export function getOffersForTab(useCase: UseCase, tabKey: string): OfferConfig[] {
  return useCase.offers.filter((o) => o.tab === tabKey);
}

export function getTabData(useCase: UseCase, tabKey: string): TabConfig | undefined {
  return useCase.tabs.find((t) => t.key === tabKey);
}
