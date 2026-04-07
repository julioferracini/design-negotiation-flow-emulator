/**
 * Product Lines — Hierarchical Use Case registry.
 *
 * Product Lines > Use Cases > Screen Visibility + Financial Defaults
 *
 * Selection order in the emulator: Country → Product Line → Use Case.
 * Each use case declares `supportedLocales`; only matching items appear after country pick.
 */

import type { Locale, ProductLine, UseCaseDefinition } from '../types';

const ALL_SCREENS_ON = {
  offerHub: true,
  installmentValue: true,
  simulation: true,
  suggested: true,
  downpaymentValue: true,
  downpaymentDueDate: true,
  dueDate: true,
  summary: true,
  terms: true,
  pin: false,
  loading: true,
  feedback: true,
  endPath: true,
};

const LENDING_SCREENS = {
  ...ALL_SCREENS_ON,
  suggested: false,
  downpaymentValue: false,
  downpaymentDueDate: false,
};

const ALL_LOCALES: Locale[] = ['pt-BR', 'es-MX', 'es-CO', 'en-US'];

export const PRODUCT_LINES: ProductLine[] = [
  /* ═══════════════════════ Debt Resolution ═══════════════════════ */
  {
    id: 'debt-resolution',
    name: 'Debt Resolution',
    description: 'Renegotiation flows for overdue debt (cards, loans, bills).',
    enabled: true,
    useCases: [
      {
        id: 'dr-mdr-br',
        name: 'MDR – Multi-debt Renegotiation',
        description: 'Consolidated renegotiation across multiple debt products.',
        productLine: 'debt-resolution',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 5230, ccBalance: 1890, loanBalance: 3340, discountPercentageMax: 37, interestRateMonthly: 1.99, installmentRange: { min: 2, max: 60 }, downpaymentEnabled: false, pinEnabled: false },
      },
      {
        id: 'dr-late-lending-short',
        name: 'Late Lending – Short',
        description: 'Short-term overdue lending renegotiation (up to 90 days).',
        productLine: 'debt-resolution',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'A',
        screens: { ...ALL_SCREENS_ON, downpaymentValue: false, downpaymentDueDate: false },
        defaults: { totalDebt: 3800, ccBalance: 0, loanBalance: 3800, discountPercentageMax: 20, interestRateMonthly: 1.79, installmentRange: { min: 2, max: 24 }, downpaymentEnabled: false, pinEnabled: false },
      },
      {
        id: 'dr-late-lending-long',
        name: 'Late Lending – Long',
        description: 'Long-term overdue lending renegotiation (90+ days).',
        productLine: 'debt-resolution',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 12500, ccBalance: 0, loanBalance: 12500, discountPercentageMax: 42, interestRateMonthly: 2.29, installmentRange: { min: 3, max: 72 }, downpaymentEnabled: true, pinEnabled: false },
      },
      {
        id: 'dr-cc-long-agreements',
        name: 'CC Long – Agreements',
        description: 'Long-term credit card debt agreements with fixed plans.',
        productLine: 'debt-resolution',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'B',
        screens: { ...ALL_SCREENS_ON, simulation: false, installmentValue: false },
        defaults: { totalDebt: 8200, ccBalance: 8200, loanBalance: 0, discountPercentageMax: 30, interestRateMonthly: 2.49, installmentRange: { min: 3, max: 36 }, downpaymentEnabled: true, pinEnabled: false },
      },
      {
        id: 'dr-fp-br',
        name: 'FP – Fatura Parcelada',
        description: 'Installment plan for overdue credit card bills (Brazil).',
        productLine: 'debt-resolution',
        supportedLocales: ['pt-BR'],
        enabled: true,
        flowType: 'A',
        screens: { ...ALL_SCREENS_ON, suggested: false, downpaymentValue: false, downpaymentDueDate: false },
        defaults: { totalDebt: 4500, ccBalance: 4500, loanBalance: 0, discountPercentageMax: 15, interestRateMonthly: 2.19, installmentRange: { min: 2, max: 18 }, downpaymentEnabled: false, pinEnabled: false },
      },
      {
        id: 'dr-rdp-br',
        name: 'RDP – Renegociação de Pendências',
        description: 'Resolution of pending items across products (Brazil).',
        productLine: 'debt-resolution',
        supportedLocales: ['pt-BR'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 7800, ccBalance: 2800, loanBalance: 5000, discountPercentageMax: 35, interestRateMonthly: 1.89, installmentRange: { min: 2, max: 48 }, downpaymentEnabled: true, pinEnabled: false },
      },
    ],
  },

  /* ═══════════════════════════ Lending ════════════════════════════ */
  {
    id: 'lending',
    name: 'Lending',
    description: 'Loan origination and payroll lending flows.',
    enabled: true,
    useCases: [
      {
        id: 'lending-inss-br',
        name: 'INSS',
        description: 'Consigned credit for INSS beneficiaries.',
        productLine: 'lending',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'A',
        screens: { ...LENDING_SCREENS },
        defaults: { totalDebt: 10000, ccBalance: 0, loanBalance: 10000, discountPercentageMax: 0, interestRateMonthly: 1.29, installmentRange: { min: 6, max: 84 }, downpaymentEnabled: false, pinEnabled: true },
      },
      {
        id: 'lending-payroll-br',
        name: 'Private Payroll',
        description: 'Payroll-deducted lending for private-sector employees.',
        productLine: 'lending',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'A',
        screens: { ...LENDING_SCREENS },
        defaults: { totalDebt: 15000, ccBalance: 0, loanBalance: 15000, discountPercentageMax: 0, interestRateMonthly: 1.49, installmentRange: { min: 6, max: 96 }, downpaymentEnabled: false, pinEnabled: true },
      },
      {
        id: 'lending-siape',
        name: 'SIAPE',
        description: 'Consigned credit for federal public servants (SIAPE).',
        productLine: 'lending',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'A',
        screens: { ...LENDING_SCREENS },
        defaults: { totalDebt: 12000, ccBalance: 0, loanBalance: 12000, discountPercentageMax: 0, interestRateMonthly: 1.19, installmentRange: { min: 6, max: 96 }, downpaymentEnabled: false, pinEnabled: true },
      },
      {
        id: 'lending-military',
        name: 'Military',
        description: 'Consigned credit for military personnel.',
        productLine: 'lending',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'A',
        screens: { ...LENDING_SCREENS },
        defaults: { totalDebt: 11000, ccBalance: 0, loanBalance: 11000, discountPercentageMax: 0, interestRateMonthly: 1.25, installmentRange: { min: 6, max: 84 }, downpaymentEnabled: false, pinEnabled: true },
      },
      {
        id: 'lending-personal',
        name: 'Personal Loan',
        description: 'Unsecured personal loan origination.',
        productLine: 'lending',
        supportedLocales: ALL_LOCALES,
        enabled: true,
        flowType: 'A',
        screens: { ...LENDING_SCREENS },
        defaults: { totalDebt: 8000, ccBalance: 0, loanBalance: 8000, discountPercentageMax: 0, interestRateMonthly: 1.89, installmentRange: { min: 3, max: 60 }, downpaymentEnabled: false, pinEnabled: true },
      },
    ],
  },

  /* ═══════════════════════ Credit Card ════════════════════════════ */
  {
    id: 'credit-card',
    name: 'Credit Card',
    description: 'Bill installment and refinancing flows.',
    enabled: true,
    useCases: [
      {
        id: 'cc-bill-installment-mx',
        name: 'Bill Installment',
        description: 'Credit card bill installment plan (Mexico only).',
        productLine: 'credit-card',
        supportedLocales: ['es-MX'],
        enabled: true,
        flowType: 'A',
        screens: { ...ALL_SCREENS_ON, suggested: false },
        defaults: { totalDebt: 8500, ccBalance: 8500, loanBalance: 0, discountPercentageMax: 10, interestRateMonthly: 2.89, installmentRange: { min: 3, max: 36 }, downpaymentEnabled: false, pinEnabled: false },
      },
      {
        id: 'cc-refinancing-co',
        name: 'Refinancing',
        description: 'Credit card debt refinancing (Colombia only).',
        productLine: 'credit-card',
        supportedLocales: ['es-CO'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 1200000, ccBalance: 1200000, loanBalance: 0, discountPercentageMax: 22, interestRateMonthly: 2.59, installmentRange: { min: 2, max: 36 }, downpaymentEnabled: false, pinEnabled: false },
      },
    ],
  },
];

export function getProductLine(id: string) {
  return PRODUCT_LINES.find(pl => pl.id === id);
}

export function getUseCase(id: string) {
  for (const pl of PRODUCT_LINES) {
    const uc = pl.useCases.find(u => u.id === id);
    if (uc) return uc;
  }
  return undefined;
}

export function getEnabledUseCases() {
  return PRODUCT_LINES.flatMap(pl =>
    pl.useCases.filter(uc => uc.enabled)
  );
}

/** All product lines that have at least one use case supporting the locale. */
export function getProductLinesForLocale(locale: Locale): ProductLine[] {
  return PRODUCT_LINES.filter(
    (pl) => pl.useCases.some((uc) => uc.supportedLocales.includes(locale)),
  );
}

/** Use cases for a product line + locale (after country is chosen). */
export function getUseCasesForProductLineAndLocale(
  productLineId: string,
  locale: Locale,
): UseCaseDefinition[] {
  const pl = PRODUCT_LINES.find((p) => p.id === productLineId);
  if (!pl) return [];
  return pl.useCases.filter(
    (uc) => uc.supportedLocales.includes(locale),
  );
}

/** All use case ids (for persisting panel state per use case). */
export function getAllUseCaseIds(): string[] {
  return PRODUCT_LINES.flatMap((pl) => pl.useCases.map((uc) => uc.id));
}
