/**
 * Expo EmulatorConfigContext
 *
 * React context layer for the Expo prototype emulator.
 * Wraps the platform-agnostic pure functions from emulatorConfig.ts.
 *
 * Differences from the web version (web/src/context/EmulatorConfigContext.tsx):
 *   - No sessionStorage persistence (in-memory only)
 *   - No URL-based deep link initialization
 *   - No navigate() abstraction — Expo navigation is handled by App.tsx
 */

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { getUseCase, getUseCasesForProductLineAndLocale } from '../shared/config';
import { SUPPORTED_LOCALES } from '../shared/types';
import type { Locale, UseCaseDefinition } from '../shared/types';
import {
  type ScreenKey,
  type FlowOptionKey,
  type ScreenSettings,
  type FlowOptionState,
  type RuleOverrides,
  type DebtOverrides,
  DEFAULT_FLOW_OPTIONS,
  DEFAULT_DEBT_BY_LOCALE,
  pickDefaultProductLineAndUseCase,
  buildInitialScreenSettings,
  buildDefaultScreenSettings,
  buildInitialFlowOptionState,
  buildInitialStateForAllUseCases,
  resolveEffectiveRules,
} from './emulatorConfig';
import { type FinancialRules } from './financialCalculator';

export type { ScreenKey, FlowOptionKey, ScreenSettings, FlowOptionState, RuleOverrides, DebtOverrides };
export { DEFAULT_DEBT_BY_LOCALE };

export interface ExpoEmulatorConfigValue {
  locale: Locale;
  productLineId: string;
  useCaseId: string;
  selectedUseCase: UseCaseDefinition | undefined;
  screenSettings: ScreenSettings;
  flowOptions: FlowOptionState;
  debtOverrides: DebtOverrides;
  ruleOverrides: RuleOverrides;
  effectiveRules: FinancialRules;

  setLocale: (locale: Locale) => void;
  setProductLine: (id: string) => void;
  setUseCase: (id: string) => void;
  updateScreen: (key: ScreenKey, patch: Partial<{ enabled: boolean; variant: string }>) => void;
  updateFlowOption: (key: FlowOptionKey, value: boolean) => void;
  setDebtOverrides: (overrides: Partial<DebtOverrides>) => void;
  resetDebtOverrides: () => void;
  setRuleOverrides: (overrides: RuleOverrides) => void;
  resetRuleOverrides: () => void;
}

const EmulatorConfigContext = createContext<ExpoEmulatorConfigValue | null>(null);

const INITIAL_LOCALE: Locale = 'pt-BR';

export function EmulatorConfigProvider({ children }: { children: ReactNode }) {
  const initialPick = pickDefaultProductLineAndUseCase(INITIAL_LOCALE);
  const [locale, setLocaleRaw] = useState<Locale>(INITIAL_LOCALE);
  const [productLineId, setProductLineIdRaw] = useState(initialPick.productLineId);
  const [useCaseId, setUseCaseIdRaw] = useState(initialPick.useCaseId);

  const [debtOverridesByLocale, setDebtOverridesByLocale] = useState<Record<string, DebtOverrides>>(() => {
    const init: Record<string, DebtOverrides> = {};
    for (const loc of SUPPORTED_LOCALES) init[loc] = { ...DEFAULT_DEBT_BY_LOCALE[loc] };
    return init;
  });
  const debtOverrides = debtOverridesByLocale[locale] ?? DEFAULT_DEBT_BY_LOCALE[locale];

  const [ruleOverridesByLocale, setRuleOverridesByLocale] = useState<Record<string, RuleOverrides>>({});
  const ruleOverrides = ruleOverridesByLocale[locale] ?? {};

  const selectedUseCase = getUseCase(useCaseId);

  const effectiveRules = useMemo<FinancialRules>(
    () => resolveEffectiveRules(locale, selectedUseCase, ruleOverrides),
    [locale, selectedUseCase, ruleOverrides],
  );

  const [screenSettingsByUseCase, setScreenSettingsByUseCase] = useState<Record<string, ScreenSettings>>(
    () => buildInitialStateForAllUseCases().screenSettings,
  );

  const [flowOptionByUseCase, setFlowOptionByUseCase] = useState<Record<string, FlowOptionState>>(
    () => buildInitialStateForAllUseCases().flowOptions,
  );

  const screenSettings = useMemo((): ScreenSettings => {
    if (!selectedUseCase) return buildDefaultScreenSettings();
    return screenSettingsByUseCase[selectedUseCase.id] ?? buildInitialScreenSettings(selectedUseCase);
  }, [selectedUseCase, screenSettingsByUseCase]);

  const flowOptions = useMemo((): FlowOptionState => {
    if (!selectedUseCase) return DEFAULT_FLOW_OPTIONS;
    return flowOptionByUseCase[selectedUseCase.id] ?? buildInitialFlowOptionState(selectedUseCase);
  }, [selectedUseCase, flowOptionByUseCase]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleRaw(newLocale);
    const pick = pickDefaultProductLineAndUseCase(newLocale);
    setProductLineIdRaw(pick.productLineId);
    setUseCaseIdRaw(pick.useCaseId);
  }, []);

  const setProductLine = useCallback((id: string) => {
    setProductLineIdRaw(id);
    const ucs = getUseCasesForProductLineAndLocale(id, locale);
    setUseCaseIdRaw(ucs[0]?.id ?? '');
  }, [locale]);

  const setUseCase = useCallback((id: string) => {
    setUseCaseIdRaw(id);
  }, []);

  const updateScreen = useCallback((key: ScreenKey, patch: Partial<{ enabled: boolean; variant: string }>) => {
    const ucId = selectedUseCase?.id ?? '_no_uc';
    setScreenSettingsByUseCase((prev) => {
      const current = prev[ucId] ?? screenSettings;
      return { ...prev, [ucId]: { ...current, [key]: { ...current[key], ...patch } } };
    });
  }, [selectedUseCase, screenSettings]);

  const updateFlowOption = useCallback((key: FlowOptionKey, value: boolean) => {
    const ucId = selectedUseCase?.id ?? '_no_uc';
    setFlowOptionByUseCase((prev) => {
      const current = prev[ucId] ?? flowOptions;
      return { ...prev, [ucId]: { ...current, [key]: value } };
    });
  }, [selectedUseCase, flowOptions]);

  const setDebtOverrides = useCallback((patch: Partial<DebtOverrides>) => {
    setDebtOverridesByLocale((prev) => ({
      ...prev,
      [locale]: { ...(prev[locale] ?? DEFAULT_DEBT_BY_LOCALE[locale]), ...patch },
    }));
  }, [locale]);

  const resetDebtOverrides = useCallback(() => {
    setDebtOverridesByLocale((prev) => ({
      ...prev,
      [locale]: { ...DEFAULT_DEBT_BY_LOCALE[locale] },
    }));
  }, [locale]);

  const setRuleOverrides = useCallback((patch: RuleOverrides) => {
    setRuleOverridesByLocale((prev) => ({
      ...prev,
      [locale]: { ...(prev[locale] ?? {}), ...patch },
    }));
  }, [locale]);

  const resetRuleOverrides = useCallback(() => {
    setRuleOverridesByLocale((prev) => ({ ...prev, [locale]: {} }));
  }, [locale]);

  const value = useMemo<ExpoEmulatorConfigValue>(() => ({
    locale, productLineId, useCaseId, selectedUseCase,
    screenSettings, flowOptions, debtOverrides, ruleOverrides, effectiveRules,
    setLocale, setProductLine, setUseCase,
    updateScreen, updateFlowOption,
    setDebtOverrides, resetDebtOverrides,
    setRuleOverrides, resetRuleOverrides,
  }), [
    locale, productLineId, useCaseId, selectedUseCase,
    screenSettings, flowOptions, debtOverrides, ruleOverrides, effectiveRules,
    setLocale, setProductLine, setUseCase,
    updateScreen, updateFlowOption,
    setDebtOverrides, resetDebtOverrides,
    setRuleOverrides, resetRuleOverrides,
  ]);

  return (
    <EmulatorConfigContext.Provider value={value}>
      {children}
    </EmulatorConfigContext.Provider>
  );
}

export function useEmulatorConfig(): ExpoEmulatorConfigValue {
  const ctx = useContext(EmulatorConfigContext);
  if (!ctx) throw new Error('useEmulatorConfig must be used inside EmulatorConfigProvider');
  return ctx;
}
