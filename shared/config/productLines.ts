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

export const PRODUCT_LINES: ProductLine[] = [
  {
    id: 'debt-resolution',
    name: 'Debt Resolution',
    description: 'Renegotiation flows for overdue debt (cards, loans, bills).',
    enabled: true,
    useCases: [
      {
        id: 'dr-mdr-br',
        name: 'MDR',
        description: 'Monthly debt resolution (Brazil market).',
        productLine: 'debt-resolution',
        supportedLocales: ['pt-BR'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: {
          totalDebt: 5230,
          ccBalance: 1890,
          loanBalance: 3340,
          discountPercentageMax: 37,
          interestRateMonthly: 1.99,
          installmentRange: { min: 2, max: 60 },
          downpaymentEnabled: false,
          pinEnabled: false,
        },
      },
      {
        id: 'dr-mdr-mx',
        name: 'MDR',
        description: 'Monthly debt resolution (Mexico market).',
        productLine: 'debt-resolution',
        supportedLocales: ['es-MX'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: {
          totalDebt: 15890,
          ccBalance: 5890,
          loanBalance: 10000,
          discountPercentageMax: 37,
          interestRateMonthly: 2.39,
          installmentRange: { min: 2, max: 60 },
          downpaymentEnabled: false,
          pinEnabled: false,
        },
      },
      {
        id: 'dr-mdr-co',
        name: 'MDR',
        description: 'Monthly debt resolution (Colombia market).',
        productLine: 'debt-resolution',
        supportedLocales: ['es-CO'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: {
          totalDebt: 2500000,
          ccBalance: 900000,
          loanBalance: 1600000,
          discountPercentageMax: 32,
          interestRateMonthly: 2.19,
          installmentRange: { min: 2, max: 48 },
          downpaymentEnabled: false,
          pinEnabled: false,
        },
      },
      {
        id: 'dr-mdr-us',
        name: 'MDR',
        description: 'Monthly debt resolution (US market).',
        productLine: 'debt-resolution',
        supportedLocales: ['en-US'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: {
          totalDebt: 1589.5,
          ccBalance: 589.5,
          loanBalance: 1000,
          discountPercentageMax: 29,
          interestRateMonthly: 1.49,
          installmentRange: { min: 2, max: 60 },
          downpaymentEnabled: false,
          pinEnabled: false,
        },
      },
      {
        id: 'dr-agreements-br',
        name: 'Agreements',
        description: 'Fixed-plan agreements (Brazil market).',
        productLine: 'debt-resolution',
        supportedLocales: ['pt-BR'],
        enabled: false,
        flowType: 'B',
        screens: {
          ...ALL_SCREENS_ON,
          simulation: false,
          installmentValue: false,
        },
        defaults: {
          totalDebt: 3200,
          ccBalance: 1200,
          loanBalance: 2000,
          discountPercentageMax: 25,
          interestRateMonthly: 1.79,
          installmentRange: { min: 3, max: 24 },
          downpaymentEnabled: true,
          pinEnabled: false,
        },
      },
    ],
  },
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
        supportedLocales: ['pt-BR'],
        enabled: true,
        flowType: 'A',
        screens: {
          ...ALL_SCREENS_ON,
          suggested: false,
          downpaymentValue: false,
          downpaymentDueDate: false,
        },
        defaults: {
          totalDebt: 10000,
          ccBalance: 0,
          loanBalance: 10000,
          discountPercentageMax: 0,
          interestRateMonthly: 1.29,
          installmentRange: { min: 6, max: 84 },
          downpaymentEnabled: false,
          pinEnabled: true,
        },
      },
      {
        id: 'lending-payroll-br',
        name: 'Private Payroll',
        description: 'Payroll-deducted lending for private-sector employees.',
        productLine: 'lending',
        supportedLocales: ['pt-BR'],
        enabled: true,
        flowType: 'A',
        screens: {
          ...ALL_SCREENS_ON,
          suggested: false,
          downpaymentValue: false,
          downpaymentDueDate: false,
        },
        defaults: {
          totalDebt: 15000,
          ccBalance: 0,
          loanBalance: 15000,
          discountPercentageMax: 0,
          interestRateMonthly: 1.49,
          installmentRange: { min: 6, max: 96 },
          downpaymentEnabled: false,
          pinEnabled: true,
        },
      },
      {
        id: 'lending-personal-mx',
        name: 'Personal Loan',
        description: 'Personal loan origination (Mexico market).',
        productLine: 'lending',
        supportedLocales: ['es-MX'],
        enabled: true,
        flowType: 'A',
        screens: { ...ALL_SCREENS_ON, suggested: false, downpaymentValue: false, downpaymentDueDate: false },
        defaults: { totalDebt: 25000, ccBalance: 0, loanBalance: 25000, discountPercentageMax: 0, interestRateMonthly: 2.19, installmentRange: { min: 3, max: 48 }, downpaymentEnabled: false, pinEnabled: true },
      },
      {
        id: 'lending-personal-co',
        name: 'Personal Loan',
        description: 'Personal loan origination (Colombia market).',
        productLine: 'lending',
        supportedLocales: ['es-CO'],
        enabled: true,
        flowType: 'A',
        screens: { ...ALL_SCREENS_ON, suggested: false, downpaymentValue: false, downpaymentDueDate: false },
        defaults: { totalDebt: 5000000, ccBalance: 0, loanBalance: 5000000, discountPercentageMax: 0, interestRateMonthly: 1.99, installmentRange: { min: 6, max: 60 }, downpaymentEnabled: false, pinEnabled: true },
      },
      {
        id: 'lending-personal-us',
        name: 'Personal Loan',
        description: 'Personal loan origination (US market).',
        productLine: 'lending',
        supportedLocales: ['en-US'],
        enabled: true,
        flowType: 'A',
        screens: { ...ALL_SCREENS_ON, suggested: false, downpaymentValue: false, downpaymentDueDate: false },
        defaults: { totalDebt: 5000, ccBalance: 0, loanBalance: 5000, discountPercentageMax: 0, interestRateMonthly: 1.29, installmentRange: { min: 6, max: 60 }, downpaymentEnabled: false, pinEnabled: true },
      },
    ],
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    description: 'Bill renegotiation and refinancing flows.',
    enabled: true,
    useCases: [
      {
        id: 'cc-bill-reneg-br',
        name: 'Bill Renegotiation',
        description: 'Credit card bill renegotiation with installment options.',
        productLine: 'credit-card',
        supportedLocales: ['pt-BR'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 2500, ccBalance: 2500, loanBalance: 0, discountPercentageMax: 20, interestRateMonthly: 2.49, installmentRange: { min: 2, max: 24 }, downpaymentEnabled: false, pinEnabled: false },
      },
      {
        id: 'cc-bill-reneg-mx',
        name: 'Bill Renegotiation',
        description: 'Credit card bill renegotiation (Mexico market).',
        productLine: 'credit-card',
        supportedLocales: ['es-MX'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 8500, ccBalance: 8500, loanBalance: 0, discountPercentageMax: 18, interestRateMonthly: 2.89, installmentRange: { min: 3, max: 36 }, downpaymentEnabled: false, pinEnabled: false },
      },
      {
        id: 'cc-bill-reneg-co',
        name: 'Bill Renegotiation',
        description: 'Credit card bill renegotiation (Colombia market).',
        productLine: 'credit-card',
        supportedLocales: ['es-CO'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 1200000, ccBalance: 1200000, loanBalance: 0, discountPercentageMax: 22, interestRateMonthly: 2.59, installmentRange: { min: 2, max: 36 }, downpaymentEnabled: false, pinEnabled: false },
      },
      {
        id: 'cc-bill-reneg-us',
        name: 'Bill Renegotiation',
        description: 'Credit card bill renegotiation (US market).',
        productLine: 'credit-card',
        supportedLocales: ['en-US'],
        enabled: true,
        flowType: 'both',
        screens: { ...ALL_SCREENS_ON },
        defaults: { totalDebt: 3200, ccBalance: 3200, loanBalance: 0, discountPercentageMax: 15, interestRateMonthly: 1.99, installmentRange: { min: 2, max: 24 }, downpaymentEnabled: false, pinEnabled: false },
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
