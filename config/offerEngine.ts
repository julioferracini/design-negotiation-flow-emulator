import type { Locale } from '../i18n';
import {
  getRules,
  getSimDebtData,
  computeWeightedMonthlyRate,
  round2,
  LATE_PAYMENT_PERCENT,
  type FinancialRules,
  type SimDebtData,
} from './financialCalculator';

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export type OfferType = 'cash' | 'installments';

export interface RenegotiationOffer {
  offerId: string;
  type: OfferType;
  installments: number;
  discountPercent: number;
  originalDebt: number;
  baseAmount: number;
  monthlyInterestRate: number;
  paymentOnce: number | null;
  monthlyPayment: number | null;
  totalPaid: number;
  totalInterest: number;
  /**
   * Can be negative when interest exceeds the discount
   * (customer pays more than original debt). This is expected.
   */
  effectiveDiscountOverTotalDebt: number;
  ccShare: number;
  loanShare: number;
  latePayment: number;
}

export interface ClientOffers {
  locale: Locale;
  totalDebt: number;
  ccBalance: number;
  loanBalance: number;
  weightedRate: number;
  offers: [RenegotiationOffer, RenegotiationOffer, RenegotiationOffer];
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Price formula (same as financialCalculator but isolated)         */
/* ═══════════════════════════════════════════════════════════════════ */

function calcPrice(pv: number, rate: number, n: number): { monthly: number; totalInterest: number } {
  if (rate <= 0 || n <= 0) {
    const monthly = n > 0 ? pv / n : 0;
    return { monthly, totalInterest: 0 };
  }
  const factor = Math.pow(1 + rate, n);
  const monthly = pv * (rate * factor) / (factor - 1);
  return { monthly, totalInterest: monthly * n - pv };
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Offer generation                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function buildOffer(
  offerId: string,
  type: OfferType,
  totalDebt: number,
  discountPercent: number,
  installments: number,
  rate: number,
  ccRatio: number,
  loanRatio: number,
  loanBalance: number,
): RenegotiationOffer {
  const baseAmount = round2(totalDebt * (1 - discountPercent));

  let paymentOnce: number | null = null;
  let monthlyPayment: number | null = null;
  let totalPaid: number;
  let totalInterest = 0;

  if (type === 'cash') {
    paymentOnce = baseAmount;
    totalPaid = baseAmount;
  } else {
    const result = calcPrice(baseAmount, rate, installments);
    monthlyPayment = round2(result.monthly);
    totalInterest = round2(result.totalInterest);
    totalPaid = round2(monthlyPayment * installments);
  }

  return {
    offerId,
    type,
    installments,
    discountPercent,
    originalDebt: totalDebt,
    baseAmount,
    monthlyInterestRate: round2(rate * 10000) / 10000,
    paymentOnce,
    monthlyPayment,
    totalPaid,
    totalInterest,
    effectiveDiscountOverTotalDebt: round2((1 - totalPaid / totalDebt) * 100) / 100,
    ccShare: round2(baseAmount * ccRatio),
    loanShare: round2(baseAmount * loanRatio),
    latePayment: round2(loanBalance * LATE_PAYMENT_PERCENT),
  };
}

/**
 * Generate exactly 3 offers per client, as defined in the prompt section 7.
 *
 * Offer 1: Cash (single payment, max discount)
 * Offer 2: Short installment plan (e.g. 12x, medium discount)
 * Offer 3: Long installment plan (e.g. 36x, min discount)
 */
export function generateOffers(
  totalDebt: number,
  ccBalance: number,
  loanBalance: number,
  locale: Locale,
  rulesOverride?: Partial<FinancialRules>,
): ClientOffers {
  const rules = { ...getRules(locale), ...rulesOverride };
  const ccRatio = totalDebt > 0 ? ccBalance / totalDebt : 0;
  const loanRatio = totalDebt > 0 ? loanBalance / totalDebt : 0;

  let weightedRate = rules.monthlyInterestRate;
  if (rules.annualRateCC != null && rules.annualRateLoan != null) {
    weightedRate = computeWeightedMonthlyRate(
      rules.annualRateCC,
      rules.annualRateLoan,
      ccBalance,
      loanBalance,
    );
  }

  const offer1 = buildOffer(
    'offer-cash',
    'cash',
    totalDebt,
    rules.offer1DiscountPercent,
    1,
    0,
    ccRatio,
    loanRatio,
    loanBalance,
  );

  const offer2 = buildOffer(
    'offer-short',
    'installments',
    totalDebt,
    rules.offer2DiscountPercent,
    rules.offer2Installments,
    weightedRate,
    ccRatio,
    loanRatio,
    loanBalance,
  );

  const offer3 = buildOffer(
    'offer-long',
    'installments',
    totalDebt,
    rules.offer3DiscountPercent,
    rules.offer3Installments,
    weightedRate,
    ccRatio,
    loanRatio,
    loanBalance,
  );

  return {
    locale,
    totalDebt,
    ccBalance,
    loanBalance,
    weightedRate: round2(weightedRate * 10000) / 10000,
    offers: [offer1, offer2, offer3],
  };
}

/**
 * Convenience: generate offers from the default sim debt data for a locale.
 */
export function generateOffersForLocale(locale: Locale): ClientOffers {
  const debt = getSimDebtData(locale);
  return generateOffers(debt.originalBalance, debt.ccBalance, debt.loanBalance, locale);
}
