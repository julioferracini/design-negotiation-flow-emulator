/**
 * Shared types — Platform-agnostic type definitions.
 *
 * Locales follow ISO 639-1 language + ISO 3166-1 country code format.
 */

export type Locale = 'pt-BR' | 'es-CO' | 'es-MX' | 'en-US';

export type ProductLineId = 'debt-resolution' | 'lending' | 'credit-card';

export type UseCaseId = string;

export interface ProductLine {
  id: ProductLineId;
  name: string;
  description: string;
  enabled: boolean;
  useCases: UseCaseDefinition[];
}

export interface ScreenVisibility {
  offerHub: boolean;
  eligibility: boolean;
  inputValue: boolean;
  simulation: boolean;
  suggested: boolean;
  dueDate: boolean;
  summary: boolean;
  terms: boolean;
  pin: boolean;
  loading: boolean;
  feedback: boolean;
}

export interface UseCaseDefinition {
  id: UseCaseId;
  name: string;
  description: string;
  productLine: ProductLineId;
  supportedLocales: Locale[];
  enabled: boolean;
  flowType: 'A' | 'B' | 'both';
  screens: ScreenVisibility;
  defaults: FinancialDefaults;
}

export type AmortizationFormulaId = 'price' | 'sac' | 'flat_discount';

export interface FinancialDefaults {
  totalDebt: number;
  ccBalance: number;
  loanBalance: number;
  discountPercentageMax: number;
  interestRateMonthly: number;
  installmentRange: { min: number; max: number };
  downpaymentEnabled: boolean;
  pinEnabled: boolean;
  formula?: AmortizationFormulaId;
}

export interface CurrencyConfig {
  symbol: string;
  code: string;
  decimalSeparator: '.' | ',';
  thousandSeparator: '.' | ',';
}

export const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'es-MX', 'es-CO', 'en-US'];

export const LOCALE_CURRENCIES: Record<Locale, CurrencyConfig> = {
  'pt-BR': { symbol: 'R$', code: 'BRL', decimalSeparator: ',', thousandSeparator: '.' },
  'es-MX': { symbol: '$', code: 'MXN', decimalSeparator: '.', thousandSeparator: ',' },
  'es-CO': { symbol: '$', code: 'COP', decimalSeparator: ',', thousandSeparator: '.' },
  'en-US': { symbol: '$', code: 'USD', decimalSeparator: '.', thousandSeparator: ',' },
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  'es-MX': '🇲🇽',
  'es-CO': '🇨🇴',
  'en-US': '🇺🇸',
};

export const LOCALE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'es-MX': 'Español (México)',
  'es-CO': 'Español (Colombia)',
  'en-US': 'English (US)',
};

export const LOCALE_SHORT_NAMES: Record<Locale, string> = {
  'pt-BR': 'pt-BR',
  'es-MX': 'es-MX',
  'es-CO': 'es-CO',
  'en-US': 'en-US',
};

/** Short region name for UI chips, e.g. "pt-BR (Brazil)". */
export const LOCALE_REGION_EN: Record<Locale, string> = {
  'pt-BR': 'Brazil',
  'es-MX': 'Mexico',
  'es-CO': 'Colombia',
  'en-US': 'US',
};
