import { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from 'react';
import {
  PRODUCT_LINES,
  getProductLinesForLocale,
  getUseCasesForProductLineAndLocale,
  getAllUseCaseIds,
} from '@shared/config';
import type { Locale, ScreenVisibility, UseCaseDefinition } from '@shared/types';
import { SUPPORTED_LOCALES } from '@shared/types';
import { readInitialLocation } from '../hooks/usePrototypeLocation';

export type ScreenKey = keyof ScreenVisibility;
export type FlowState = 'idle' | 'running' | 'done';
export type FlowOptionKey = 'pin' | 'downpaymentValue' | 'downpaymentDueDate';
export type ScreenSettings = Record<ScreenKey, { enabled: boolean; variant: string }>;
export type FlowOptionState = Record<FlowOptionKey, boolean>;

const SCREEN_BLOCK_ORDER: ScreenKey[] = [
  'offerHub', 'installmentValue', 'simulation', 'suggested',
  'downpaymentValue', 'downpaymentDueDate', 'dueDate', 'summary',
  'terms', 'pin', 'loading', 'feedback', 'endPath',
];

const SCREEN_VARIANTS_DEFAULTS: Record<ScreenKey, string> = {
  offerHub: 'default', installmentValue: 'default', simulation: 'default',
  suggested: 'default', downpaymentValue: 'default', downpaymentDueDate: 'default',
  dueDate: 'default', summary: 'default', terms: 'default', pin: 'default',
  loading: 'default', feedback: 'default', endPath: 'default',
};

function findUseCaseById(id: string): UseCaseDefinition | undefined {
  for (const pl of PRODUCT_LINES) {
    const uc = pl.useCases.find((u) => u.id === id);
    if (uc) return uc;
  }
  return undefined;
}

function pickDefaultProductLineAndUseCase(locale: Locale): { productLineId: string; useCaseId: string } {
  const pls = getProductLinesForLocale(locale);
  const productLineId = pls[0]?.id ?? '';
  const ucs = getUseCasesForProductLineAndLocale(productLineId, locale);
  const useCaseId = ucs[0]?.id ?? '';
  return { productLineId, useCaseId };
}

function buildInitialScreenSettings(useCase: UseCaseDefinition): ScreenSettings {
  return SCREEN_BLOCK_ORDER.reduce((acc, key) => {
    acc[key] = { enabled: useCase.screens[key], variant: SCREEN_VARIANTS_DEFAULTS[key] };
    return acc;
  }, {} as ScreenSettings);
}

function buildDefaultScreenSettings(): ScreenSettings {
  return SCREEN_BLOCK_ORDER.reduce((acc, key) => {
    acc[key] = { enabled: false, variant: SCREEN_VARIANTS_DEFAULTS[key] };
    return acc;
  }, {} as ScreenSettings);
}

function buildInitialFlowOptionState(useCase: UseCaseDefinition): FlowOptionState {
  return {
    pin: useCase.defaults.pinEnabled && useCase.screens.pin,
    downpaymentValue: useCase.defaults.downpaymentEnabled && useCase.screens.downpaymentValue,
    downpaymentDueDate: useCase.defaults.downpaymentEnabled && useCase.screens.downpaymentDueDate,
  };
}

const DEFAULT_FLOW_OPTIONS: FlowOptionState = { pin: false, downpaymentValue: false, downpaymentDueDate: false };

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
    const matchedUseCase = findUseCaseById(urlUseCaseId);
    const locale: Locale = urlLocale ?? 'pt-BR';
    if (matchedUseCase && matchedUseCase.supportedLocales.includes(locale)) {
      return { locale, productLineId: matchedUseCase.productLine, useCaseId: matchedUseCase.id };
    }
  }

  // 1b. Product line in URL but no valid use case
  if (urlProductLine && urlProductLine !== 'templates') {
    const plMatch = PRODUCT_LINES.find((pl) => pl.id === urlProductLine);
    if (plMatch) {
      const locale: Locale = urlLocale ?? 'pt-BR';
      const ucs = getUseCasesForProductLineAndLocale(plMatch.id, locale);
      return { locale, productLineId: plMatch.id, useCaseId: ucs[0]?.id ?? '' };
    }
  }

  // 2. Restore from session (apply URL locale override if present)
  const saved = loadFromSession();
  if (saved) {
    const locale: Locale = urlLocale ?? saved.locale;
    if (locale === saved.locale && findUseCaseById(saved.useCaseId)) {
      return saved;
    }
    const uc = findUseCaseById(saved.useCaseId);
    if (uc && uc.supportedLocales.includes(locale)) {
      return { locale, productLineId: saved.productLineId, useCaseId: saved.useCaseId };
    }
    const fallback = pickDefaultProductLineAndUseCase(locale);
    return { locale, ...fallback };
  }

  // 3. First visit defaults
  const locale: Locale = urlLocale ?? 'pt-BR';
  return { locale, ...pickDefaultProductLineAndUseCase(locale) };
}

export interface EmulatorConfigValue {
  locale: Locale;
  productLineId: string;
  useCaseId: string;
  selectedUseCase: UseCaseDefinition | undefined;
  flowState: FlowState;
  screenSettings: ScreenSettings;
  flowOptions: FlowOptionState;

  setLocale: (locale: Locale) => void;
  setProductLine: (id: string) => void;
  setUseCase: (id: string) => void;
  setFlowState: (state: FlowState) => void;
  updateScreen: (key: ScreenKey, patch: Partial<{ enabled: boolean; variant: string }>) => void;
  updateFlowOption: (key: FlowOptionKey, value: boolean) => void;
  startFlow: (navigate: (url: string) => void) => void;
  stopFlow: (navigate: (url: string) => void) => void;
}

const EmulatorConfigContext = createContext<EmulatorConfigValue | null>(null);

export function EmulatorConfigProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(resolveInitialState);
  const [locale, setLocaleRaw] = useState<Locale>(initial.locale);
  const [productLineId, setProductLineIdRaw] = useState(initial.productLineId);
  const [useCaseId, setUseCaseIdRaw] = useState(initial.useCaseId);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const doneTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const selectedUseCase = findUseCaseById(useCaseId);

  const [screenSettingsByUseCase, setScreenSettingsByUseCase] = useState<Record<string, ScreenSettings>>(() => {
    const initial: Record<string, ScreenSettings> = {};
    for (const id of getAllUseCaseIds()) {
      const uc = findUseCaseById(id);
      if (uc) initial[id] = buildInitialScreenSettings(uc);
    }
    return initial;
  });

  const [flowOptionByUseCase, setFlowOptionByUseCase] = useState<Record<string, FlowOptionState>>(() => {
    const initial: Record<string, FlowOptionState> = {};
    for (const id of getAllUseCaseIds()) {
      const uc = findUseCaseById(id);
      if (uc) initial[id] = buildInitialFlowOptionState(uc);
    }
    return initial;
  });

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

  const SCREEN_BLOCK_META_PATHS: Record<ScreenKey, string> = {
    offerHub: 'offer-hub', installmentValue: 'installment-value', simulation: 'simulation',
    suggested: 'suggested-conditions', downpaymentValue: 'downpayment-value',
    downpaymentDueDate: 'downpayment-due-date', dueDate: 'due-date', summary: 'summary',
    terms: 'terms-and-conditions', pin: 'pin', loading: 'loading', feedback: 'feedback', endPath: 'end-path',
  };

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
    screenSettings, flowOptions,
    setLocale, setProductLine, setUseCase, setFlowState,
    updateScreen, updateFlowOption, startFlow, stopFlow,
  }), [
    locale, productLineId, useCaseId, selectedUseCase, flowState,
    screenSettings, flowOptions,
    setLocale, setProductLine, setUseCase,
    updateScreen, updateFlowOption, startFlow, stopFlow,
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
