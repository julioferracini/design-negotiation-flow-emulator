/**
 * ParameterPanel — Left panel for use case + theme configuration.
 *
 * Features:
 * - Theme, locale, product line, use case selection
 * - Building Blocks screen list with variants
 * - Flow state machine: idle → running → done → idle
 * - Overlay lock during flow execution
 * - Screen Templates sandbox at bottom
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PRODUCT_LINES,
  getProductLinesForLocale,
  getUseCasesForProductLineAndLocale,
  getAllUseCaseIds,
} from '@shared/config';
import {
  LOCALE_FLAGS,
  LOCALE_SHORT_NAMES,
  LOCALE_REGION_EN,
  SUPPORTED_LOCALES,
  type Locale,
  type ProductLine,
  type ScreenVisibility,
  type UseCaseDefinition,
} from '@shared/types';
import {
  useTheme,
  SEGMENTS,
  getSegmentSwatchColor,
  type NuDSSegment,
  type ThemeMode,
} from '../../context/ThemeContext';
import { usePrototypeNavigate } from '../../context/PrototypeNavigationContext';
import { Sun, Moon, ExternalLink, ChevronDown, Check, Square, Play, Loader2, CheckCircle2, Eye } from 'lucide-react';

type ScreenKey = keyof ScreenVisibility;
type FlowState = 'idle' | 'running' | 'done';

type VariantOption = { id: string; label: string };
type BlockMeta = { key: ScreenKey; title: string; description: string; path: string };
type ScreenSettings = Record<ScreenKey, { enabled: boolean; variant: string }>;
type FlowOptionKey = 'pin' | 'downpaymentValue' | 'downpaymentDueDate';
type FlowOptionState = Record<FlowOptionKey, boolean>;

const SCREEN_BLOCK_ORDER: ScreenKey[] = [
  'offerHub', 'installmentValue', 'simulation', 'suggested',
  'downpaymentValue', 'downpaymentDueDate', 'dueDate', 'summary',
  'terms', 'pin', 'loading', 'feedback', 'endPath',
];

const READY_SCREENS: Set<ScreenKey> = new Set(['offerHub', 'suggested', 'simulation', 'summary', 'installmentValue']);

const LEGACY_SCREENS: Set<ScreenKey> = new Set(['terms', 'pin']);

const SCREEN_BLOCK_META: Record<ScreenKey, BlockMeta> = {
  offerHub: { key: 'offerHub', title: 'Offer Hub', description: 'Three renegotiation offers', path: 'offer-hub' },
  installmentValue: { key: 'installmentValue', title: 'Installment Value', description: 'ATM-style numeric keypad', path: 'installment-value' },
  simulation: { key: 'simulation', title: 'Simulation', description: 'Flow A slider with animations', path: 'simulation' },
  suggested: { key: 'suggested', title: 'Suggested Conditions', description: 'Flow B best-match card', path: 'suggested-conditions' },
  downpaymentValue: { key: 'downpaymentValue', title: 'Downpayment Value', description: 'Amount input with validation', path: 'downpayment-value' },
  downpaymentDueDate: { key: 'downpaymentDueDate', title: 'Downpayment Due Date', description: 'Date picker for downpayment', path: 'downpayment-due-date' },
  dueDate: { key: 'dueDate', title: 'Due Date', description: 'Calendar for payment date', path: 'due-date' },
  summary: { key: 'summary', title: 'Summary', description: 'Review with edit capability', path: 'summary' },
  terms: { key: 'terms', title: 'Terms & Conditions', description: 'Scrollable legal copy', path: 'terms-and-conditions' },
  pin: { key: 'pin', title: 'PIN', description: '4-digit confirmation', path: 'pin' },
  loading: { key: 'loading', title: 'Loading', description: 'Progress animation', path: 'loading' },
  feedback: { key: 'feedback', title: 'Feedback', description: 'Success screen with CTA', path: 'feedback' },
  endPath: { key: 'endPath', title: 'End Path', description: 'Final completion screen', path: 'end-path' },
};

const SCREEN_VARIANTS: Record<ScreenKey, VariantOption[]> = {
  offerHub: [{ id: 'default', label: 'Default' }, { id: 'cards-v2', label: 'Cards V2' }],
  installmentValue: [{ id: 'default', label: 'Default' }, { id: 'compact-keypad', label: 'Compact Keypad' }],
  simulation: [{ id: 'default', label: 'Default' }, { id: 'roulette-v2', label: 'Roulette V2' }],
  suggested: [{ id: 'default', label: 'Default' }, { id: 'cards-emphasis', label: 'Cards Emphasis' }],
  downpaymentValue: [{ id: 'default', label: 'Default' }, { id: 'slider-mode', label: 'Slider Mode' }],
  downpaymentDueDate: [{ id: 'default', label: 'Default' }, { id: 'calendar-modal', label: 'Calendar Modal' }],
  dueDate: [{ id: 'default', label: 'Default' }, { id: 'month-grid', label: 'Month Grid' }],
  summary: [{ id: 'default', label: 'Default' }, { id: 'grouped-cards', label: 'Grouped Cards' }],
  terms: [{ id: 'default', label: 'Default' }, { id: 'short-consent', label: 'Short Consent' }],
  pin: [{ id: 'default', label: 'Default' }, { id: 'inline', label: 'Inline' }],
  loading: [{ id: 'default', label: 'Default' }, { id: 'progress-steps', label: 'Progress Steps' }],
  feedback: [{ id: 'default', label: 'Default' }, { id: 'cta-prominent', label: 'CTA Prominent' }],
  endPath: [{ id: 'default', label: 'Default' }, { id: 'timeline', label: 'Timeline' }],
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
    acc[key] = { enabled: useCase.screens[key], variant: SCREEN_VARIANTS[key][0]?.id ?? 'default' };
    return acc;
  }, {} as ScreenSettings);
}

function buildDefaultScreenSettings(): ScreenSettings {
  return SCREEN_BLOCK_ORDER.reduce((acc, key) => {
    acc[key] = { enabled: false, variant: SCREEN_VARIANTS[key][0]?.id ?? 'default' };
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

function buildStepPath(productLine: string, useCaseId: string, screenPath: string, locale: Locale): string {
  return `/emulator/${productLine}/${useCaseId}/${screenPath}?lang=${locale}`;
}

/* ─────────────────────────────────── Main ─────────────────────────────────── */

export default function ParameterPanel() {
  const { segment, setSegment, mode, toggleMode, palette } = useTheme();
  const navigate = usePrototypeNavigate();

  const defaultPick = pickDefaultProductLineAndUseCase('pt-BR');
  const [selectedLocale, setSelectedLocale] = useState<Locale>('pt-BR');
  const [selectedProductLineId, setSelectedProductLineId] = useState<string>(defaultPick.productLineId);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string>(defaultPick.useCaseId);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const doneTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const productLinesForLocale = useMemo(() => getProductLinesForLocale(selectedLocale), [selectedLocale]);
  const useCasesForSelection = useMemo(() => getUseCasesForProductLineAndLocale(selectedProductLineId, selectedLocale), [selectedProductLineId, selectedLocale]);
  const selectedUseCase = findUseCaseById(selectedUseCaseId);

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

  const [buildingBlocksExpanded, setBuildingBlocksExpanded] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    setSelectedLocale(locale);
    const { productLineId, useCaseId } = pickDefaultProductLineAndUseCase(locale);
    setSelectedProductLineId(productLineId);
    setSelectedUseCaseId(useCaseId);

    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/emulator') {
      navigate(`${currentPath}?lang=${locale}`);
    }
  };

  const handleProductLineChange = (productLineId: string) => {
    setSelectedProductLineId(productLineId);
    const ucs = getUseCasesForProductLineAndLocale(productLineId, selectedLocale);
    setSelectedUseCaseId(ucs[0]?.id ?? '');
  };

  const screenSettings = useMemo((): ScreenSettings => {
    if (!selectedUseCase) return buildDefaultScreenSettings();
    return screenSettingsByUseCase[selectedUseCase.id] ?? buildInitialScreenSettings(selectedUseCase);
  }, [selectedUseCase, screenSettingsByUseCase]);

  const flowOptions = useMemo((): FlowOptionState => {
    if (!selectedUseCase) return DEFAULT_FLOW_OPTIONS;
    return flowOptionByUseCase[selectedUseCase.id] ?? buildInitialFlowOptionState(selectedUseCase);
  }, [selectedUseCase, flowOptionByUseCase]);

  const enabledStepsCount = useMemo(() => SCREEN_BLOCK_ORDER.filter((key) => screenSettings[key].enabled).length, [screenSettings]);

  const handleStartFlow = useCallback(() => {
    const firstKey = SCREEN_BLOCK_ORDER.find((key) => screenSettings[key].enabled);
    if (!firstKey) return;
    const pl = selectedUseCase?.productLine ?? 'debt-resolution';
    const ucId = selectedUseCaseId || 'preview';
    const meta = SCREEN_BLOCK_META[firstKey];
    const path = buildStepPath(pl, ucId, meta.path, selectedLocale);
    setFlowState('running');
    navigate(path);
  }, [screenSettings, selectedUseCase, selectedUseCaseId, selectedLocale, navigate]);

  const handleStopFlow = useCallback(() => {
    setFlowState('done');
    navigate('/emulator');
    doneTimerRef.current = setTimeout(() => setFlowState('idle'), 1800);
  }, [navigate]);

  useEffect(() => () => { if (doneTimerRef.current) clearTimeout(doneTimerRef.current); }, []);

  const handleTemplatePreview = useCallback((screenPath: string) => {
    const path = buildStepPath('templates', 'preview', screenPath, selectedLocale);
    navigate(path);
  }, [selectedLocale, navigate]);

  const updateScreen = (screenKey: ScreenKey, patch: Partial<{ enabled: boolean; variant: string }>) => {
    const ucId = selectedUseCase?.id ?? '_no_uc';
    setScreenSettingsByUseCase((prev) => {
      const current = prev[ucId] ?? screenSettings;
      return { ...prev, [ucId]: { ...current, [screenKey]: { ...current[screenKey], ...patch } } };
    });
  };

  const updateFlowOption = (key: FlowOptionKey, value: boolean) => {
    const ucId = selectedUseCase?.id ?? '_no_uc';
    setFlowOptionByUseCase((prev) => {
      const current = prev[ucId] ?? flowOptions;
      return { ...prev, [ucId]: { ...current, [key]: value } };
    });
  };

  const isLight = mode === 'light';
  const borderCol = palette.border;
  const textPrimary = palette.textPrimary;
  const textSecondary = palette.textSecondary;
  const labelColor = isLight ? 'rgba(31,2,48,0.4)' : 'rgba(255,255,255,0.5)';
  const isRunning = flowState !== 'idle';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', position: 'relative' }}>

      {/* ───── Scroll content ───── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 32px' }}>

        {/* Theme */}
        <SectionLabel color={labelColor}>Theme</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SegmentSelector value={segment} mode={mode} onChange={setSegment} palette={palette} isLight={isLight} />
          <DarkLightToggle mode={mode} onToggle={toggleMode} palette={palette} isLight={isLight} />
        </div>
        <div style={{
          marginTop: 12, padding: '12px 14px', borderRadius: 12, background: palette.background,
          border: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s ease',
        }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: palette.accent, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: textPrimary, transition: 'color 0.3s' }}>
              {SEGMENTS.find(s => s.id === segment)?.label} · {isLight ? 'Light' : 'Dark'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: textSecondary, fontFamily: 'monospace', transition: 'color 0.3s' }}>
              {palette.accent}
            </p>
          </div>
        </div>

        <Divider color={borderCol} />

        {/* Country / Language */}
        <SectionLabel color={labelColor}>Country / Language</SectionLabel>
        <LocaleSelector value={selectedLocale} options={SUPPORTED_LOCALES} onChange={handleLocaleChange} palette={palette} isLight={isLight} />

        {/* Product Line */}
        <div style={{ marginTop: 16 }}>
          <SectionLabel color={labelColor}>Product Line</SectionLabel>
          {productLinesForLocale.length === 0 ? (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: textSecondary, lineHeight: 1.45 }}>
              No product lines available for this country yet.
            </p>
          ) : (
            <ProductLineSelector value={selectedProductLineId} options={productLinesForLocale} onChange={handleProductLineChange} palette={palette} isLight={isLight} />
          )}
        </div>

        {/* Product Flow (Use Cases) — primary selection block */}
        <div style={{
          marginTop: 20,
          padding: '16px 16px 18px',
          borderRadius: 14,
          border: `2px solid ${palette.accent}30`,
          background: isLight ? `${palette.accent}06` : `${palette.accent}0A`,
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: palette.textPrimary, letterSpacing: '-0.1px',
              transition: 'color 0.3s',
            }}>
              Product Flow (Use Cases)
            </span>
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
              padding: '2px 8px', borderRadius: 5,
              background: palette.accentSubtle, color: palette.accent,
            }}>
              Primary
            </span>
          </div>
          <p style={{
            margin: '0 0 12px', fontSize: 11, color: textSecondary, lineHeight: 1.45,
          }}>
            Select the negotiation flow to emulate. Each use case maps to a specific product and regulatory context.
          </p>
          {useCasesForSelection.length === 0 ? (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: textSecondary, lineHeight: 1.45 }}>
              No use cases for this product line in the selected country.
            </p>
          ) : (
            <UseCaseSelector value={selectedUseCaseId} options={useCasesForSelection} onChange={setSelectedUseCaseId} palette={palette} isLight={isLight} />
          )}
        </div>

        <Divider color={borderCol} />

        {/* Flow Parameters */}
        <CollapsibleSection
          title="Flow Parameters"
          summary={`${enabledStepsCount} steps enabled`}
          description="Configure the screen sequence, variants, and flow options for this use case."
          expanded={buildingBlocksExpanded}
          onToggle={() => setBuildingBlocksExpanded(!buildingBlocksExpanded)}
          palette={palette}
          isLight={isLight}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {SCREEN_BLOCK_ORDER.map((screenKey) => {
              const meta = SCREEN_BLOCK_META[screenKey];
              const setting = screenSettings[screenKey];
              const variants = SCREEN_VARIANTS[screenKey];
              const pl = selectedUseCase?.productLine ?? 'debt-resolution';
              const ucId = selectedUseCaseId || 'preview';
              const path = buildStepPath(pl, ucId, meta.path, selectedLocale);
              const isLegacy = LEGACY_SCREENS.has(screenKey);
              return (
                <ScreenRow
                  key={screenKey}
                  title={meta.title}
                  description={meta.description}
                  enabled={setting.enabled}
                  variant={setting.variant}
                  variants={variants}
                  path={path}
                  versionTag={isLegacy ? 'legacy' : 'magic'}
                  onToggle={() => updateScreen(screenKey, { enabled: !setting.enabled })}
                  onVariantChange={(variant) => updateScreen(screenKey, { variant })}
                  palette={palette}
                  isLight={isLight}
                />
              );
            })}
          </div>

          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, margin: '20px 0 8px', color: labelColor }}>
            Flow Options
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FlowOptionRow title="PIN confirmation" enabled={flowOptions.pin} onToggle={() => updateFlowOption('pin', !flowOptions.pin)} palette={palette} isLight={isLight} />
            <FlowOptionRow title="Downpayment value step" enabled={flowOptions.downpaymentValue} onToggle={() => updateFlowOption('downpaymentValue', !flowOptions.downpaymentValue)} palette={palette} isLight={isLight} />
            <FlowOptionRow title="Downpayment due date step" enabled={flowOptions.downpaymentDueDate} onToggle={() => updateFlowOption('downpaymentDueDate', !flowOptions.downpaymentDueDate)} palette={palette} isLight={isLight} />
          </div>
        </CollapsibleSection>

        <Divider color={borderCol} />

        {/* Local Regulatory Adjustments */}
        <SectionLabel color={labelColor}>Local Regulatory Adjustments</SectionLabel>
        <p style={{ margin: '-4px 0 8px', fontSize: 11, color: textSecondary, lineHeight: 1.45 }}>
          Country-specific financial rules, interest caps, and compliance parameters.
        </p>
        <div style={{
          padding: 16, borderRadius: 12, border: `1px dashed ${borderCol}`,
          background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.05)', textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: `${palette.accent}80`, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
            Available in Phase 8 – Work in Progress
          </p>
        </div>

        <Divider color={borderCol} />

        {/* ───── Framework ───── */}
        <FrameworkSection
          locale={selectedLocale}
          onPreview={handleTemplatePreview}
          palette={palette}
          isLight={isLight}
        />

      </div>

      {/* ───── Footer with animated button ───── */}
      <div style={{ padding: '16px 28px', borderTop: `1px solid ${borderCol}`, flexShrink: 0 }}>
        <FlowButton
          flowState={flowState}
          disabled={enabledStepsCount === 0 && flowState === 'idle'}
          onStart={handleStartFlow}
          onStop={handleStopFlow}
          palette={palette}
        />
      </div>

      {/* ───── Running overlay (covers content, not footer) ───── */}
      <AnimatePresence>
        {isRunning && (
          <RunningOverlay
            flowState={flowState}
            onStop={handleStopFlow}
            palette={palette}
            isLight={isLight}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Running overlay                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RunningOverlay({
  flowState,
  onStop,
  palette,
  isLight,
}: { flowState: FlowState; onStop: () => void; palette: ReturnType<typeof useTheme>['palette']; isLight: boolean }) {
  const isDone = flowState === 'done';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        inset: 0,
        bottom: 72,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: isLight ? 'rgba(248,247,249,0.88)' : 'rgba(18,12,24,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Animated icon ring */}
      <motion.div
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDone
            ? (isLight ? 'rgba(12,122,58,0.1)' : 'rgba(12,122,58,0.2)')
            : (isLight ? `${palette.accent}12` : `${palette.accent}20`),
        }}
        animate={{
          scale: isDone ? [1, 1.1, 1] : 1,
          background: isDone
            ? (isLight ? 'rgba(12,122,58,0.1)' : 'rgba(12,122,58,0.2)')
            : (isLight ? `${palette.accent}12` : `${palette.accent}20`),
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done-icon"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <CheckCircle2 style={{ width: 36, height: 36, color: '#0c7a3a', strokeWidth: 1.5 }} />
            </motion.div>
          ) : (
            <motion.div
              key="running-icon"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: { duration: 0.3 },
                opacity: { duration: 0.3 },
                rotate: { duration: 1.2, repeat: Infinity, ease: 'linear' },
              }}
            >
              <Loader2 style={{ width: 36, height: 36, color: palette.accent, strokeWidth: 1.5 }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isDone ? 'done-text' : 'running-text'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: isDone ? '#0c7a3a' : palette.textPrimary,
            letterSpacing: '-0.2px',
          }}>
            {isDone ? 'Done!' : 'Running use case...'}
          </p>
          <p style={{
            margin: '6px 0 0',
            fontSize: 12,
            color: palette.textSecondary,
          }}>
            {isDone ? 'Flow completed successfully' : 'Configuration is locked while running'}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Stop button (only during running) */}
      <AnimatePresence>
        {!isDone && (
          <motion.button
            type="button"
            onClick={onStop}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.15 } }}
            transition={{ delay: 0.15, duration: 0.25 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 9999,
              border: `1.5px solid ${isLight ? 'rgba(200,40,40,0.25)' : 'rgba(255,100,100,0.3)'}`,
              background: isLight ? 'rgba(200,40,40,0.06)' : 'rgba(255,100,100,0.1)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: isLight ? '#c82828' : '#ff6464',
            }}
          >
            <Square style={{ width: 12, height: 12, fill: 'currentColor' }} />
            Stop
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Flow button (footer) — animated state machine                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FlowButton({
  flowState,
  disabled,
  onStart,
  onStop,
  palette,
}: {
  flowState: FlowState;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const isRunning = flowState === 'running';
  const isDone = flowState === 'done';
  const isIdle = flowState === 'idle';

  const bg = isDone ? '#0c7a3a' : isRunning ? palette.accent : (disabled ? `${palette.accent}55` : palette.accent);
  const shadow = isDone
    ? '0 2px 12px rgba(12,122,58,0.4)'
    : isIdle && !disabled ? `0 2px 12px ${palette.accent}40` : 'none';

  return (
    <motion.button
      type="button"
      disabled={disabled && isIdle}
      onClick={isIdle ? onStart : isRunning ? onStop : undefined}
      animate={{ background: bg, boxShadow: shadow }}
      transition={{ duration: 0.35 }}
      whileHover={isIdle && !disabled ? { scale: 1.02 } : undefined}
      whileTap={isIdle && !disabled ? { scale: 0.98 } : undefined}
      style={{
        width: '100%',
        padding: '13px 0',
        borderRadius: 9999,
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
        background: bg,
        border: 'none',
        cursor: disabled && isIdle ? 'not-allowed' : 'pointer',
        boxShadow: shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <AnimatePresence mode="wait">
        {isIdle && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Play style={{ width: 14, height: 14, fill: '#fff' }} />
            Start Flow
          </motion.span>
        )}
        {isRunning && (
          <motion.span
            key="running"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Loader2 style={{ width: 14, height: 14 }} />
            </motion.span>
            Running...
          </motion.span>
        )}
        {isDone && (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Done
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Screen Templates section                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FrameworkSection({
  locale,
  onPreview,
  palette,
  isLight,
}: {
  locale: Locale;
  onPreview: (screenPath: string) => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  const readyCount = SCREEN_BLOCK_ORDER.filter((k) => READY_SCREENS.has(k)).length;

  return (
    <CollapsibleSection
      title="Framework"
      summary={`${readyCount} of ${SCREEN_BLOCK_ORDER.length} screens`}
      description="Test individual screens with mock data — layout, motion, micro-interactions and translations."
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      palette={palette}
      isLight={isLight}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {SCREEN_BLOCK_ORDER.map((screenKey) => {
          const meta = SCREEN_BLOCK_META[screenKey];
          const ready = READY_SCREENS.has(screenKey);
          return (
            <TemplateCard
              key={screenKey}
              title={meta.title}
              description={meta.description}
              screenPath={meta.path}
              onPreview={onPreview}
              palette={palette}
              isLight={isLight}
              cardBg={cardBg}
              ready={ready}
            />
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

function TemplateCard({
  title,
  description,
  screenPath,
  onPreview,
  palette,
  isLight,
  cardBg,
  ready,
}: {
  title: string;
  description: string;
  screenPath: string;
  onPreview: (path: string) => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
  cardBg: string;
  ready: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const canHover = ready && hovered;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        borderColor: canHover ? palette.accent : palette.border,
        boxShadow: canHover
          ? (isLight ? `0 4px 16px ${palette.accent}18` : `0 4px 16px ${palette.accent}25`)
          : '0 0 0 transparent',
      }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderRadius: 12,
        border: `1px solid ${palette.border}`,
        background: cardBg,
        cursor: 'default',
        transition: 'background 0.3s',
        opacity: ready ? 1 : 0.45,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.textPrimary }}>{title}</p>
          {!ready && (
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
              padding: '2px 6px', borderRadius: 4,
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              color: palette.textSecondary,
            }}>
              Soon
            </span>
          )}
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: palette.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {description}
        </p>
      </div>
      <motion.button
        type="button"
        onClick={ready ? () => onPreview(screenPath) : undefined}
        whileHover={ready ? { scale: 1.08 } : undefined}
        whileTap={ready ? { scale: 0.94 } : undefined}
        disabled={!ready}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 12px',
          borderRadius: 8,
          border: `1px solid ${palette.border}`,
          background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.06)',
          cursor: ready ? 'pointer' : 'not-allowed',
          fontSize: 11,
          fontWeight: 600,
          color: ready ? palette.accent : palette.textSecondary,
          flexShrink: 0,
          marginLeft: 12,
          opacity: ready ? 1 : 0.5,
        }}
      >
        <Eye style={{ width: 12, height: 12 }} />
        Preview
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components (unchanged from before)                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface PaletteProps {
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px', color, transition: 'color 0.3s' }}>
      {children}
    </p>
  );
}

function ProductLineSelector({ value, options, onChange, palette, isLight }: { value: string; options: ProductLine[]; onChange: (id: string) => void } & PaletteProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.id === value) ?? options[0];
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${palette.border}`, background: cardBg, cursor: 'pointer', transition: 'all 0.3s' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: palette.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>{selected?.name ?? '—'}</span>
        <ChevronDown style={{ width: 14, height: 14, color: palette.accent, flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: cardBg, borderRadius: 12, border: `1px solid ${palette.border}`, boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.4)', padding: 4, zIndex: 50 }}>
            {options.map((option) => {
              const active = option.id === selected?.id;
              return (
                <button key={option.id} type="button" onClick={() => { onChange(option.id); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: active ? palette.accentSubtle : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? palette.accent : palette.textPrimary }}>{option.name}</span>
                  <span style={{ display: 'block', fontSize: 10, color: palette.textSecondary, marginTop: 2 }}>{option.description}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function UseCaseSelector({ value, options, onChange, palette, isLight }: { value: string; options: UseCaseDefinition[]; onChange: (id: string) => void } & PaletteProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.id === value) ?? options[0];
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${palette.border}`, background: cardBg, cursor: 'pointer', transition: 'all 0.3s' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: palette.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>{selected?.name ?? 'Select'}</span>
        <ChevronDown style={{ width: 14, height: 14, color: palette.accent, flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: cardBg, borderRadius: 12, border: `1px solid ${palette.border}`, boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.4)', padding: 4, zIndex: 50 }}>
            {options.map((option) => {
              const active = option.id === selected?.id;
              return (
                <button key={option.id} type="button" onClick={() => { onChange(option.id); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: active ? palette.accentSubtle : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? palette.accent : palette.textPrimary }}>{option.name}</span>
                  <span style={{ display: 'block', fontSize: 10, color: palette.textSecondary, marginTop: 2 }}>{option.description}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function LocaleSelector({ value, options, onChange, palette, isLight }: { value: Locale; options: Locale[]; onChange: (locale: Locale) => void } & PaletteProps) {
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((locale) => {
        const active = locale === value;
        return (
          <button key={locale} onClick={() => onChange(locale)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 10px',
            borderRadius: 10, border: active ? `2px solid ${palette.accent}` : `1px solid ${palette.border}`,
            background: active ? palette.accentSubtle : cardBg, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 18 }}>{LOCALE_FLAGS[locale]}</span>
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, color: active ? palette.accent : palette.textPrimary, transition: 'color 0.2s', textAlign: 'center', lineHeight: 1.2 }}>
              {LOCALE_SHORT_NAMES[locale]}
              <span style={{ display: 'block', fontSize: 9, fontWeight: 500, opacity: 0.85 }}>({LOCALE_REGION_EN[locale]})</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CollapsibleSection({ title, summary, description, expanded, onToggle, children, palette, isLight }: { title: string; summary: string; description?: string; expanded: boolean; onToggle: () => void; children: React.ReactNode } & PaletteProps) {
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  return (
    <div>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', padding: '14px 16px',
        borderRadius: 12, border: `1px solid ${palette.border}`, background: cardBg, cursor: 'pointer',
        boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.2)', transition: 'all 0.3s',
        textAlign: 'left',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary, transition: 'color 0.3s' }}>{title}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: palette.accent, background: palette.accentSubtle, padding: '3px 8px', borderRadius: 6 }}>{summary}</span>
          </div>
          {description && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: palette.textSecondary, lineHeight: 1.4 }}>{description}</p>
          )}
        </div>
        <ChevronDown style={{ width: 16, height: 16, color: palette.accent, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0, marginTop: 2 }} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: cardBg, border: `1px solid ${palette.border}`, transition: 'all 0.3s' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScreenRow({ title, description, enabled, variant, variants, path, versionTag, onToggle, onVariantChange, palette, isLight }: {
  title: string; description: string; enabled: boolean; variant: string; variants: VariantOption[]; path: string;
  versionTag?: 'magic' | 'legacy';
  onToggle: () => void; onVariantChange: (variant: string) => void;
} & PaletteProps) {
  const [expanded, setExpanded] = useState(false);
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  const disabledBg = isLight ? '#fafafa' : palette.background;
  const isLegacy = versionTag === 'legacy';
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${palette.border}`, background: enabled ? cardBg : disabledBg, overflow: 'hidden', transition: 'all 0.2s', opacity: enabled ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
        <CheckCircleBtn checked={enabled} onClick={onToggle} accent={palette.accent} isLight={isLight} border={palette.border} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: enabled ? palette.textPrimary : palette.textSecondary, transition: 'color 0.2s' }}>{title}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: palette.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{description}</p>
        </div>
        {versionTag && (
          <span style={{
            fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
            padding: '3px 7px', borderRadius: 4, flexShrink: 0, whiteSpace: 'nowrap',
            background: isLegacy
              ? (isLight ? 'rgba(200,120,40,0.1)' : 'rgba(200,150,60,0.15)')
              : (isLight ? palette.accentSubtle : `${palette.accent}18`),
            color: isLegacy
              ? (isLight ? '#9A6C2E' : '#D4A054')
              : palette.accent,
          }}>
            {isLegacy ? 'Legacy' : 'Magic Version'}
          </span>
        )}
        <button onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: isLight ? 'rgba(31,2,48,0.04)' : 'rgba(255,255,255,0.08)', cursor: 'pointer', flexShrink: 0 }}>
          <ChevronDown style={{ width: 14, height: 14, color: palette.accent, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '10px 12px 12px', borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {variants.map((opt) => {
                  const isSelected = opt.id === variant;
                  return (
                    <button key={opt.id} onClick={() => onVariantChange(opt.id)} style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8,
                      border: isSelected ? `2px solid ${palette.accent}` : `1px solid ${palette.border}`,
                      background: isSelected ? palette.accentSubtle : 'transparent', cursor: 'pointer',
                      fontSize: 11, fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? palette.accent : palette.textSecondary, transition: 'all 0.15s', textAlign: 'center',
                    }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <a href={path} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: palette.accent, textDecoration: 'none' }}>
                View isolated <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlowOptionRow({ title, enabled, onToggle, palette, isLight }: { title: string; enabled: boolean; onToggle: () => void } & PaletteProps) {
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  const disabledBg = isLight ? '#fafafa' : palette.background;
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 10, border: `1px solid ${palette.border}`, background: enabled ? cardBg : disabledBg, gap: 10, transition: 'all 0.2s', opacity: enabled ? 1 : 0.6 }}>
      <CheckCircleBtn checked={enabled} onClick={onToggle} accent={palette.accent} isLight={isLight} border={palette.border} />
      <span style={{ fontSize: 13, fontWeight: 500, color: enabled ? palette.textPrimary : palette.textSecondary, transition: 'color 0.2s' }}>{title}</span>
    </div>
  );
}

function CheckCircleBtn({ checked, onClick, accent, isLight, border }: { checked: boolean; onClick: () => void; accent: string; isLight: boolean; border: string }) {
  return (
    <button onClick={onClick} type="button" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 11,
      border: checked ? 'none' : `2px solid ${border}`, background: checked ? accent : 'transparent',
      cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
    }}>
      {checked && <Check style={{ width: 12, height: 12, color: '#fff', strokeWidth: 3 }} />}
    </button>
  );
}

function Divider({ color }: { color: string }) {
  return <div style={{ height: 1, background: `${color}60`, margin: '20px 0', transition: 'background 0.3s' }} />;
}

function SegmentSelector({ value, mode, onChange, palette, isLight }: { value: NuDSSegment; mode: ThemeMode; onChange: (s: NuDSSegment) => void } & PaletteProps) {
  const [open, setOpen] = useState(false);
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${palette.border}`, background: cardBg, cursor: 'pointer', transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: getSegmentSwatchColor(value, mode) }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: palette.textPrimary, transition: 'color 0.3s' }}>{SEGMENTS.find(s => s.id === value)?.label}</span>
        </div>
        <ChevronDown style={{ width: 14, height: 14, color: palette.accent }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: cardBg, borderRadius: 12, border: `1px solid ${palette.border}`, boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.4)', padding: 4, zIndex: 50 }}>
            {SEGMENTS.map((seg) => {
              const active = seg.id === value;
              return (
                <button key={seg.id} onClick={() => { onChange(seg.id); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: active ? palette.accentSubtle : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: getSegmentSwatchColor(seg.id, mode), flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? palette.accent : palette.textPrimary }}>{seg.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DarkLightToggle({ mode, onToggle, palette, isLight }: { mode: ThemeMode; onToggle: () => void } & PaletteProps) {
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  return (
    <div style={{ display: 'flex', background: cardBg, borderRadius: 10, border: `1px solid ${palette.border}`, overflow: 'hidden', transition: 'all 0.3s' }}>
      <ModeButton icon={<Sun style={{ width: 12, height: 12 }} />} label="Light" active={mode === 'light'} onClick={() => { if (mode !== 'light') onToggle(); }} position="left" palette={palette} />
      <ModeButton icon={<Moon style={{ width: 12, height: 12 }} />} label="Dark" active={mode === 'dark'} onClick={() => { if (mode !== 'dark') onToggle(); }} position="right" palette={palette} />
    </div>
  );
}

function ModeButton({ icon, label, active, onClick, position, palette }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; position: 'left' | 'right'; palette: ReturnType<typeof useTheme>['palette'] }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '11px 0',
      border: 'none', borderRight: position === 'left' ? `1px solid ${palette.border}` : 'none',
      background: active ? palette.accentSubtle : 'transparent', cursor: 'pointer',
      color: active ? palette.accent : palette.textSecondary, fontWeight: active ? 600 : 400, fontSize: 12, transition: 'all 0.2s',
    }}>
      {icon}
      {label}
    </button>
  );
}
