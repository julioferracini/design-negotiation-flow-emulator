/**
 * Emulator configuration — pure logic layer.
 *
 * Platform-agnostic types, constants, and pure functions shared between
 * the Vite web emulator and the Expo Go prototype.
 *
 * No React, no React Native, no platform APIs.
 * Both platforms consume this file directly.
 */

import type { Locale, ScreenVisibility, UseCaseDefinition } from '../shared/types';
import {
  getProductLinesForLocale,
  getUseCasesForProductLineAndLocale,
  getAllUseCaseIds,
  getUseCase,
} from '../shared/config';
import { getRules, type FinancialRules } from './financialCalculator';

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export type ScreenKey = keyof ScreenVisibility;
export type FlowState = 'idle' | 'running' | 'done';
export type FlowOptionKey = 'pin';
export type ScreenSettings = Record<ScreenKey, { enabled: boolean; variant: string }>;
export type FlowOptionState = Record<FlowOptionKey, boolean>;

export type RuleOverrides = Partial<Pick<FinancialRules,
  | 'minInstallments' | 'maxInstallments' | 'downPaymentThreshold' | 'downPaymentDebtThreshold'
  | 'downPaymentMinPercent' | 'downPaymentMaxPercent' | 'monthlyInterestRate'
  | 'formula' | 'offer1DiscountPercent' | 'offer2DiscountPercent' | 'offer2Installments'
  | 'offer3DiscountPercent' | 'offer3Installments' | 'discountPerInstallmentLess'
  | 'annualRateCC' | 'annualRateLoan' | 'minInstallmentAmount' | 'downpaymentAlwaysVisible'
  | 'dueDateBusinessDays'
>>;

export type DebtOverrides = {
  cardBalance: number;
  loanBalance: number;
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Constants                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

export const SCREEN_BLOCK_ORDER: ScreenKey[] = [
  'offerHub', 'inputValue', 'simulation', 'suggested',
  'dueDate', 'summary', 'terms', 'pin', 'loading', 'feedback',
];

export const SCREEN_VARIANTS_DEFAULTS: Record<ScreenKey, string> = {
  offerHub: 'default', inputValue: 'installment-value', simulation: 'default',
  suggested: 'default', dueDate: 'first-installment-date', summary: 'default',
  terms: 'default', pin: 'default', loading: 'default', feedback: 'default',
};

export const DEFAULT_FLOW_OPTIONS: FlowOptionState = {
  pin: false,
};

export const DEFAULT_SIMULATED_LATENCY_MS = 200;

export const DEFAULT_DEBT_BY_LOCALE: Record<Locale, DebtOverrides> = {
  'pt-BR': { cardBalance: 1890, loanBalance: 3340 },
  'en-US': { cardBalance: 589.50, loanBalance: 1000 },
  'es-CO': { cardBalance: 900000, loanBalance: 1600000 },
  'es-MX': { cardBalance: 1890, loanBalance: 3340 },
};

/**
 * Maps ScreenKey → URL path segment used in the web emulator deep links.
 * Kept here so both web and Expo can generate consistent screen identifiers.
 */
export const SCREEN_BLOCK_META_PATHS: Record<ScreenKey, string> = {
  offerHub: 'offer-hub',
  inputValue: 'input-value',
  simulation: 'simulation',
  suggested: 'suggested-conditions',
  dueDate: 'due-date',
  summary: 'summary',
  terms: 'terms-and-conditions',
  pin: 'pin',
  loading: 'loading',
  feedback: 'feedback',
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Pure functions                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

/**
 * Returns the first product line for a given locale.
 * Use case is empty by default — user must explicitly select one.
 */
export function pickDefaultProductLineAndUseCase(
  locale: Locale,
): { productLineId: string; useCaseId: string } {
  const pls = getProductLinesForLocale(locale);
  const productLineId = pls[0]?.id ?? '';
  return { productLineId, useCaseId: '' };
}

/**
 * Builds the initial screen settings for a use case, using each screen's
 * visibility flag from the use case definition and default variants.
 */
export function buildInitialScreenSettings(useCase: UseCaseDefinition): ScreenSettings {
  return SCREEN_BLOCK_ORDER.reduce<ScreenSettings>((acc, key) => {
    acc[key] = { enabled: useCase.screens[key], variant: SCREEN_VARIANTS_DEFAULTS[key] };
    return acc;
  }, {} as ScreenSettings);
}

/**
 * Builds a screen settings object with all screens disabled.
 * Used as a safe fallback when no use case is selected.
 */
export function buildDefaultScreenSettings(): ScreenSettings {
  return SCREEN_BLOCK_ORDER.reduce<ScreenSettings>((acc, key) => {
    acc[key] = { enabled: false, variant: SCREEN_VARIANTS_DEFAULTS[key] };
    return acc;
  }, {} as ScreenSettings);
}

/**
 * Builds the initial flow option toggles for a use case, derived from
 * the use case's defaults (pinEnabled, downpaymentEnabled) and screen visibility.
 */
export function buildInitialFlowOptionState(useCase: UseCaseDefinition): FlowOptionState {
  return {
    pin: useCase.defaults.pinEnabled && useCase.screens.pin,
  };
}

/**
 * Pre-builds initial screen settings and flow options for every registered
 * use case. Call once during context initialization to avoid per-render cost.
 */
export function buildInitialStateForAllUseCases(): {
  screenSettings: Record<string, ScreenSettings>;
  flowOptions: Record<string, FlowOptionState>;
} {
  const screenSettings: Record<string, ScreenSettings> = {};
  const flowOptions: Record<string, FlowOptionState> = {};
  for (const id of getAllUseCaseIds()) {
    const uc = getUseCase(id);
    if (uc) {
      screenSettings[id] = buildInitialScreenSettings(uc);
      flowOptions[id] = buildInitialFlowOptionState(uc);
    }
  }
  return { screenSettings, flowOptions };
}

/**
 * Computes the effective financial rules by merging (in priority order):
 *   1. Base locale rules (from financialCalculator)
 *   2. Use-case defaults (installment range, rate, formula)
 *   3. User overrides (from ParameterPanel on web or ConfigScreen on Expo)
 *
 * This is the single source of truth for which rules are active during
 * a prototype session — used by SimulationScreen, OfferHubScreen, etc.
 */
export function resolveEffectiveRules(
  locale: Locale,
  useCase: UseCaseDefinition | undefined,
  ruleOverrides: RuleOverrides,
): FinancialRules {
  const base = getRules(locale);
  const useCasePatch: Partial<FinancialRules> = useCase
    ? {
        minInstallments: useCase.defaults.installmentRange.min,
        maxInstallments: useCase.defaults.installmentRange.max,
        monthlyInterestRate: useCase.defaults.interestRateMonthly / 100,
        ...(useCase.defaults.formula ? { formula: useCase.defaults.formula } : {}),
      }
    : {};
  return { ...base, ...useCasePatch, ...ruleOverrides };
}
