/**
 * PrototypeViewport — Responsive iPhone-like frame with device resolution selector.
 *
 * Auto-scales the device frame to fit the available panel space.
 * User can switch between common device resolutions.
 * Theme-aware: applies palette colors from ThemeContext.
 */

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Monitor, Shield, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { injectNuDSCSSVars } from '../../nuds';
import { PACKS, READY_SCREENS, SCREEN_BLOCK_META } from '../../../../shared/data/screenVariants';
import type { ScreenVisibility } from '../../../../shared/types';
import { usePrototypeLocation } from '../../hooks/usePrototypeLocation';

interface DevicePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  radius: number;
  hasNotch: boolean;
  safeAreaTop: number;
}

const DEVICES: DevicePreset[] = [
  { id: 'iphone-15-pro', label: 'iPhone 15 Pro', width: 393, height: 852, radius: 44, hasNotch: true, safeAreaTop: 59 },
  { id: 'iphone-14', label: 'iPhone 14', width: 390, height: 844, radius: 42, hasNotch: true, safeAreaTop: 47 },
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, radius: 0, hasNotch: false, safeAreaTop: 20 },
  { id: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max', width: 430, height: 932, radius: 44, hasNotch: true, safeAreaTop: 59 },
  { id: 'pixel-8', label: 'Pixel 8', width: 412, height: 915, radius: 32, hasNotch: true, safeAreaTop: 36 },
  { id: 'galaxy-s24', label: 'Galaxy S24', width: 360, height: 780, radius: 28, hasNotch: true, safeAreaTop: 32 },
];

interface PrototypeViewportProps {
  children: ReactNode;
}

export default function PrototypeViewport({ children }: PrototypeViewportProps) {
  const { palette, mode, nuds } = useTheme();
  const isLight = mode === 'light';
  const protoRef = useRef<HTMLDivElement>(null);

  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const computeScale = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padX = 48;
    const padY = 24;
    const availW = rect.width - padX * 2;
    const availH = rect.height - padY * 2;
    const scaleX = availW / selectedDevice.width;
    const scaleY = availH / selectedDevice.height;
    setScale(Math.min(scaleX, scaleY, 1));
  }, [selectedDevice]);

  useEffect(() => {
    computeScale();
    const observer = new ResizeObserver(computeScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [computeScale]);

  useEffect(() => {
    if (protoRef.current) injectNuDSCSSVars(protoRef.current, nuds);
  }, [nuds]);

  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  const frameShadow = isLight
    ? '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)'
    : '0 8px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'transparent',
        gap: 8,
        overflow: 'hidden',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Device Selector */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            border: `1px solid ${palette.border}`,
            background: cardBg,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: palette.textPrimary,
            boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.2)',
            transition: 'all 0.2s',
          }}
        >
          <Monitor style={{ width: 14, height: 14, color: palette.accent }} />
          <span>{selectedDevice.label}</span>
          <span style={{ color: palette.textSecondary, fontSize: 12 }}>
            {selectedDevice.width}&times;{selectedDevice.height}
          </span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: 2 }}>
            <path d="M1 1L5 5L9 1" stroke={palette.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setShowDropdown(false)}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: cardBg,
              borderRadius: 14,
              border: `1px solid ${palette.border}`,
              boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.4)',
              padding: 4,
              zIndex: 50,
              minWidth: 230,
            }}>
              {DEVICES.map((device) => {
                const active = device.id === selectedDevice.id;
                return (
                  <button
                    key={device.id}
                    onClick={() => { setSelectedDevice(device); setShowDropdown(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: active ? palette.accentSubtle : 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? palette.accent : palette.textPrimary,
                      textAlign: 'left',
                    }}
                  >
                    <span>{device.label}</span>
                    <span style={{ color: palette.textSecondary, fontSize: 12, fontWeight: 400 }}>
                      {device.width}&times;{device.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Scaled Device Frame */}
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.3s ease',
        flexShrink: 0,
      }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: '#fff',
            width: selectedDevice.width,
            height: selectedDevice.height,
            borderRadius: selectedDevice.radius,
            boxShadow: frameShadow,
            border: isLight ? '1px solid rgba(31,2,48,0.06)' : '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.3s ease',
          }}
        >
          {selectedDevice.hasNotch && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 34,
              background: '#000',
              borderRadius: 17,
              zIndex: 20,
            }} />
          )}

          <div
            ref={protoRef}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              ['--safe-area-top' as string]: `${selectedDevice.safeAreaTop}px`,
            }}
          >
            {children}
          </div>

          <div style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 134,
            height: 5,
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 3,
            zIndex: 20,
          }} />
        </div>
      </div>

      {/* Scale indicator */}
      {scale < 0.98 && (
        <span style={{
          fontSize: 11,
          color: palette.textSecondary,
          fontWeight: 500,
          flexShrink: 0,
          transition: 'color 0.3s',
        }}>
          {Math.round(scale * 100)}%
        </span>
      )}

      {/* NuDS Compliance Infographic */}
      <div style={{ marginTop: 12, flexShrink: 0, width: selectedDevice.width * scale }}>
        <NuDSComplianceBadge palette={palette} isLight={isLight} />
      </div>
    </div>
  );
}

type ScreenKey = keyof ScreenVisibility;

const WEB_SCREENS: Set<ScreenKey> = new Set([
  'offerHub', 'eligibility', 'simulation', 'inputValue', 'suggested', 'dueDate', 'summary', 'terms',
]);

const EXPO_SCREENS: Set<ScreenKey> = new Set([
  'offerHub', 'eligibility', 'simulation', 'inputValue', 'suggested', 'dueDate', 'summary', 'terms',
  'pin', 'loading', 'feedback',
]);

type ScreenReport = {
  components: { web: string[]; expo: string[] };
  tokens: string[];
  extensions: string[];
  hardcoded: string[];
};

const SCREEN_REPORTS: Partial<Record<ScreenKey, ScreenReport>> = {
  offerHub: {
    components: {
      web: ['NText', 'Badge', 'Button', 'TopBar'],
      expo: ['TopBar', 'NText', 'Badge', 'Button', 'CloseIcon'],
    },
    tokens: ['color.main', 'color.positive', 'color.surface.success', 'typography.titleLarge', 'spacing', 'radius.xl', 'elevation.level1'],
    extensions: ['PulseBadge (framer-motion loop)', 'SegmentedControl (custom, animated spring)', 'Staggered card entrance'],
    hardcoded: [],
  },
  eligibility: {
    components: {
      web: ['NText', 'Badge', 'Button', 'TopBar'],
      expo: ['TopBar', 'NText', 'Badge', 'Button', 'ArrowBackIcon', 'CheckmarkIcon'],
    },
    tokens: ['color.main', 'color.positive', 'color.surface.accentSubtle', 'typography.titleLarge', 'typography.subtitleMediumStrong', 'spacing', 'radius.lg'],
    extensions: ['Card selection animation (LayoutAnimation / motion)', 'Benefits crossfade (Animated spring / AnimatePresence)', 'PulseBadge'],
    hardcoded: [],
  },
  simulation: {
    components: {
      web: ['NText', 'Badge', 'TopBar'],
      expo: ['NText', 'Box', 'BottomSheet', 'ArrowBackIcon', 'InfoIcon'],
    },
    tokens: ['color.main', 'color.positive', 'color.negative', 'color.surface.success', 'typography.titleLarge', 'spacing', 'radius.xl', 'elevation.level1'],
    extensions: ['AnimatedNumber roulette (blur + spring)', 'CurrencyRoulette', 'Custom slider (PanResponder / pointer events)', 'SavingsBanner (scale pulse)', 'BottomSheet keypad editor', 'Haptic feedback (Expo)'],
    hardcoded: [],
  },
  inputValue: {
    components: {
      web: ['NText', 'Button', 'TopBar'],
      expo: ['TopBar', 'NText', 'Avatar', 'Button', 'Box', 'ArrowBackIcon', 'CalculatorIcon'],
    },
    tokens: ['color.main', 'color.negative', 'color.surface.accent', 'typography.titleMedium', 'spacing', 'radius.sm', 'radius.xl'],
    extensions: ['iOS-style keypad (custom grid)', 'RouletteTip (animated text carousel)', 'RouletteValue (animated amount)', 'Crossfade tip ↔ simulate button'],
    hardcoded: [],
  },
  suggested: {
    components: {
      web: ['NText', 'Badge', 'TopBar'],
      expo: ['TopBar', 'NText', 'Badge', 'ChevronIcon', 'HelpIcon'],
    },
    tokens: ['color.main', 'color.positive', 'color.surface.accentSubtle', 'typography.titleMedium', 'spacing', 'radius.xl'],
    extensions: ['Staggered entrance (spring delays)', 'InstallmentListSheet (motion bottom sheet)'],
    hardcoded: [],
  },
  dueDate: {
    components: {
      web: ['NText', 'TopBar'],
      expo: ['NText', 'BottomSheet', 'Button', 'Box'],
    },
    tokens: ['color.main', 'color.content.primary', 'color.border.secondary', 'typography.titleMedium', 'spacing', 'radius.md'],
    extensions: ['Custom calendar grid', 'Date roulette animation', 'Calendar sheet (motion)'],
    hardcoded: [],
  },
  summary: {
    components: {
      web: ['NText', 'Badge', 'Button', 'TopBar', 'SectionTitle'],
      expo: ['TopBar', 'NText', 'Badge', 'Button', 'SectionTitle', 'Avatar', 'CalendarRenewIcon'],
    },
    tokens: ['color.main', 'color.positive', 'color.surface.success', 'typography.titleLarge', 'spacing', 'radius.xl'],
    extensions: ['Staggered section entrance', 'Backdrop blur bottom bar'],
    hardcoded: [],
  },
  terms: {
    components: {
      web: ['NText', 'Button', 'TopBar'],
      expo: ['TopBar', 'NText', 'Button', 'Box', 'ArrowBackIcon'],
    },
    tokens: ['color.main', 'typography.titleMedium', 'typography.subtitleMediumDefault', 'typography.labelMediumStrong', 'spacing', 'radius.xl'],
    extensions: ['Scroll-to-bottom detection', 'Disabled → enabled button transition'],
    hardcoded: [],
  },
  pin: {
    components: { web: [], expo: ['NText', 'Box', 'ArrowBackIcon'] },
    tokens: ['color.main', 'color.background.primary', 'color.background.secondary', 'typography.titleMedium', 'spacing'],
    extensions: ['iOS-style keypad', 'PIN dot animation'],
    hardcoded: [],
  },
  loading: {
    components: { web: [], expo: ['NText', 'Box'] },
    tokens: ['color.main', 'typography.titleSmall', 'spacing'],
    extensions: ['Progress animation (Animated loop)'],
    hardcoded: [],
  },
  feedback: {
    components: { web: [], expo: ['NText', 'Button', 'Box'] },
    tokens: ['color.main', 'color.positive', 'typography.titleMedium', 'spacing'],
    extensions: ['Emoji reaction picker', 'Success checkmark animation'],
    hardcoded: [],
  },
};

const GIT_REPO = 'https://github.com/julioferracini/design-negotiation-flow-emulator';
const NUDS_REPO = 'https://github.com/nubank/nuds';

function GitIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function resolveCurrentScreen(pathname: string): ScreenKey | null {
  const slug = pathname.split('/').filter(Boolean).pop()?.toLowerCase().replace(/_/g, '-');
  if (!slug) return null;
  for (const [key, meta] of Object.entries(SCREEN_BLOCK_META)) {
    if (meta.path === slug) return key as ScreenKey;
  }
  return null;
}

function NuDSComplianceBadge({ palette, isLight }: { palette: ReturnType<typeof useTheme>['palette']; isLight: boolean }) {
  const { pathname, search } = usePrototypeLocation();
  const currentScreen = resolveCurrentScreen(pathname);
  const [modalOpen, setModalOpen] = useState(false);

  const screenTitle = currentScreen ? SCREEN_BLOCK_META[currentScreen]?.title : null;
  const variantParam = new URLSearchParams(search).get('variant');
  const variantLabel = variantParam ? variantParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Default';
  const fullTitle = screenTitle ? `${screenTitle} · ${variantLabel}` : null;

  const webHas = currentScreen ? WEB_SCREENS.has(currentScreen) : false;
  const expoHas = currentScreen ? EXPO_SCREENS.has(currentScreen) : false;
  const webCompliant = webHas && READY_SCREENS.has(currentScreen!);
  const expoCompliant = expoHas && READY_SCREENS.has(currentScreen!);
  const webPct = webHas ? (webCompliant ? 100 : 0) : 0;
  const expoPct = expoHas ? (expoCompliant ? 100 : 0) : 0;
  const report = currentScreen ? SCREEN_REPORTS[currentScreen] : undefined;

  if (!currentScreen) return null;

  const cardBg = isLight ? 'rgba(130,10,209,0.03)' : 'rgba(130,10,209,0.06)';
  const cardBorder = isLight ? 'rgba(130,10,209,0.08)' : 'rgba(130,10,209,0.12)';

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', borderRadius: 12, width: '100%',
          background: cardBg, border: `1px solid ${cardBorder}`,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield style={{ width: 11, height: 11, color: palette.accent, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: palette.accent, letterSpacing: '0.4px', textTransform: 'uppercase' }}>NuDS</span>
          <span style={{ fontSize: 9, fontWeight: 500, color: palette.textSecondary }}>{screenTitle}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CompliancePill label="Web" pct={webPct} available={webHas} palette={palette} isLight={isLight} />
          <CompliancePill label="Expo" pct={expoPct} available={expoHas} palette={palette} isLight={isLight} />
        </div>
      </button>

      <AnimatePresence>
        {modalOpen && report && (
          <NuDSReportModal
            screenTitle={fullTitle!}
            report={report}
            webPct={webPct}
            expoPct={expoPct}
            webHas={webHas}
            expoHas={expoHas}
            palette={palette}
            isLight={isLight}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function NuDSReportModal({ screenTitle, report, webPct, expoPct, webHas, expoHas, palette, isLight, onClose }: {
  screenTitle: string;
  report: ScreenReport;
  webPct: number;
  expoPct: number;
  webHas: boolean;
  expoHas: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
  onClose: () => void;
}) {
  const modalBg = isLight ? '#FFFFFF' : '#1A1A1C';
  const sectionBg = isLight ? '#F8F6F8' : '#222224';
  const chipBg = isLight ? 'rgba(130,10,209,0.07)' : 'rgba(130,10,209,0.12)';
  const tokenBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)';
  const extBg = isLight ? 'rgba(12,122,58,0.06)' : 'rgba(12,122,58,0.1)';
  const extColor = isLight ? '#0c7a3a' : '#4AA46E';
  const warnBg = isLight ? 'rgba(175,77,14,0.06)' : 'rgba(175,77,14,0.1)';
  const warnColor = isLight ? '#AF4D0E' : '#E4863F';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 520, maxWidth: '92vw', maxHeight: '85vh', overflow: 'auto',
            background: modalBg, borderRadius: 20, padding: '28px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Shield style={{ width: 16, height: 16, color: palette.accent }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: palette.accent, letterSpacing: '0.5px', textTransform: 'uppercase' }}>NuDS Foundation Report</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: palette.textPrimary, letterSpacing: '-0.4px' }}>
                {screenTitle}
              </h2>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10, border: 'none',
              background: isLight ? '#F0EEF1' : '#2A2A2A', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: palette.textSecondary, flexShrink: 0,
            }}>
              ✕
            </button>
          </div>

          {/* Platform columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <PlatformCard label="Web Vite" pct={webPct} available={webHas} components={report.components.web} chipBg={chipBg} sectionBg={sectionBg} palette={palette} />
            <PlatformCard label="Expo Go" pct={expoPct} available={expoHas} components={report.components.expo} chipBg={chipBg} sectionBg={sectionBg} palette={palette} />
          </div>

          {/* Foundation Layer */}
          <div style={{ padding: 18, borderRadius: 14, background: sectionBg, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.accent, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 14 }}>Foundation Layer</div>

            {/* Tokens */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Design Tokens</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {report.tokens.map((tk) => (
                  <span key={tk} style={{ fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 6, background: tokenBg, color: palette.textSecondary, fontFamily: 'monospace' }}>{tk}</span>
                ))}
              </div>
            </div>

            {/* Custom Extensions */}
            {report.extensions.length > 0 && (
              <div style={{ marginBottom: report.hardcoded.length > 0 ? 14 : 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: extColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Custom Extensions (beyond NuDS)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {report.extensions.map((ext) => (
                    <div key={ext} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: palette.textSecondary, lineHeight: 1.4 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: extColor, flexShrink: 0, marginTop: 5 }} />
                      {ext}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hardcoded Exceptions */}
            {report.hardcoded.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: warnColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Hardcoded Exceptions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {report.hardcoded.map((hc) => (
                    <span key={hc} style={{ fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 6, background: warnBg, color: warnColor, fontFamily: 'monospace' }}>{hc}</span>
                  ))}
                </div>
              </div>
            )}

            {report.hardcoded.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke={extColor} strokeWidth="1.5" />
                  <path d="M6 10.5L9 13.5L14 7" stroke={extColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: extColor }}>Zero hardcoded values</span>
              </div>
            )}
          </div>

          {/* Expo Go Preview */}
          <div style={{
            padding: 18, borderRadius: 14, background: sectionBg, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            {/* QR Placeholder */}
            <div style={{
              width: 72, height: 72, borderRadius: 12, flexShrink: 0,
              background: isLight ? 'rgba(130,10,209,0.05)' : 'rgba(130,10,209,0.08)',
              border: `1.5px dashed ${isLight ? 'rgba(130,10,209,0.2)' : 'rgba(130,10,209,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke={palette.accent} strokeWidth="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke={palette.accent} strokeWidth="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke={palette.accent} strokeWidth="1.5" />
                <rect x="5.5" y="5.5" width="2" height="2" rx="0.5" fill={palette.accent} />
                <rect x="16.5" y="5.5" width="2" height="2" rx="0.5" fill={palette.accent} />
                <rect x="5.5" y="16.5" width="2" height="2" rx="0.5" fill={palette.accent} />
                <rect x="14" y="14" width="3" height="3" rx="0.5" fill={palette.accent} opacity={0.4} />
                <rect x="18" y="14" width="3" height="3" rx="0.5" fill={palette.accent} opacity={0.3} />
                <rect x="14" y="18" width="3" height="3" rx="0.5" fill={palette.accent} opacity={0.3} />
                <rect x="18" y="18" width="3" height="3" rx="0.5" fill={palette.accent} opacity={0.2} />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>Preview on Expo Go</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  padding: '2px 6px', borderRadius: 4,
                  background: isLight ? 'rgba(255,152,0,0.1)' : 'rgba(255,152,0,0.15)',
                  color: isLight ? '#E65100' : '#FFB74D',
                }}>Soon</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: palette.textSecondary }}>
                Scan to open this exact screen and variant on your device via Expo Go.
              </p>
            </div>
          </div>

          {/* Repo links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <a href={GIT_REPO} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              borderRadius: 12, background: sectionBg, textDecoration: 'none',
            }}>
              <GitIcon size={20} color={palette.textSecondary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>Project Repository</div>
                <div style={{ fontSize: 10, color: palette.textSecondary, marginTop: 1 }}>design-negotiation-flow-emulator</div>
              </div>
              <ExternalLink style={{ width: 12, height: 12, color: palette.textSecondary, opacity: 0.4 }} />
            </a>
            <a href={NUDS_REPO} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              borderRadius: 12, background: sectionBg, textDecoration: 'none',
            }}>
              <GitIcon size={20} color={palette.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: palette.accent }}>NuDS Design System</div>
                <div style={{ fontSize: 10, color: palette.textSecondary, marginTop: 1 }}>nubank/nuds · Official DS repo</div>
              </div>
              <ExternalLink style={{ width: 12, height: 12, color: palette.accent, opacity: 0.4 }} />
            </a>
          </div>

          {/* Provenance */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: palette.textSecondary, opacity: 0.6 }}>
              Powered by <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>@nubank/nuds-vibecode-tokens v0.4.1</span> · Origin: Project-Ignition
            </span>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

function PlatformCard({ label, pct, available, components, chipBg, sectionBg, palette }: {
  label: string; pct: number; available: boolean; components: string[];
  chipBg: string; sectionBg: string; palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: sectionBg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: palette.accent, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
        {available ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? '#0c7a3a' : palette.accent }}>{pct}%</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, opacity: 0.5 }}>N/A</span>
        )}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Components</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {components.length > 0 ? components.map((c) => (
          <span key={c} style={{ fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 6, background: chipBg, color: palette.accent }}>{c}</span>
        )) : <span style={{ fontSize: 11, color: palette.textSecondary, opacity: 0.5, fontStyle: 'italic' }}>Not available on this platform</span>}
      </div>
    </div>
  );
}

function CompliancePill({ label, pct, available, palette, isLight }: {
  label: string; pct: number; available: boolean;
  palette: ReturnType<typeof useTheme>['palette']; isLight: boolean;
}) {
  if (!available) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: palette.textSecondary, opacity: 0.5 }}>{label}</span>
        <span style={{ fontSize: 8, fontWeight: 600, color: palette.textSecondary, opacity: 0.4 }}>—</span>
      </div>
    );
  }

  const color = pct === 100 ? '#0c7a3a' : pct >= 80 ? palette.accent : '#AF4D0E';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: palette.textSecondary }}>{label}</span>
      <div style={{
        width: 24, height: 3, borderRadius: 2, overflow: 'hidden',
        background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 8, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
    </div>
  );
}
