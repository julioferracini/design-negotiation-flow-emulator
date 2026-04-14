import type { Locale } from '../i18n';

/* ═══════════════════════════════════════════════════════════════════ */
/*  Named Constants (previously hardcoded across screens)            */
/* ═══════════════════════════════════════════════════════════════════ */

export const DEFAULT_INITIAL_INSTALLMENTS = 10;
export const SAVINGS_EPSILON = 0.01;
export const FIRST_PAYMENT_OFFSET_DAYS = 30;
export const LATE_PAYMENT_PERCENT = 0.15;
export const MAX_INSTALLMENT_RATIO = 0.50;

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export type AmortizationFormula = 'price' | 'sac' | 'flat_discount';

export interface FinancialRules {
  minInstallments: number;
  maxInstallments: number;
  downPaymentThreshold: number;
  /** Debt amount above which a minimum downpayment is required. */
  downPaymentDebtThreshold: number;
  downPaymentMinPercent: number;
  downPaymentMaxPercent: number;
  downpaymentAlwaysVisible?: boolean;
  monthlyInterestRate: number;
  formula: AmortizationFormula;
  /** Nominal annual rate for credit card product. */
  annualRateCC?: number;
  /** Nominal annual rate for personal loan product. */
  annualRateLoan?: number;
  offer1DiscountPercent: number;
  offer2DiscountPercent: number;
  offer2Installments: number;
  offer3DiscountPercent: number;
  offer3Installments: number;
  discountPerInstallmentLess: number;
  taxLabel: string;
  /** Minimum installment amount for the InstallmentValue screen. */
  minInstallmentAmount: number;
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
  downpaymentAlwaysVisible?: boolean;
  /** When true, the user explicitly chose the downpayment value (including 0). */
  downpaymentUserSet?: boolean;
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
/*  Pure math utilities                                              */
/* ═══════════════════════════════════════════════════════════════════ */

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function annualToMonthly(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

export function computeWeightedMonthlyRate(
  annualRateCC: number,
  annualRateLoan: number,
  ccBalance: number,
  loanBalance: number,
): number {
  const totalDebt = ccBalance + loanBalance;
  if (totalDebt <= 0) return 0;
  const iCC = annualToMonthly(annualRateCC);
  const iLoan = annualToMonthly(annualRateLoan);
  return (iCC * ccBalance + iLoan * loanBalance) / totalDebt;
}

export function getFirstPaymentDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + FIRST_PAYMENT_OFFSET_DAYS);
  return d;
}

/**
 * Generate suggestion amounts based on total debt and locale rules.
 * Replaces previously hardcoded [59.90, 100, 150, 200].
 */
export function getSuggestionAmounts(totalDebt: number, rules: FinancialRules): number[] {
  const base = round2(totalDebt * 0.04);
  return [
    round2(Math.max(rules.minInstallmentAmount, base * 0.6)),
    round2(Math.max(rules.minInstallmentAmount, base)),
    round2(base * 1.5),
    round2(base * 2),
  ];
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Rules per locale                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

const RULES: Record<Locale, FinancialRules> = {
  'pt-BR': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentDebtThreshold: 2000,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.039041,
    formula: 'price',
    annualRateCC: 0.90,
    annualRateLoan: 0.40,
    offer1DiscountPercent: 0.20,
    offer2DiscountPercent: 0.15,
    offer2Installments: 12,
    offer3DiscountPercent: 0.03,
    offer3Installments: 36,
    discountPerInstallmentLess: 5,
    taxLabel: 'IOF',
    minInstallmentAmount: 50,
  },
  'en-US': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentDebtThreshold: 400,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.015567,
    formula: 'price',
    annualRateCC: 0.24,
    annualRateLoan: 0.18,
    offer1DiscountPercent: 0.20,
    offer2DiscountPercent: 0.15,
    offer2Installments: 12,
    offer3DiscountPercent: 0.03,
    offer3Installments: 36,
    discountPerInstallmentLess: 5,
    taxLabel: 'APR',
    minInstallmentAmount: 50,
  },
  'es-MX': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentDebtThreshold: 8000,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.029516,
    formula: 'price',
    annualRateCC: 0.385,
    annualRateLoan: 0.44,
    offer1DiscountPercent: 0.20,
    offer2DiscountPercent: 0.15,
    offer2Installments: 12,
    offer3DiscountPercent: 0.03,
    offer3Installments: 24,
    discountPerInstallmentLess: 5,
    taxLabel: 'CAT',
    minInstallmentAmount: 50,
  },
  // Placeholder: cloned from es-MX, adjusted for COP scale.
  // Replace with real Colombian rates when available.
  'es-CO': {
    minInstallments: 2,
    maxInstallments: 60,
    downPaymentThreshold: 20,
    downPaymentDebtThreshold: 800000,
    downPaymentMinPercent: 0.05,
    downPaymentMaxPercent: 0.90,
    monthlyInterestRate: 0.025,
    formula: 'price',
    annualRateCC: 0.385,
    annualRateLoan: 0.44,
    offer1DiscountPercent: 0.20,
    offer2DiscountPercent: 0.15,
    offer2Installments: 12,
    offer3DiscountPercent: 0.03,
    offer3Installments: 24,
    discountPerInstallmentLess: 5000,
    taxLabel: 'Tasa',
    minInstallmentAmount: 50000,
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

export function calculate(input: CalculateInput, locale: Locale, rulesOverride?: Partial<FinancialRules>): CalculateResult {
  const rules = { ...getRules(locale), ...rulesOverride };
  const {
    minInstallments, maxInstallments,
    downPaymentThreshold, downPaymentMinPercent, downPaymentMaxPercent,
    monthlyInterestRate, formula,
    offer1DiscountPercent, offer3DiscountPercent,
    discountPerInstallmentLess,
  } = rules;

  const { installments, totalDebt, downpaymentFixed } = input;
  const alwaysVisible = input.downpaymentAlwaysVisible ?? rules.downpaymentAlwaysVisible ?? false;
  let { downpayment } = input;

  const needsDownpayment = alwaysVisible || installments > downPaymentThreshold || !!downpaymentFixed;

  const userExplicitlySet = input.downpaymentUserSet ?? false;

  const { downPaymentDebtThreshold } = rules;

  if (needsDownpayment) {
    const minDp = totalDebt * downPaymentMinPercent;
    const maxDp = totalDebt * downPaymentMaxPercent;
    if (userExplicitlySet && downpayment === 0 && totalDebt < downPaymentDebtThreshold) {
      downpayment = 0;
    } else if (alwaysVisible && installments <= downPaymentThreshold) {
      downpayment = Math.min(maxDp, Math.max(0, downpayment));
    } else if (downpayment === 0) {
      downpayment = minDp;
    } else {
      downpayment = clamp(downpayment, minDp, maxDp);
    }
  } else {
    downpayment = 0;
  }

  const range = maxInstallments - minInstallments;
  const discountPercent = range > 0
    ? offer1DiscountPercent - ((installments - minInstallments) / range) * (offer1DiscountPercent - offer3DiscountPercent)
    : offer1DiscountPercent;
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
    monthlyPayment: round2(monthlyPayment),
    downpayment: round2(downpayment),
    total: round2(total),
    savings: round2(savings),
    needsDownpayment,
    totalInterest: round2(totalInterest),
    effectiveRate: round2(effectiveRate * 100) / 100,
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
