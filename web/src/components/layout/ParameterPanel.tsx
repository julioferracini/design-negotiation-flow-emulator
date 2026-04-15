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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getProductLinesForLocale,
  getUseCasesForProductLineAndLocale,
  PRODUCT_LINES,
} from '@shared/config';
import {
  LOCALE_FLAGS,
  LOCALE_SHORT_NAMES,
  LOCALE_REGION_EN,
  SUPPORTED_LOCALES,
  type Locale,
  type ProductLine,
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
import { usePrototypeLocation } from '../../hooks/usePrototypeLocation';
import { useEmulatorConfig, DEFAULT_SIMULATED_LATENCY_MS, DEFAULT_DEBT_BY_LOCALE, type ScreenKey, type FlowState, type ScreenSettings, type FlowOptionKey, type FlowOptionState, type RuleOverrides } from '../../context/EmulatorConfigContext';
import { Sun, Moon, ExternalLink, ChevronDown, ChevronRight, Check, Square, Play, Loader2, CheckCircle2, Eye, X, Layers, RotateCcw, Save, CreditCard, Landmark, Settings2 } from 'lucide-react';
import { getUseCaseForLocale } from '../../../../config/useCases';
import { formatCurrency } from '../../../../config/formatters';
import { getRules } from '../../../../config/financialCalculator';

type VariantOption = { id: string; label: string };
type BlockMeta = { key: ScreenKey; title: string; description: string; path: string };

const SCREEN_BLOCK_ORDER: ScreenKey[] = [
  'offerHub', 'inputValue', 'simulation', 'suggested',
  'dueDate', 'summary',
  'terms', 'pin', 'loading', 'feedback',
];

const READY_SCREENS: Set<ScreenKey> = new Set(['offerHub', 'suggested', 'simulation', 'summary', 'inputValue', 'dueDate']);

const LEGACY_SCREENS: Set<ScreenKey> = new Set(['terms', 'pin']);

export const SCREEN_BLOCK_META: Record<ScreenKey, BlockMeta> = {
  offerHub: { key: 'offerHub', title: 'Offer Hub', description: 'Three renegotiation offers', path: 'offer-hub' },
  inputValue: { key: 'inputValue', title: 'Input Value', description: 'ATM-style numeric keypad', path: 'input-value' },
  simulation: { key: 'simulation', title: 'Simulation', description: 'Flow A slider with animations', path: 'simulation' },
  suggested: { key: 'suggested', title: 'Suggested Conditions', description: 'Flow B best-match card', path: 'suggested-conditions' },
  dueDate: { key: 'dueDate', title: 'Due Date', description: 'Calendar for payment date', path: 'due-date' },
  summary: { key: 'summary', title: 'Summary', description: 'Review with edit capability', path: 'summary' },
  terms: { key: 'terms', title: 'Terms & Conditions', description: 'Scrollable legal copy', path: 'terms-and-conditions' },
  pin: { key: 'pin', title: 'PIN', description: '4-digit confirmation', path: 'pin' },
  loading: { key: 'loading', title: 'Loading', description: 'Progress animation', path: 'loading' },
  feedback: { key: 'feedback', title: 'Feedback', description: 'Success screen with CTA', path: 'feedback' },
};

const SCREEN_VARIANTS: Record<ScreenKey, VariantOption[]> = {
  offerHub: [{ id: 'default', label: 'Default' }, { id: 'cards-v2', label: 'Cards V2' }],
  inputValue: [
    { id: 'installment-value', label: 'Installment Value' },
    { id: 'downpayment-value', label: 'Downpayment Value' },
  ],
  simulation: [{ id: 'default', label: 'Default' }, { id: 'roulette-v2', label: 'Roulette V2' }],
  suggested: [{ id: 'default', label: 'Default' }, { id: 'cards-emphasis', label: 'Cards Emphasis' }],
  dueDate: [
    { id: 'first-installment-date', label: 'First Installment Date' },
    { id: 'downpayment-date', label: 'Downpayment Date' },
    { id: 'single-payment-date', label: 'Single Payment Date' },
  ],
  summary: [{ id: 'default', label: 'Default' }, { id: 'grouped-cards', label: 'Grouped Cards' }],
  terms: [{ id: 'default', label: 'Default' }, { id: 'short-consent', label: 'Short Consent' }],
  pin: [{ id: 'default', label: 'Default' }, { id: 'inline', label: 'Inline' }],
  loading: [{ id: 'default', label: 'Default' }, { id: 'progress-steps', label: 'Progress Steps' }],
  feedback: [{ id: 'default', label: 'Default' }, { id: 'cta-prominent', label: 'CTA Prominent' }],
};

/* ── Content Variants (different states/configurations the same screen can take) ── */

export type ScreenContentVariant = {
  id: string;
  label: string;
  description: string;
  version: string;
  status: 'ready' | 'soon';
  isDefault?: boolean;
  screenPath: string;
};

export const SCREEN_CONTENT_VARIANTS: Partial<Record<ScreenKey, ScreenContentVariant[]>> = {
  offerHub: [
    {
      id: 'default',
      label: 'Default',
      description: 'All debt types with segment control tabs (All, Credit Card, Loans). Multi-product renegotiation.',
      version: 'v1.2',
      status: 'ready',
      isDefault: true,
      screenPath: 'offer-hub',
    },
    {
      id: 'lending-only',
      label: 'Lending',
      description: 'Loan offers only. Segment control is hidden since there is a single product category.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'offer-hub?variant=lending-only',
    },
    {
      id: 'credit-card-only',
      label: 'Credit Card',
      description: 'Credit card offers only. Segment control is hidden since there is a single product category.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'offer-hub?variant=credit-card-only',
    },
    {
      id: 'stress-test',
      label: 'Stress Test (8)',
      description: '8 offer cards in a single view. No segments. Tests scroll, layout density, and card stagger.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'offer-hub?variant=stress-test',
    },
  ],
  simulation: [
    {
      id: 'default',
      label: 'Default',
      description: 'Standard simulation with downpayment always active. If debt exceeds the locale threshold, 5% minimum is pre-filled; otherwise starts at zero.',
      version: 'v2.0',
      status: 'ready',
      isDefault: true,
      screenPath: 'simulation',
    },
    {
      id: 'entry-from-21',
      label: 'Entry from Installment 21',
      description: 'Downpayment kicks in starting at installment 21. Common for long-term debt restructuring.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'simulation?variant=entry-from-21',
    },
  ],
  inputValue: [
    {
      id: 'installment-value',
      label: 'Installment Value',
      description: 'Clean numeric keypad input without suggestion shortcuts. User types the full amount manually.',
      version: 'v1.0',
      status: 'ready',
      isDefault: true,
      screenPath: 'input-value?variant=installment-value',
    },
    {
      id: 'installment-value-chips',
      label: 'Installment w/ Chips',
      description: 'Numeric keypad with suggestion chips for quick amount selection. Speeds up input for common values.',
      version: 'v1.1',
      status: 'ready',
      screenPath: 'input-value?variant=installment-value-chips',
    },
    {
      id: 'downpayment-value',
      label: 'Downpayment Value',
      description: 'Numeric keypad to define the down payment amount. Used when entry payment is required.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'input-value?variant=downpayment-value',
    },
    {
      id: 'downpayment-value-chips',
      label: 'Downpayment w/ Chips',
      description: 'Numeric keypad with suggestion chips for downpayment. Quick selection for common entry values.',
      version: 'v1.1',
      status: 'ready',
      screenPath: 'input-value?variant=downpayment-value-chips',
    },
  ],
  dueDate: [
    {
      id: 'first-installment-date',
      label: 'First Installment Date',
      description: 'Calendar to select the first installment payment date. Subsequent payments follow monthly.',
      version: 'v1.0',
      status: 'ready',
      isDefault: true,
      screenPath: 'due-date?variant=first-installment-date',
    },
    {
      id: 'downpayment-date',
      label: 'Downpayment Date',
      description: 'Calendar to select when the downpayment (entry) will be paid. Used for scheduling the initial payment.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'due-date?variant=downpayment-date',
    },
    {
      id: 'single-payment-date',
      label: 'Single Payment Date',
      description: 'Calendar to select the payment date. Simple date picker for one-time payments.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'due-date?variant=single-payment-date',
    },
  ],
};

function countUseCasesForScreen(screenKey: ScreenKey): number {
  return PRODUCT_LINES.flatMap((pl) => pl.useCases)
    .filter((uc) => uc.enabled && uc.screens[screenKey as keyof typeof uc.screens])
    .length;
}

function buildStepPath(productLine: string, useCaseId: string, screenPath: string, locale: Locale): string {
  const sep = screenPath.includes('?') ? '&' : '?';
  return `/emulator/${productLine}/${useCaseId}/${screenPath}${sep}lang=${locale}`;
}

/* ─────────────────────────────────── Main ─────────────────────────────────── */

export default function ParameterPanel() {
  const { segment, setSegment, mode, toggleMode, palette } = useTheme();
  const navigate = usePrototypeNavigate();
  const { pathname: currentPathname, search: currentSearch } = usePrototypeLocation();
  const config = useEmulatorConfig();

  const selectedLocale = config.locale;
  const selectedProductLineId = config.productLineId;
  const selectedUseCaseId = config.useCaseId;
  const selectedUseCase = config.selectedUseCase;
  const flowState = config.flowState;
  const screenSettings = config.screenSettings;
  const flowOptions = config.flowOptions;

  const productLinesForLocale = useMemo(() => getProductLinesForLocale(selectedLocale), [selectedLocale]);
  const useCasesForSelection = useMemo(() => getUseCasesForProductLineAndLocale(selectedProductLineId, selectedLocale), [selectedProductLineId, selectedLocale]);

  const [buildingBlocksExpanded, setBuildingBlocksExpanded] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    config.setLocale(locale);
    if (currentPathname !== '/' && currentPathname !== '/emulator') {
      const params = new URLSearchParams(currentSearch);
      params.set('lang', locale);
      navigate(`${currentPathname}?${params.toString()}`);
    }
  };

  const handleProductLineChange = (productLineId: string) => {
    config.setProductLine(productLineId);
  };

  const enabledStepsCount = useMemo(() => SCREEN_BLOCK_ORDER.filter((key) => screenSettings[key].enabled).length, [screenSettings]);

  const handleStartFlow = useCallback(() => {
    config.startFlow(navigate);
  }, [config, navigate]);

  const handleStopFlow = useCallback(() => {
    config.stopFlow(navigate);
  }, [config, navigate]);

  const handleTemplatePreview = useCallback((screenPath: string) => {
    const path = buildStepPath('templates', 'preview', screenPath, selectedLocale);
    navigate(path);
  }, [selectedLocale, navigate]);

  const updateScreen = (screenKey: ScreenKey, patch: Partial<{ enabled: boolean; variant: string }>) => {
    config.updateScreen(screenKey, patch);
  };

  const updateFlowOption = (key: FlowOptionKey, value: boolean) => {
    config.updateFlowOption(key, value);
  };

  const setSelectedUseCaseId = config.setUseCase;

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
          padding: '1px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${palette.accent}40, ${palette.accent}14 40%, ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'} 100%)`,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            padding: '18px 18px 20px',
            borderRadius: 15,
            background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(18,18,20,0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: 3, background: palette.accent,
                boxShadow: `0 0 8px ${palette.accent}60`,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, color: palette.accent, letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}>
                Product Flow
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{
                fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px',
                padding: '2px 7px', borderRadius: 4,
                background: isLight ? '#FFF3E0' : 'rgba(255,152,0,0.15)',
                color: isLight ? '#E65100' : '#FFB74D',
              }}>
                WIP
              </span>
            </div>
          </div>
          <h3 style={{
            margin: '0 0 6px', fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px',
            color: palette.textPrimary, transition: 'color 0.3s',
          }}>
            Use Cases
          </h3>
          <p style={{
            margin: '0 0 14px', fontSize: 11.5, color: textSecondary, lineHeight: 1.5,
            letterSpacing: '0.05px',
          }}>
            Each use case maps to a product and regulatory context with its own financial rules.
          </p>
          {useCasesForSelection.length === 0 ? (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: textSecondary, lineHeight: 1.45 }}>
              No use cases for this product line in the selected country.
            </p>
          ) : (
            <UseCaseSelector value={selectedUseCaseId} options={useCasesForSelection} onChange={setSelectedUseCaseId} palette={palette} isLight={isLight} />
          )}

          {/* Flow Parameters — nested inside Product Flow */}
          <div style={{ marginTop: 16, opacity: selectedUseCaseId ? 1 : 0.5, pointerEvents: selectedUseCaseId ? 'auto' : 'none' }}>
            <CollapsibleSection
              title="Flow Parameters"
              summary={selectedUseCaseId ? `${enabledStepsCount} steps enabled` : 'Select a use case first'}
              badge="Work in Progress"
              description="Configure the screen sequence, variants, and flow options for this use case."
              expanded={selectedUseCaseId ? buildingBlocksExpanded : false}
              onToggle={() => selectedUseCaseId && setBuildingBlocksExpanded(!buildingBlocksExpanded)}
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
                      onNavigate={navigate}
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
              </div>
            </CollapsibleSection>
          </div>
        </div></div>

        <Divider color={borderCol} />

        {/* ───── UI Building Blocks ───── */}
        <UIBuildingBlocksSection
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
/*  Variant Picker Modal                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VariantPickerModal({
  screenKey,
  onClose,
  onSelect,
  palette,
  isLight,
}: {
  screenKey: ScreenKey;
  onClose: () => void;
  onSelect: (screenPath: string) => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}) {
  const meta = SCREEN_BLOCK_META[screenKey];
  const variants = SCREEN_CONTENT_VARIANTS[screenKey] ?? [];
  const flowCount = countUseCasesForScreen(screenKey);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680, maxWidth: '92vw', maxHeight: '80vh', overflow: 'auto',
          background: isLight ? '#FFF' : '#1A1A1A',
          borderRadius: 16, padding: '24px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: palette.textPrimary, margin: 0 }}>
                {meta.title}
              </h2>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                background: palette.accentSubtle, color: palette.accent,
              }}>
                {variants.length} variant{variants.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: isLight ? '#555' : '#aaa', lineHeight: 1.4 }}>
              {meta.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: isLight ? '#F0EEF1' : '#2A2A2A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: isLight ? '#666' : '#999', flexShrink: 0, marginLeft: 12,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: 12, color: isLight ? '#666' : '#999', lineHeight: 1.45 }}>
          Choose a variant to preview. Each variant represents a different configuration of this screen based on product rules.
        </p>

        {/* Variant cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}>
          {variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              flowCount={flowCount}
              onSelect={onSelect}
              palette={palette}
              isLight={isLight}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function VariantCard({
  variant,
  flowCount,
  onSelect,
  palette,
  isLight,
}: {
  variant: ScreenContentVariant;
  flowCount: number;
  onSelect: (screenPath: string) => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isReady = variant.status === 'ready';
  const canInteract = isReady && hovered;

  return (
    <motion.button
      type="button"
      onClick={isReady ? () => onSelect(variant.screenPath) : undefined}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        borderColor: canInteract ? palette.accent : (isLight ? '#E3E0E5' : '#333'),
        boxShadow: canInteract
          ? `0 4px 20px ${palette.accent}20`
          : '0 0 0 transparent',
      }}
      whileTap={isReady ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: 14, borderRadius: 12,
        border: `1.5px solid ${isLight ? '#D8D5DA' : '#3A3A3A'}`,
        background: isLight
          ? (variant.isDefault ? `${palette.accent}08` : '#F7F6F8')
          : (variant.isDefault ? `${palette.accent}0C` : '#252525'),
        cursor: isReady ? 'pointer' : 'default',
        opacity: isReady ? 1 : 0.5,
        textAlign: 'left',
        minHeight: 120,
        justifyContent: 'space-between',
      }}
    >
      {/* Top section */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isLight ? '#1A1A1A' : '#F0F0F0' }}>
            {variant.label}
          </span>
          {variant.isDefault && (
            <span style={{
              fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
              padding: '2px 6px', borderRadius: 4,
              background: palette.accentSubtle, color: palette.accent,
            }}>
              Default
            </span>
          )}
          {!isReady && (
            <span style={{
              fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
              padding: '2px 6px', borderRadius: 4,
              background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
              color: isLight ? '#777' : '#999',
            }}>
              Soon
            </span>
          )}
        </div>
        <p style={{
          margin: 0, fontSize: 11, color: isLight ? '#555' : '#aaa', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {variant.description}
        </p>
      </div>

      {/* Bottom badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, width: '100%' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
          padding: '2px 6px', borderRadius: 4,
          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
          color: isLight ? '#666' : '#bbb',
        }}>
          {variant.version}
        </span>
        {isReady && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: isLight ? '#555' : '#aaa',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Layers style={{ width: 10, height: 10 }} />
            {flowCount} flow{flowCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UI Building Blocks section                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function UIBuildingBlocksSection({
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
  const [variantModalScreen, setVariantModalScreen] = useState<ScreenKey | null>(null);
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  const readyCount = SCREEN_BLOCK_ORDER.filter((k) => READY_SCREENS.has(k)).length;

  const handlePreviewClick = useCallback((screenKey: ScreenKey, screenPath: string) => {
    const hasVariants = SCREEN_CONTENT_VARIANTS[screenKey];
    if (hasVariants && hasVariants.length > 1) {
      setVariantModalScreen(screenKey);
    } else {
      onPreview(screenPath);
    }
  }, [onPreview]);

  const handleVariantSelect = useCallback((screenPath: string) => {
    setVariantModalScreen(null);
    onPreview(screenPath);
  }, [onPreview]);

  return (
    <>
      <CollapsibleSection
        title="Chassis Design – UI Building Blocks"
        summary={`${readyCount} of ${SCREEN_BLOCK_ORDER.length} screens`}
        badge="Work in Progress"
        description="Reusable screens and visual components that work across any product and evolve independently from journey logic."
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        palette={palette}
        isLight={isLight}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {SCREEN_BLOCK_ORDER.map((screenKey) => {
            const meta = SCREEN_BLOCK_META[screenKey];
            const ready = READY_SCREENS.has(screenKey);
            const hasVariants = (SCREEN_CONTENT_VARIANTS[screenKey]?.length ?? 0) > 1;
            return (
              <TemplateCard
                key={screenKey}
                screenKey={screenKey}
                title={meta.title}
                description={meta.description}
                screenPath={meta.path}
                onPreview={handlePreviewClick}
                palette={palette}
                isLight={isLight}
                cardBg={cardBg}
                ready={ready}
                hasVariants={hasVariants}
              />
            );
          })}
        </div>
      </CollapsibleSection>

      <AnimatePresence>
        {variantModalScreen && (
          <VariantPickerModal
            screenKey={variantModalScreen}
            onClose={() => setVariantModalScreen(null)}
            onSelect={handleVariantSelect}
            palette={palette}
            isLight={isLight}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function TemplateCard({
  screenKey,
  title,
  description,
  screenPath,
  onPreview,
  palette,
  isLight,
  cardBg,
  ready,
  hasVariants,
}: {
  screenKey: ScreenKey;
  title: string;
  description: string;
  screenPath: string;
  onPreview: (screenKey: ScreenKey, path: string) => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
  cardBg: string;
  ready: boolean;
  hasVariants: boolean;
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
          {ready && hasVariants && (
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: 0.3,
              padding: '2px 6px', borderRadius: 4,
              background: palette.accentSubtle, color: palette.accent,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Layers style={{ width: 8, height: 8 }} />
              {SCREEN_CONTENT_VARIANTS[screenKey]?.length ?? 0}
            </span>
          )}
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: palette.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {description}
        </p>
      </div>
      <motion.button
        type="button"
        onClick={ready ? () => onPreview(screenKey, screenPath) : undefined}
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
  const selected = value ? options.find((opt) => opt.id === value) : undefined;
  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  const displayText = selected?.name ?? 'Select Use Case';
  const isPlaceholder = !selected;
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${palette.border}`, background: cardBg, cursor: 'pointer', transition: 'all 0.3s' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: isPlaceholder ? palette.textSecondary : palette.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.3s', fontStyle: isPlaceholder ? 'italic' : 'normal' }}>{displayText}</span>
        <ChevronDown style={{ width: 14, height: 14, color: palette.accent, flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: cardBg, borderRadius: 12, border: `1px solid ${palette.border}`, boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.4)', padding: 4, zIndex: 50, maxHeight: 280, overflowY: 'auto' }}>
            {/* Clear selection option */}
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: !value ? palette.accentSubtle : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              <X style={{ width: 12, height: 12, color: palette.textSecondary }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: !value ? 600 : 500, color: !value ? palette.accent : palette.textSecondary, fontStyle: 'italic' }}>None (Default Rules)</span>
                <span style={{ display: 'block', fontSize: 10, color: palette.textSecondary, marginTop: 2 }}>Use base financial rules without use case overrides</span>
              </div>
            </button>
            <div style={{ height: 1, background: palette.border, margin: '4px 0' }} />
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

function CollapsibleSection({ title, summary, badge, description, expanded, onToggle, children, palette, isLight }: { title: string; summary: string; badge?: string; description?: string; expanded: boolean; onToggle: () => void; children: React.ReactNode } & PaletteProps) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary, transition: 'color 0.3s' }}>{title}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: palette.accent, background: palette.accentSubtle, padding: '3px 8px', borderRadius: 6 }}>{summary}</span>
            {badge && (
              <span style={{
                fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                padding: '2px 7px', borderRadius: 4,
                background: isLight ? '#FFF3E0' : 'rgba(255,152,0,0.15)',
                color: isLight ? '#E65100' : '#FFB74D',
              }}>
                {badge}
              </span>
            )}
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

function ScreenRow({ title, description, enabled, variant, variants, path, versionTag, onToggle, onVariantChange, onNavigate, palette, isLight }: {
  title: string; description: string; enabled: boolean; variant: string; variants: VariantOption[]; path: string;
  versionTag?: 'magic' | 'legacy';
  onToggle: () => void; onVariantChange: (variant: string) => void; onNavigate?: (path: string) => void;
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
              <button type="button" onClick={() => onNavigate?.(path)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: palette.accent, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                View isolated <ExternalLink style={{ width: 11, height: 11 }} />
              </button>
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

function NegotiationValuesBlock({ locale, palette, isLight }: { locale: Locale } & PaletteProps) {
  const config = useEmulatorConfig();
  const useCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = useCase.currency;
  const defaults = DEFAULT_DEBT_BY_LOCALE[locale];

  const dSep = curr.decimalSeparator;
  const tSep = curr.thousandSeparator;
  const dp = curr.decimalPlaces ?? 2;

  const fmtField = (v: number) => {
    const abs = Math.abs(v);
    const fixed = dp === 0 ? String(Math.round(abs)) : abs.toFixed(dp);
    const [intPart, decPart] = fixed.split('.');
    const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, tSep);
    return decPart ? `${withThousands}${dSep}${decPart}` : withThousands;
  };

  const parseField = (s: string) => {
    const stripped = s.replace(new RegExp(`\\${tSep}`, 'g'), '').replace(dSep, '.');
    return Number(stripped) || 0;
  };

  const [draftCard, setDraftCard] = useState(fmtField(config.debtOverrides.cardBalance));
  const [draftLoan, setDraftLoan] = useState(fmtField(config.debtOverrides.loanBalance));

  useEffect(() => {
    setDraftCard(fmtField(config.debtOverrides.cardBalance));
    setDraftLoan(fmtField(config.debtOverrides.loanBalance));
  }, [config.debtOverrides.cardBalance, config.debtOverrides.loanBalance, dSep, tSep, dp]);

  const cardDirty = parseField(draftCard) !== config.debtOverrides.cardBalance;
  const loanDirty = parseField(draftLoan) !== config.debtOverrides.loanBalance;
  const isDirty = cardDirty || loanDirty;
  const isDefault = config.debtOverrides.cardBalance === defaults.cardBalance && config.debtOverrides.loanBalance === defaults.loanBalance;

  const handleSave = () => {
    const card = Math.max(0, parseField(draftCard));
    const loan = Math.max(0, parseField(draftLoan));
    setDraftCard(fmtField(card));
    setDraftLoan(fmtField(loan));
    config.setDebtOverrides({ cardBalance: card, loanBalance: loan });
  };

  const handleReset = () => {
    config.resetDebtOverrides();
  };

  const total = parseField(draftCard) + parseField(draftLoan);
  const fmtTotal = formatCurrency(total, curr);

  const inputStyle = (dirty: boolean): React.CSSProperties => ({
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    padding: '8px 0 8px 10px', fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
    color: dirty ? palette.accent : palette.textPrimary, width: 0, minWidth: 0,
  });

  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px', color: palette.textSecondary }}>
        Negotiation Values
      </p>
      <p style={{ fontSize: 11, color: palette.textSecondary, margin: '0 0 12px', lineHeight: 1.4 }}>
        Total values per segment for the selected country ({curr.code}).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Credit Card */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <CreditCard style={{ width: 11, height: 11, color: palette.textSecondary }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: palette.textSecondary }}>Card</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            borderRadius: 8, border: `1px solid ${palette.border}`,
            background: isLight ? '#fff' : palette.surfaceSecondary,
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, padding: '0 0 0 8px', flexShrink: 0 }}>
              {curr.symbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={draftCard}
              onChange={(e) => setDraftCard(e.target.value)}
              onBlur={() => setDraftCard(fmtField(Math.max(0, parseField(draftCard))))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              style={inputStyle(cardDirty)}
            />
          </div>
        </div>

        {/* Loans */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Landmark style={{ width: 11, height: 11, color: palette.textSecondary }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: palette.textSecondary }}>Loans</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            borderRadius: 8, border: `1px solid ${palette.border}`,
            background: isLight ? '#fff' : palette.surfaceSecondary,
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, padding: '0 0 0 8px', flexShrink: 0 }}>
              {curr.symbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={draftLoan}
              onChange={(e) => setDraftLoan(e.target.value)}
              onBlur={() => setDraftLoan(fmtField(Math.max(0, parseField(draftLoan))))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              style={inputStyle(loanDirty)}
            />
          </div>
        </div>
      </div>

      {/* Total + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
          Total: {fmtTotal}
        </span>
        <SaveResetButtons isDirty={isDirty} isDefault={isDefault} onSave={handleSave} onReset={handleReset} palette={palette} isLight={isLight} />
      </div>
    </div>
  );
}

function LatencySimulationBlock({ palette, isLight }: PaletteProps) {
  const config = useEmulatorConfig();
  const [draft, setDraft] = useState(String(config.simulatedLatencyMs));
  const isDirty = draft !== String(config.simulatedLatencyMs);
  const isDefault = config.simulatedLatencyMs === DEFAULT_SIMULATED_LATENCY_MS;

  const MAX_LATENCY_MS = 6000;
  const handleSave = () => {
    const parsed = Math.min(MAX_LATENCY_MS, Math.max(0, Math.round(Number(draft) || 0)));
    setDraft(String(parsed));
    config.setSimulatedLatencyMs(parsed);
  };

  const handleReset = () => {
    setDraft(String(DEFAULT_SIMULATED_LATENCY_MS));
    config.setSimulatedLatencyMs(DEFAULT_SIMULATED_LATENCY_MS);
  };

  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px', color: palette.textSecondary }}>
        Latency Simulation
      </p>
      <p style={{ fontSize: 11, color: palette.textSecondary, margin: '0 0 10px', lineHeight: 1.4 }}>
        This is a screen library with mock data — navigation is instant by default.
        In production, values come from a server request. Use this control to simulate
        network latency and approximate the real experience.
      </p>
      <div style={{
        display: 'flex', alignItems: 'center',
        borderRadius: 8, border: `1px solid ${palette.border}`,
        background: isLight ? '#fff' : palette.surfaceSecondary,
        overflow: 'hidden',
      }}>
        <input
          type="number"
          min={0}
          max={MAX_LATENCY_MS}
          step={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: '8px 10px', fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
            color: palette.textPrimary, width: 0, minWidth: 0,
          }}
        />
        <span style={{
          fontSize: 11, fontWeight: 500, color: palette.textSecondary,
          padding: '0 10px 0 0', flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          ms
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: 11, color: palette.textSecondary, fontStyle: 'normal' }}>
          {`Default: ${DEFAULT_SIMULATED_LATENCY_MS} ms · Max: ${MAX_LATENCY_MS} ms`}
        </span>
        <SaveResetButtons isDirty={isDirty} isDefault={isDefault} onSave={handleSave} onReset={handleReset} palette={palette} isLight={isLight} />
      </div>
    </div>
  );
}

function FinancialRulesBlock({ locale, palette, isLight }: { locale: Locale } & PaletteProps) {
  const config = useEmulatorConfig();
  const defaults = getRules(locale);
  const curr = getUseCaseForLocale(locale).currency;

  const [expanded, setExpanded] = useState(false);
  const showDpFields = config.screenSettings.simulation?.enabled || config.screenSettings.inputValue?.enabled;
  const showOfferFields = config.screenSettings.offerHub?.enabled;

  const r = config.effectiveRules;
  const [draftMin, setDraftMin] = useState(String(r.minInstallments));
  const [draftMax, setDraftMax] = useState(String(r.maxInstallments));
  const [draftThreshold, setDraftThreshold] = useState(String(r.downPaymentDebtThreshold));
  const [draftMinPct, setDraftMinPct] = useState(String(Math.round(r.downPaymentMinPercent * 100)));
  const [draftRate, setDraftRate] = useState((r.monthlyInterestRate * 100).toFixed(4));
  const [draftOffer1, setDraftOffer1] = useState(String(Math.round(r.offer1DiscountPercent * 100)));
  const [draftOffer2, setDraftOffer2] = useState(String(Math.round(r.offer2DiscountPercent * 100)));
  const [draftOffer2Inst, setDraftOffer2Inst] = useState(String(r.offer2Installments));
  const [draftOffer3, setDraftOffer3] = useState(String(Math.round(r.offer3DiscountPercent * 100)));
  const [draftOffer3Inst, setDraftOffer3Inst] = useState(String(r.offer3Installments));
  const [draftDpThresh, setDraftDpThresh] = useState(String(r.downPaymentThreshold));

  useEffect(() => {
    setDraftMin(String(r.minInstallments));
    setDraftMax(String(r.maxInstallments));
    setDraftThreshold(String(r.downPaymentDebtThreshold));
    setDraftMinPct(String(Math.round(r.downPaymentMinPercent * 100)));
    setDraftRate((r.monthlyInterestRate * 100).toFixed(4));
    setDraftOffer1(String(Math.round(r.offer1DiscountPercent * 100)));
    setDraftOffer2(String(Math.round(r.offer2DiscountPercent * 100)));
    setDraftOffer2Inst(String(r.offer2Installments));
    setDraftOffer3(String(Math.round(r.offer3DiscountPercent * 100)));
    setDraftOffer3Inst(String(r.offer3Installments));
    setDraftDpThresh(String(r.downPaymentThreshold));
  }, [r]);

  const parsed: Partial<RuleOverrides> = {
    minInstallments: Math.max(1, Number(draftMin) || defaults.minInstallments),
    maxInstallments: Math.max(2, Number(draftMax) || defaults.maxInstallments),
    downPaymentDebtThreshold: Math.max(0, Number(draftThreshold) || 0),
    downPaymentMinPercent: Math.max(0, Math.min(100, Number(draftMinPct) || 0)) / 100,
    monthlyInterestRate: Math.max(0, Number(draftRate) || 0) / 100,
    offer1DiscountPercent: Math.max(0, Math.min(100, Number(draftOffer1) || 0)) / 100,
    offer2DiscountPercent: Math.max(0, Math.min(100, Number(draftOffer2) || 0)) / 100,
    offer2Installments: Math.max(1, Number(draftOffer2Inst) || defaults.offer2Installments),
    offer3DiscountPercent: Math.max(0, Math.min(100, Number(draftOffer3) || 0)) / 100,
    offer3Installments: Math.max(1, Number(draftOffer3Inst) || defaults.offer3Installments),
    downPaymentThreshold: Math.max(0, Number(draftDpThresh) || 0),
  };

  const isDirty = Object.entries(parsed).some(
    ([key, val]) => val !== config.effectiveRules[key as keyof typeof config.effectiveRules]
  );

  const isDefault = Object.keys(config.ruleOverrides).length === 0;

  const handleSave = () => config.setRuleOverrides(parsed);
  const handleReset = () => config.resetRuleOverrides();

  const fieldStyle: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    padding: '6px 8px', fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
    color: palette.textPrimary, width: 0, minWidth: 0,
  };

  const boxStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    borderRadius: 6, border: `1px solid ${palette.border}`,
    background: isLight ? '#fff' : palette.surfaceSecondary,
    overflow: 'hidden',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 500, color: palette.textSecondary, marginBottom: 3,
  };

  const suffixStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 500, color: palette.textSecondary, padding: '0 6px 0 0', flexShrink: 0,
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
        }}
      >
        <Settings2 style={{ width: 11, height: 11, color: palette.textSecondary }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: palette.textSecondary, flex: 1, textAlign: 'left' }}>
          Financial Rules
        </span>
        {!isDefault && <span style={{ fontSize: 9, fontWeight: 600, color: palette.accent, padding: '1px 5px', borderRadius: 4, background: palette.accentSubtle }}>modified</span>}
        {expanded
          ? <ChevronDown style={{ width: 12, height: 12, color: palette.textSecondary }} />
          : <ChevronRight style={{ width: 12, height: 12, color: palette.textSecondary }} />}
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 10, color: palette.textSecondary, margin: '0 0 10px', lineHeight: 1.4 }}>
            Override calculation rules for the selected country. Changes apply to the prototype immediately.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={labelStyle}>Min Installments</div>
              <div style={boxStyle}>
                <input type="number" min={1} value={draftMin} onChange={(e) => setDraftMin(e.target.value)} style={fieldStyle} />
                <span style={suffixStyle}>x</span>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Max Installments</div>
              <div style={boxStyle}>
                <input type="number" min={2} value={draftMax} onChange={(e) => setDraftMax(e.target.value)} style={fieldStyle} />
                <span style={suffixStyle}>x</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <div style={labelStyle}>Monthly Interest Rate</div>
              <div style={boxStyle}>
                <input type="number" min={0} step={0.01} value={draftRate} onChange={(e) => setDraftRate(e.target.value)} style={fieldStyle} />
                <span style={suffixStyle}>%</span>
              </div>
            </div>
          </div>

          {showDpFields && (<>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: palette.textSecondary, marginTop: 14, marginBottom: 6 }}>
              Downpayment
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={labelStyle}>DP Installment Threshold</div>
                <div style={boxStyle}>
                  <input type="number" min={0} value={draftDpThresh} onChange={(e) => setDraftDpThresh(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>x</span>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Min Downpayment</div>
                <div style={boxStyle}>
                  <input type="number" min={0} max={100} value={draftMinPct} onChange={(e) => setDraftMinPct(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>%</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={labelStyle}>Debt Threshold ({curr.code})</div>
              <div style={boxStyle}>
                <span style={{ fontSize: 10, fontWeight: 500, color: palette.textSecondary, padding: '0 0 0 8px', flexShrink: 0 }}>{curr.symbol}</span>
                <input type="number" min={0} value={draftThreshold} onChange={(e) => setDraftThreshold(e.target.value)} style={fieldStyle} />
              </div>
            </div>
          </>)}

          {showOfferFields && (<>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: palette.textSecondary, marginTop: 14, marginBottom: 6 }}>
              Offer Discounts
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <div style={labelStyle}>Cash (Offer 1)</div>
                <div style={boxStyle}>
                  <input type="number" min={0} max={100} value={draftOffer1} onChange={(e) => setDraftOffer1(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>%</span>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Short (Offer 2)</div>
                <div style={boxStyle}>
                  <input type="number" min={0} max={100} value={draftOffer2} onChange={(e) => setDraftOffer2(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>%</span>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Long (Offer 3)</div>
                <div style={boxStyle}>
                  <input type="number" min={0} max={100} value={draftOffer3} onChange={(e) => setDraftOffer3(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <div>
                <div style={labelStyle}>Offer 2 Installments</div>
                <div style={boxStyle}>
                  <input type="number" min={1} value={draftOffer2Inst} onChange={(e) => setDraftOffer2Inst(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>x</span>
                </div>
              </div>
              <div>
                <div style={labelStyle}>Offer 3 Installments</div>
                <div style={boxStyle}>
                  <input type="number" min={1} value={draftOffer3Inst} onChange={(e) => setDraftOffer3Inst(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>x</span>
                </div>
              </div>
            </div>
          </>)}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
            <SaveResetButtons isDirty={isDirty} isDefault={isDefault} onSave={handleSave} onReset={handleReset} palette={palette} isLight={isLight} />
          </div>
        </div>
      )}
    </div>
  );
}

function SaveResetButtons({ isDirty, isDefault, onSave, onReset, palette, isLight }: {
  isDirty: boolean;
  isDefault: boolean;
  onSave: () => void;
  onReset: () => void;
} & PaletteProps) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <motion.button
        type="button"
        onClick={onSave}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        disabled={!isDirty}
        style={{
          height: 28, padding: '0 10px', borderRadius: 7, border: 'none',
          background: isDirty ? palette.accent : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
          color: isDirty ? '#fff' : palette.textSecondary,
          cursor: isDirty ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 11, fontWeight: 600, opacity: isDirty ? 1 : 0.4,
          transition: 'background 0.2s, opacity 0.2s',
        }}
      >
        <Save style={{ width: 11, height: 11 }} />
        Save
      </motion.button>
      <motion.button
        type="button"
        onClick={onReset}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        disabled={isDefault && !isDirty}
        style={{
          height: 28, padding: '0 10px', borderRadius: 7,
          border: `1px solid ${palette.border}`,
          background: isLight ? '#fff' : palette.surfaceSecondary,
          color: palette.textSecondary,
          cursor: isDefault && !isDirty ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 11, fontWeight: 600, opacity: isDefault && !isDirty ? 0.4 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <RotateCcw style={{ width: 11, height: 11 }} />
        Reset
      </motion.button>
    </div>
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
