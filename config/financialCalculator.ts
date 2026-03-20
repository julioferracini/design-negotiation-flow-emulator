import type { Locale } from '../i18n';

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export interface FinancialRules {
  minInstallments: number;
  maxInstallments: number;
  downPaymentThreshold: number;
  downPaymentMinPercent: number;
  downPaymentMaxPercent: number;
  monthlyInterestRate: number;
  formula: 'price' | 'sac' | 'flat_discount';
  offer1DiscountPercent: number;
  offer3DiscountPercent: number;
  discountPerInstallmentLess: number;
  taxLabel: string;
}

export interface SimDebtData {
  ccBalance: number;
  loanBalance: number;
  originalBalance: number;
}

export interface CalculateInput {
  installments: number;
  downpayment: number;
  totalDebt: number;
  downpaymentFixed?: boolean;
}

export interface CalculateResult {
  monthlyPayment: number;
  downpayment: number;
  total: number;
  savings: number;
  needsDownpayment: boolean;
  totalInterest: number;
  effectiveRate: number;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Rules per locale                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

const RULES: Record<Locale, FinancialRules> = {
  'pt-BR': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.039041,
    formula: 'price',
    offer1DiscountPercent: 0.20,
    offer3DiscountPercent: 0.03,
    discountPerInstallmentLess: 5,
    taxLabel: 'IOF',
  },
  'en-US': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.015567,
    formula: 'price',
    offer1DiscountPercent: 0.20,
    offer3DiscountPercent: 0.03,
    discountPerInstallmentLess: 5,
    taxLabel: 'APR',
  },
  'es-MX': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.029516,
    formula: 'price',
    offer1DiscountPercent: 0.20,
    offer3DiscountPercent: 0.03,
    discountPerInstallmentLess: 5,
    taxLabel: 'CAT',
  },
  'es-CO': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.025,
    formula: 'price',
    offer1DiscountPercent: 0.20,
    offer3DiscountPercent: 0.03,
    discountPerInstallmentLess: 5000,
    taxLabel: 'Tasa',
  },
};

const DEBT_DATA: Record<Locale, SimDebtData> = {
  'pt-BR': { ccBalance: 600, loanBalance: 900, originalBalance: 1500 },
  'en-US': { ccBalance: 600, loanBalance: 900, originalBalance: 1500 },
  'es-MX': { ccBalance: 600, loanBalance: 900, originalBalance: 1500 },
  'es-CO': { ccBalance: 600000, loanBalance: 900000, originalBalance: 1500000 },
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Public API                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

export function getRules(locale: Locale): FinancialRules {
  return RULES[locale] ?? RULES['pt-BR'];
}

export function getSimDebtData(locale: Locale): SimDebtData {
  return DEBT_DATA[locale] ?? DEBT_DATA['pt-BR'];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculate(input: CalculateInput, locale: Locale): CalculateResult {
  const rules = getRules(locale);
  const {
    minInstallments, maxInstallments,
    downPaymentThreshold, downPaymentMinPercent, downPaymentMaxPercent,
    monthlyInterestRate, formula,
    offer1DiscountPercent, offer3DiscountPercent,
    discountPerInstallmentLess,
  } = rules;

  const { installments, totalDebt, downpaymentFixed } = input;
  let { downpayment } = input;

  const needsDownpayment = installments > downPaymentThreshold || !!downpaymentFixed;

  if (needsDownpayment) {
    const minDp = totalDebt * downPaymentMinPercent;
    const maxDp = totalDebt * downPaymentMaxPercent;
    if (downpayment === 0) {
      downpayment = minDp;
    } else {
      downpayment = clamp(downpayment, minDp, maxDp);
    }
  } else {
    downpayment = 0;
  }

  const range = maxInstallments - minInstallments;
  const discountPercent = offer1DiscountPercent -
    ((installments - minInstallments) / range) * (offer1DiscountPercent - offer3DiscountPercent);
  const discountAmount = totalDebt * discountPercent;
  const baseAmount = totalDebt - discountAmount;
  const amountToFinance = Math.max(0, baseAmount - downpayment);

  let monthlyPayment: number;
  let totalInterest = 0;

  if (formula === 'flat_discount') {
    const discountCalc = (maxInstallments - installments) * discountPerInstallmentLess;
    const discountedAmount = Math.max(0, amountToFinance - discountCalc);
    monthlyPayment = installments > 0 ? discountedAmount / installments : 0;
  } else if (formula === 'price') {
    if (monthlyInterestRate <= 0 || installments <= 0) {
      monthlyPayment = installments > 0 ? amountToFinance / installments : 0;
    } else {
      const r = monthlyInterestRate;
      const n = installments;
      const factor = Math.pow(1 + r, n);
      monthlyPayment = amountToFinance * (r * factor) / (factor - 1);
      totalInterest = monthlyPayment * n - amountToFinance;
    }
  } else {
    if (monthlyInterestRate <= 0 || installments <= 0) {
      monthlyPayment = installments > 0 ? amountToFinance / installments : 0;
    } else {
      const amort = amountToFinance / installments;
      monthlyPayment = amort + amountToFinance * monthlyInterestRate;
      totalInterest = 0;
      for (let k = 0; k < installments; k++) {
        totalInterest += (amountToFinance - k * amort) * monthlyInterestRate;
      }
    }
  }

  const total = downpayment + monthlyPayment * installments;
  const savings = discountAmount;
  const effectiveRate = monthlyInterestRate * 100;

  return {
    monthlyPayment,
    downpayment,
    total,
    savings,
    needsDownpayment,
    totalInterest,
    effectiveRate,
  };
}

export function findBestInstallmentsForMonthly(
  targetMonthly: number,
  downpayment: number,
  totalDebt: number,
  downpaymentFixed: boolean,
  locale: Locale,
): number {
  const rules = getRules(locale);
  let bestN = rules.minInstallments;
  let bestDiff = Infinity;

  for (let n = rules.minInstallments; n <= rules.maxInstallments; n++) {
    const result = calculate({ installments: n, downpayment, totalDebt, downpaymentFixed }, locale);
    const diff = Math.abs(result.monthlyPayment - targetMonthly);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestN = n;
    }
  }
  return bestN;
}
