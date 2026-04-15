import { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { getUseCase, getUseCasesForProductLineAndLocale, PRODUCT_LINES } from '@shared/config';
import type { Locale, UseCaseDefinition } from '@shared/types';
import { type FinancialRules } from '../../../config/financialCalculator';
import { SUPPORTED_LOCALES } from '@shared/types';
import { readInitialLocation } from '../hooks/usePrototypeLocation';
import {
  type ScreenKey,
  type FlowState,
  type FlowOptionKey,
  type ScreenSettings,
  type FlowOptionState,
  type RuleOverrides,
  type DebtOverrides,
  SCREEN_BLOCK_ORDER,
  SCREEN_BLOCK_META_PATHS,
  DEFAULT_FLOW_OPTIONS,
  DEFAULT_SIMULATED_LATENCY_MS,
  DEFAULT_DEBT_BY_LOCALE,
  pickDefaultProductLineAndUseCase,
  buildInitialScreenSettings,
  buildDefaultScreenSettings,
  buildInitialFlowOptionState,
  buildInitialStateForAllUseCases,
  resolveEffectiveRules,
} from '../../../config/emulatorConfig';

const SESSION_KEY = 'emulator-config';

type PersistedState = { locale: Locale; productLineId: string; useCaseId: string };

function saveToSession(state: PersistedState) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
}

function loadFromSession(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      SUPPORTED_LOCALES.includes(parsed.locale) &&
      typeof parsed.productLineId === 'string' &&
      typeof parsed.useCaseId === 'string'
    ) return parsed as PersistedState;
  } catch { /* parse error / private mode */ }
  return null;
}

/**
 * Resolve initial emulator state from (in priority order):
 *   1. URL path + query string  (deep links / locale change)
 *   2. sessionStorage            (survives page refresh)
 *   3. Hardcoded defaults        (first visit)
 */
function resolveInitialState(): PersistedState {
  const { pathname, search } = readInitialLocation();

  const langParam = new URLSearchParams(search).get('lang')?.trim() ?? '';
  const urlLocale = SUPPORTED_LOCALES.includes(langParam as Locale) ? (langParam as Locale) : null;

  let stripped = pathname;
  if (stripped.startsWith('/emulator')) {
    stripped = stripped.slice('/emulator'.length) || '/';
  }
  const parts = stripped.split('/').filter(Boolean);

  const urlProductLine = parts[0] ?? null;
  const urlUseCaseId = parts[1] ?? null;

  // 1a. Full deep link: product line + use case in URL
  if (urlUseCaseId) {
    const matchedUseCase = getUseCase(urlUseCaseId);
    const locale: Locale = urlLocale ?? 'pt-BR';
    if (matchedUseCase && matchedUseCase.supportedLocales.includes(locale)) {
      return { locale, productLineId: matchedUseCase.productLine, useCaseId: matchedUseCase.id };
    }
  }

  // 1b. Product line in URL but no valid use case — don't auto-select
  if (urlProductLine && urlProductLine !== 'templates') {
    const plMatch = PRODUCT_LINES.find((pl) => pl.id === urlProductLine);
    if (plMatch) {
      const locale: Locale = urlLocale ?? 'pt-BR';
      return { locale, productLineId: plMatch.id, useCaseId: '' };
    }
  }

  // 2. Restore locale/productLine from session, but NOT useCaseId (user must select)
  const saved = loadFromSession();
  if (saved) {
    const locale: Locale = urlLocale ?? saved.locale;
    const fallback = pickDefaultProductLineAndUseCase(locale);
    return { locale, productLineId: saved.productLineId || fallback.productLineId, useCaseId: '' };
  }

  // 3. First visit defaults
  const locale: Locale = urlLocale ?? 'pt-BR';
  return { locale, ...pickDefaultProductLineAndUseCase(locale) };
}

export { DEFAULT_SIMULATED_LATENCY_MS, DEFAULT_DEBT_BY_LOCALE } from '../../../config/emulatorConfig';
export type { RuleOverrides, DebtOverrides } from '../../../config/emulatorConfig';

export interface EmulatorConfigValue {
  locale: Locale;
  productLineId: string;
  useCaseId: string;
  selectedUseCase: UseCaseDefinition | undefined;
  flowState: FlowState;
  screenSettings: ScreenSettings;
  flowOptions: FlowOptionState;
  simulatedLatencyMs: number;
  debtOverrides: DebtOverrides;
  ruleOverrides: RuleOverrides;
  effectiveRules: FinancialRules;
  prototypeRefreshKey: number;

  setLocale: (locale: Locale) => void;
  setProductLine: (id: string) => void;
  setUseCase: (id: string) => void;
  setFlowState: (state: FlowState) => void;
  updateScreen: (key: ScreenKey, patch: Partial<{ enabled: boolean; variant: string }>) => void;
  updateFlowOption: (key: FlowOptionKey, value: boolean) => void;
  startFlow: (navigate: (url: string) => void) => void;
  stopFlow: (navigate: (url: string) => void) => void;
  setSimulatedLatencyMs: (ms: number) => void;
  setDebtOverrides: (overrides: Partial<DebtOverrides>) => void;
  resetDebtOverrides: () => void;
  setRuleOverrides: (overrides: RuleOverrides) => void;
  resetRuleOverrides: () => void;
}

const EmulatorConfigContext = createContext<EmulatorConfigValue | null>(null);

export function EmulatorConfigProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(resolveInitialState);
  const [locale, setLocaleRaw] = useState<Locale>(initial.locale);
  const [productLineId, setProductLineIdRaw] = useState(initial.productLineId);
  const [useCaseId, setUseCaseIdRaw] = useState(initial.useCaseId);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [simulatedLatencyMs, setSimulatedLatencyMs] = useState(DEFAULT_SIMULATED_LATENCY_MS);
  const [prototypeRefreshKey, setPrototypeRefreshKey] = useState(0);
  const [debtOverridesByLocale, setDebtOverridesByLocale] = useState<Record<string, DebtOverrides>>(() => {
    const init: Record<string, DebtOverrides> = {};
    for (const loc of SUPPORTED_LOCALES) init[loc] = { ...DEFAULT_DEBT_BY_LOCALE[loc] };
    return init;
  });
  const debtOverrides = debtOverridesByLocale[locale] ?? DEFAULT_DEBT_BY_LOCALE[locale];

  const setDebtOverrides = useCallback((patch: Partial<DebtOverrides>) => {
    setDebtOverridesByLocale((prev) => ({
      ...prev,
      [locale]: { ...(prev[locale] ?? DEFAULT_DEBT_BY_LOCALE[locale]), ...patch },
    }));
    setPrototypeRefreshKey((k) => k + 1);
  }, [locale]);

  const resetDebtOverrides = useCallback(() => {
    setDebtOverridesByLocale((prev) => ({
      ...prev,
      [locale]: { ...DEFAULT_DEBT_BY_LOCALE[locale] },
    }));
    setPrototypeRefreshKey((k) => k + 1);
  }, [locale]);

  const [ruleOverridesByLocale, setRuleOverridesByLocale] = useState<Record<string, RuleOverrides>>({});
  const ruleOverrides = ruleOverridesByLocale[locale] ?? {};

  const selectedUseCase = getUseCase(useCaseId);

  const effectiveRules = useMemo<FinancialRules>(
    () => resolveEffectiveRules(locale, selectedUseCase, ruleOverrides),
    [locale, selectedUseCase, ruleOverrides],
  );

  const setRuleOverrides = useCallback((patch: RuleOverrides) => {
    setRuleOverridesByLocale((prev) => ({
      ...prev,
      [locale]: { ...(prev[locale] ?? {}), ...patch },
    }));
    setPrototypeRefreshKey((k) => k + 1);
  }, [locale]);

  const resetRuleOverrides = useCallback(() => {
    setRuleOverridesByLocale((prev) => ({
      ...prev,
      [locale]: {},
    }));
    setPrototypeRefreshKey((k) => k + 1);
  }, [locale]);

  const doneTimerRef = useRef<ReturnType<typeof setTimeout>>();

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

  const startFlow = useCallback((navigate: (url: string) => void) => {
    const firstKey = SCREEN_BLOCK_ORDER.find((key) => screenSettings[key].enabled);
    if (!firstKey) return;
    const pl = selectedUseCase?.productLine ?? 'debt-resolution';
    const ucId = useCaseId || 'preview';
    const screenPath = SCREEN_BLOCK_META_PATHS[firstKey];
    setFlowState('running');
    navigate(`/emulator/${pl}/${ucId}/${screenPath}?lang=${locale}`);
  }, [screenSettings, selectedUseCase, useCaseId, locale]);

  const stopFlow = useCallback((navigate: (url: string) => void) => {
    setFlowState('done');
    navigate('/emulator');
    doneTimerRef.current = setTimeout(() => setFlowState('idle'), 1800);
  }, []);

  useEffect(() => () => { if (doneTimerRef.current) clearTimeout(doneTimerRef.current); }, []);

  useEffect(() => {
    saveToSession({ locale, productLineId, useCaseId });
  }, [locale, productLineId, useCaseId]);

  const value = useMemo<EmulatorConfigValue>(() => ({
    locale, productLineId, useCaseId, selectedUseCase, flowState,
    screenSettings, flowOptions, simulatedLatencyMs, debtOverrides, ruleOverrides, effectiveRules, prototypeRefreshKey,
    setLocale, setProductLine, setUseCase, setFlowState,
    updateScreen, updateFlowOption, startFlow, stopFlow,
    setSimulatedLatencyMs, setDebtOverrides, resetDebtOverrides,
    setRuleOverrides, resetRuleOverrides,
  }), [
    locale, productLineId, useCaseId, selectedUseCase, flowState,
    screenSettings, flowOptions, simulatedLatencyMs, debtOverrides, ruleOverrides, effectiveRules, prototypeRefreshKey,
    setLocale, setProductLine, setUseCase,
    updateScreen, updateFlowOption, startFlow, stopFlow,
    setDebtOverrides, resetDebtOverrides,
    setRuleOverrides, resetRuleOverrides,
  ]);

  return (
    <EmulatorConfigContext.Provider value={value}>
      {children}
    </EmulatorConfigContext.Provider>
  );
}

export function useEmulatorConfig(): EmulatorConfigValue {
  const ctx = useContext(EmulatorConfigContext);
  if (!ctx) throw new Error('useEmulatorConfig must be used inside EmulatorConfigProvider');
  return ctx;
}
