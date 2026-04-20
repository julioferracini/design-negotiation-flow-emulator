/**
 * PrototypeViewport — Responsive iPhone-like frame with device resolution selector.
 *
 * Auto-scales the device frame to fit the available panel space.
 * User can switch between common device resolutions.
 * Theme-aware: applies palette colors from ThemeContext.
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Monitor, Shield, ExternalLink, ChevronDown, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, animate, useMotionValue, useTransform } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { injectNuDSCSSVars } from '../../nuds';
import { PACKS, READY_SCREENS, SCREEN_BLOCK_META } from '../../../../shared/data/screenVariants';
import type { ScreenVisibility } from '../../../../shared/types';
import { usePrototypeLocation } from '../../hooks/usePrototypeLocation';
import { SCREEN_CONTENT_VARIANTS } from './ParameterPanel';
import type { ScreenKey as EmulatorScreenKey } from '../../context/EmulatorConfigContext';
import { getTranslations, type Locale } from '@shared/i18n';
import { parseProtoLocale } from '../../lib/protoLocale';

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const PATH_TO_SCREEN: Record<string, EmulatorScreenKey> = {};
for (const [key, meta] of Object.entries(SCREEN_BLOCK_META)) {
  PATH_TO_SCREEN[meta.path] = key as EmulatorScreenKey;
}

interface DevicePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  radius: number;
  hasNotch: boolean;
  safeAreaTop: number;
  /** Show iOS home indicator bar (swipe-up affordance) — only on modern iPhones with notch. */
  isIOS: boolean;
}

const DEVICES: DevicePreset[] = [
  { id: 'iphone-15-pro', label: 'iPhone 15 Pro', width: 393, height: 852, radius: 44, hasNotch: true, safeAreaTop: 59, isIOS: true },
  { id: 'iphone-14', label: 'iPhone 14', width: 390, height: 844, radius: 42, hasNotch: true, safeAreaTop: 47, isIOS: true },
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, radius: 0, hasNotch: false, safeAreaTop: 20, isIOS: false },
  { id: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max', width: 430, height: 932, radius: 44, hasNotch: true, safeAreaTop: 59, isIOS: true },
  { id: 'pixel-8', label: 'Pixel 8', width: 412, height: 915, radius: 32, hasNotch: true, safeAreaTop: 36, isIOS: false },
  { id: 'galaxy-s24', label: 'Galaxy S24', width: 360, height: 780, radius: 28, hasNotch: true, safeAreaTop: 32, isIOS: false },
];

interface PrototypeViewportProps {
  children: ReactNode;
}

export default function PrototypeViewport({ children }: PrototypeViewportProps) {
  const { palette, mode, nuds } = useTheme();
  const isLight = mode === 'light';
  const protoRef = useRef<HTMLDivElement>(null);
  const { pathname, search, navigate } = usePrototypeLocation();

  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [variantDropdownOpen, setVariantDropdownOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);

  // Current screen + variant (derived from URL) — shown in the left sidebar.
  const screenSlug = pathname.split('/').filter(Boolean).pop() ?? '';
  const screenKey = PATH_TO_SCREEN[screenSlug];
  const screenTitle = screenKey ? SCREEN_BLOCK_META[screenKey].title : null;
  const variants = screenKey ? SCREEN_CONTENT_VARIANTS[screenKey] : undefined;
  const variantParam = new URLSearchParams(search).get('variant');
  const activeVariant = variants?.find(v => {
    if (variantParam) return v.screenPath.includes(`variant=${variantParam}`);
    return v.isDefault;
  }) ?? variants?.[0];
  const hasMultipleVariants = variants && variants.length > 1;

  // Stage area (right side of the viewport) holds the scaled frame only.
  // Left sidebar takes a fixed width and reserves horizontal space outside this calc.
  const STAGE_PAD_X = 32;
  const STAGE_PAD_Y = 24;
  const SCALE_INDICATOR_RESERVE = 20; // "67%" label below frame

  const computeScale = useCallback(() => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const availW = rect.width - STAGE_PAD_X * 2;
    const availH = rect.height - STAGE_PAD_Y * 2 - SCALE_INDICATOR_RESERVE;
    const scaleX = availW / selectedDevice.width;
    const scaleY = availH / selectedDevice.height;
    setScale(Math.max(0.2, Math.min(scaleX, scaleY, 1)));
  }, [selectedDevice]);

  useEffect(() => {
    computeScale();
    const observer = new ResizeObserver(computeScale);
    if (stageRef.current) observer.observe(stageRef.current);
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
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      background: 'transparent',
      overflow: 'hidden',
      transition: 'background 0.3s ease',
    }}>
      {/* LEFT SIDEBAR — Prototype metadata, device selector, NuDS block */}
      <aside style={{
        width: 248,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px 20px',
        borderRight: `1px solid ${palette.border}`,
        // A tone very close to the stage (#efebf2), just a hair lighter, keeping the depth subtle.
        background: isLight ? '#f2eff4' : 'rgba(255,255,255,0.025)',
        overflowY: 'auto',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        {/* Title block — matches the "Emulator" heading on the left: same minHeight, padding-top, line-heights */}
        <div style={{
          padding: '20px 0 20px',
          minHeight: 88,
          boxSizing: 'border-box',
        }}>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: palette.textPrimary,
            margin: 0,
            lineHeight: 1.2,
            transition: 'color 0.3s ease',
          }}>
            {screenTitle ?? 'Prototype'}
          </h1>
          <p style={{
            fontSize: 12,
            color: isLight ? 'rgba(31,2,48,0.5)' : 'rgba(255,255,255,0.45)',
            margin: '4px 0 0',
            lineHeight: 1.4,
            transition: 'color 0.3s ease',
          }}>
            {activeVariant?.label ?? 'Screen metadata & compliance'}
          </p>
        </div>

        {/* Sections below the heading share a consistent vertical rhythm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Variant selector (only when multiple variants exist) */}
        {activeVariant && hasMultipleVariants && (
          <div>
            <SidebarSectionLabel color={palette.textSecondary}>Variant</SidebarSectionLabel>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => hasMultipleVariants && setVariantDropdownOpen(!variantDropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: isLight ? palette.accentSubtle : withAlpha(palette.accent, 0.12),
                  border: `1px solid ${withAlpha(palette.accent, 0.22)}`,
                  cursor: hasMultipleVariants ? 'pointer' : 'default',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: 500, color: palette.accent,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activeVariant.label}
                </span>
                {hasMultipleVariants && <ChevronDown style={{ width: 14, height: 14, color: palette.accent, flexShrink: 0 }} />}
              </button>

              {variantDropdownOpen && variants && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setVariantDropdownOpen(false)} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: isLight ? '#fff' : palette.surfaceSecondary,
                    borderRadius: 12, border: `1px solid ${palette.border}`,
                    boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.4)',
                    padding: 4, zIndex: 50,
                  }}>
                    {variants.filter(v => v.status === 'ready').map(v => {
                      const isActive = v.id === activeVariant.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            setVariantDropdownOpen(false);
                            const lang = new URLSearchParams(search).get('lang') ?? 'pt-BR';
                            const sep = v.screenPath.includes('?') ? '&' : '?';
                            navigate(`/emulator/default/default/${v.screenPath}${sep}lang=${lang}`);
                          }}
                          style={{
                            display: 'block', width: '100%', padding: '9px 12px', borderRadius: 8,
                            border: 'none', background: isActive ? palette.accentSubtle : 'transparent',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <span style={{
                            fontSize: 12, fontWeight: isActive ? 600 : 500,
                            color: isActive ? palette.accent : palette.textPrimary,
                          }}>
                            {v.label}
                          </span>
                          <span style={{ display: 'block', fontSize: 10, color: palette.textSecondary, marginTop: 2, fontFamily: 'monospace' }}>
                            {v.version}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Device selector */}
        <div>
          <SidebarSectionLabel color={palette.textSecondary}>Viewport</SidebarSectionLabel>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', gap: 8,
                padding: '11px 14px', borderRadius: 10,
                border: `1px solid ${palette.border}`,
                background: cardBg,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <Monitor style={{ width: 14, height: 14, color: palette.accent, flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, fontWeight: 500, color: palette.textPrimary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  flex: 1, textAlign: 'left',
                }}>
                  {selectedDevice.label}
                </span>
              </div>
              <ChevronDown style={{ width: 14, height: 14, color: palette.accent, flexShrink: 0 }} />
            </button>
            <div style={{
              fontSize: 10, color: palette.textSecondary,
              fontFamily: 'monospace', marginTop: 6,
              letterSpacing: '0.3px',
            }}>
              {selectedDevice.width} × {selectedDevice.height} px
            </div>

            {showDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowDropdown(false)} />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: cardBg, borderRadius: 12,
                  border: `1px solid ${palette.border}`,
                  boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.4)',
                  padding: 4, zIndex: 50,
                }}>
                  {DEVICES.map((device) => {
                    const active = device.id === selectedDevice.id;
                    return (
                      <button
                        key={device.id}
                        onClick={() => { setSelectedDevice(device); setShowDropdown(false); }}
                        style={{
                          display: 'block', width: '100%', padding: '9px 12px', borderRadius: 8,
                          border: 'none',
                          background: active ? palette.accentSubtle : 'transparent',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{
                          fontSize: 12, fontWeight: active ? 600 : 500,
                          color: active ? palette.accent : palette.textPrimary,
                        }}>
                          {device.label}
                        </span>
                        <span style={{
                          display: 'block', color: palette.textSecondary,
                          fontSize: 10, marginTop: 2, fontFamily: 'monospace',
                        }}>
                          {device.width} × {device.height} px
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* NuDS Check block — only shown when a screen is actually being presented in the viewport */}
        {screenKey && (
          <div>
            <SidebarSectionLabel color={palette.textSecondary}>NuDS Check</SidebarSectionLabel>
            <NuDSComplianceBadge palette={palette} isLight={isLight} />
          </div>
        )}

        {/*
         * Loading screen helper — the LoadingScreen is a one-shot animation.
         * When the viewer lets it finish it holds on the "Done" state and
         * does not navigate anywhere (we don't want to dump the user on an
         * empty previewer). This button remounts the screen so the viewer
         * can replay the animation from scratch.
         *
         * Implementation: push `?replay={timestamp}` into the URL. The web
         * App.tsx picks this up as part of the motionKey for the loading
         * case, which forces a remount of <LoadingScreen>.
         */}
        {screenKey === 'loading' && (
          <LoadingReplayButton
            pathname={pathname}
            search={search}
            navigate={navigate}
            palette={palette}
            isLight={isLight}
          />
        )}
        </div>
      </aside>

      {/* RIGHT STAGE — scaled device frame fills all remaining height */}
      <div
        ref={stageRef}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${STAGE_PAD_Y}px ${STAGE_PAD_X}px`,
          gap: 8,
          overflow: 'hidden',
        }}
      >
        {/* Scaled Device Frame — outer wrapper reserves the SCALED size in flex layout. */}
        <div style={{
          width: selectedDevice.width * scale,
          height: selectedDevice.height * scale,
          flexShrink: 0,
          position: 'relative',
        }}>
          <div style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.3s ease',
            width: selectedDevice.width,
            height: selectedDevice.height,
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

              {selectedDevice.isIOS && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 134,
                    height: 5,
                    background: 'rgba(0,0,0,0.85)',
                    borderRadius: 3,
                    zIndex: 2000,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
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
      </div>
    </div>
  );
}

type ScreenKey = keyof ScreenVisibility;

const WEB_SCREENS: Set<ScreenKey> = new Set([
  'offerHub', 'eligibility', 'simulation', 'inputValue', 'suggested', 'dueDate', 'summary', 'terms',
  'pin', 'loading', 'feedback',
]);

const EXPO_SCREENS: Set<ScreenKey> = new Set([
  'offerHub', 'eligibility', 'simulation', 'inputValue', 'suggested', 'dueDate', 'summary', 'terms',
  'pin', 'loading', 'feedback',
]);

/**
 * NuDS Foundation scoring model.
 *
 * Historically the score was binary — a screen was either 100% (in READY_SCREENS)
 * or 0% — which gave every screen in the flow a green 100%, losing signal.
 *
 * The new model starts each platform at 100% and deducts per unique hardcoded
 * offense. Offenses are tagged by {@link OffenseKind} and have per-category weights
 * with category caps so a single screen can't "explode" to −200%. Extensions
 * (custom primitives / animations documented in `extensions[]`) justify the
 * existence of the custom thing but do NOT excuse hardcoded values INSIDE them.
 *
 * See ARCHITECTURE decision in .cursor/rules/platform-visual-language.mdc.
 */
type OffenseKind = 'color' | 'font' | 'element' | 'spacing' | 'radius';

type HardcodedOffense = {
  /** Category of deviation — drives the penalty weight. */
  kind: OffenseKind;
  /** The literal value that should have come from a NuDS token (e.g. "#BAB8FF", "fontSize: 14"). */
  value: string;
  /** Human-readable context of where this appears, shown in the Foundation Report. */
  where: string;
  /** Which platforms this offense applies to. */
  platforms: ('web' | 'expo')[];
};

type ScreenReport = {
  components: { web: string[]; expo: string[] };
  tokens: string[];
  extensions: string[];
  hardcoded: HardcodedOffense[];
};

/** Per-unit penalty (subtracted from 100 per unique offense). */
const PENALTY_PER_UNIT: Record<OffenseKind, number> = {
  color: 5,
  font: 5,
  element: 15,
  spacing: 3,
  radius: 3,
};

/** Per-category cap on accumulated penalty, so a screen with many tokens-adjacent offenses doesn't collapse to 0. */
const PENALTY_CAP: Record<OffenseKind, number> = {
  color: 30,
  font: 30,
  element: 999, // intentionally uncapped — custom non-extension elements are structural
  spacing: 15,
  radius: 15,
};

/**
 * Compute the NuDS Foundation % for a given platform.
 * Returns an integer in [0, 100]. `undefined` report → 0.
 */
function computeScreenPct(report: ScreenReport | undefined, platform: 'web' | 'expo'): number {
  if (!report) return 0;
  const offenses = report.hardcoded.filter((h) => h.platforms.includes(platform));
  const byKind: Record<OffenseKind, number> = { color: 0, font: 0, element: 0, spacing: 0, radius: 0 };
  for (const o of offenses) byKind[o.kind] += PENALTY_PER_UNIT[o.kind];
  let totalPenalty = 0;
  (Object.keys(byKind) as OffenseKind[]).forEach((k) => {
    totalPenalty += Math.min(byKind[k], PENALTY_CAP[k]);
  });
  return Math.max(0, 100 - totalPenalty);
}

/**
 * Map a score to a display color, using the 5-tier scale introduced alongside
 * the deflator model. Keeps 100% as the single green "pristine" state and
 * gradually warms the hue as compliance drops.
 */
function pctColor(pct: number, accent: string, textSecondary: string, available: boolean): string {
  if (!available) return textSecondary;
  if (pct === 100) return '#0c7a3a';    // verde forte · pristine
  if (pct >= 90) return '#4AA46E';      // verde suave · ~1 ofensa
  if (pct >= 75) return accent;         // accent (roxo) · algumas ofensas corrigíveis
  if (pct >= 60) return '#AF4D0E';      // laranja · dívida tipográfica relevante
  return '#C73030';                      // vermelho · tela precisa de refactor estrutural
}

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
    hardcoded: [
      { kind: 'font', value: 'fontSize: 14', where: 'SavingsBanner <Text> (bypasses NText)', platforms: ['expo'] },
      { kind: 'font', value: 'fontSize: 36', where: 'StyleSheet.titleText recreates typography.titleLarge', platforms: ['expo'] },
      { kind: 'color', value: 'rgba(255,255,255,0.08)', where: 'CheckoutBottomBar CTA inner bevel boxShadow', platforms: ['web'] },
      { kind: 'color', value: 'rgba(0,0,0,backdropOpacity)', where: 'BottomSheet backdrop (no overlay token)', platforms: ['web'] },
      { kind: 'color', value: 'rgba(0,0,0,0.10)', where: 'BottomSheet top boxShadow (should be elevation)', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 9', where: 'mandatory field bullet marker', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 12', where: 'slider labels + editor hint', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 14', where: 'row spans, sticky bar CTA label, body text', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 15', where: 'CTAs in DetailsSheet / DownpaymentAlertSheet', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 16', where: 'struck-through original amount + small ✕ icon', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 18', where: '"Total: R$ X" sticky bar + large ✕ icon', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 22', where: 'DetailsSheet <h2> title', platforms: ['web'] },
      { kind: 'font', value: 'fontSize: 24', where: 'DownpaymentAlertSheet <h2> title', platforms: ['web'] },
    ],
  },
  inputValue: {
    components: {
      web: ['NText', 'Button', 'TopBar'],
      expo: ['TopBar', 'NText', 'Avatar', 'Button', 'Box', 'ArrowBackIcon', 'CalculatorIcon'],
    },
    tokens: ['color.main', 'color.negative', 'color.surface.accent', 'typography.titleMedium', 'spacing', 'radius.sm', 'radius.xl'],
    extensions: ['iOS-style keypad (custom grid)', 'RouletteTip (animated text carousel)', 'RouletteValue (animated amount)', 'Crossfade tip ↔ simulate button'],
    hardcoded: [
      { kind: 'font', value: 'fontSize: 9', where: 'small overline label (bypasses NText labelXSmallDefault)', platforms: ['web'] },
    ],
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
    hardcoded: [
      { kind: 'font', value: 'fontSize: 14', where: 'inline text spans (should be NText paragraphSmallDefault)', platforms: ['web', 'expo'] },
      { kind: 'font', value: 'fontSize: 13', where: 'small day-cell text in custom calendar grid', platforms: ['web', 'expo'] },
      { kind: 'font', value: 'fontSize: 15', where: 'CTA label spans in sticky bar', platforms: ['web'] },
    ],
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
    components: {
      web: ['NText', 'PinCode', 'BottomSheet (custom)'],
      expo: ['BottomSheet', 'PinCode', 'NText'],
    },
    tokens: ['color.content.primary', 'color.content.secondary', 'color.negative', 'color.surface.overlaySubtle', 'color.background.primary', 'typography.titleMedium', 'typography.labelXSmallDefault', 'radius.full', 'radius.xl', 'spacing.x5', 'spacing.x6', 'spacing.x8'],
    extensions: ['iOS-style keypad (web)', 'Native numeric keyboard via hidden TextInput (expo)', 'Shake animation on error', 'Auto-clear after 1.2s', 'Haptic feedback (expo via expo-haptics)'],
    hardcoded: [
      { kind: 'color', value: '#000', where: 'keypad icon SVG fills/strokes (breaks dark mode)', platforms: ['web'] },
      { kind: 'color', value: 'rgba(0,0,0,0.10)', where: 'sheet top boxShadow (should be elevation token)', platforms: ['web'] },
    ],
  },
  loading: {
    components: {
      web: ['TopBar', 'Button'],
      expo: ['Box', 'TopBar', 'NText', 'Button', 'CloseIcon'],
    },
    tokens: [
      'color.main',
      'color.content.primary',
      'color.background.subtle',
      'color.border.secondary',
      'typography.titleLarge (NuSansDisplay-Medium 36/1.1)',
      'radius.md (8px, border.radius.geometry.medium)',
      'spacing.x6 (24px, padding + gap)',
      'spacing.x10 (80px, bottom offset)',
    ],
    extensions: [
      'LinearProgressBar (custom primitive — NuDS has no linear variant)',
      'Stacking title motion (Animated stackY + opacity crossfade, framer-motion twin)',
      '10% → 100% progress curve',
      'Restart CTA (preview only, replays animation)',
    ],
    hardcoded: [],
  },
  feedback: {
    components: {
      web: ['NText', 'Button'],
      expo: ['NText', 'Button', 'CloseIcon'],
    },
    tokens: [
      'color.content.primary',
      'color.content.secondary',
      'color.background.primary',
      'typography.titleMedium (28/33.6, -3% tracking)',
      'typography.paragraphMediumDefault (16/24)',
      'radius.xl (24px, border.radius.geometry.xlarge)',
      'spacing.x6 (24px, card padding + gap)',
      'spacing.x2 (8px, inner group gap)',
      'elevation.level1',
    ],
    extensions: [
      'FlagIllustration (custom SVG primitive, matches Figma Flag)',
      'Background illustration breathing loop (scale + translateY, 9s)',
      'Bottom card entry (translateY + fade, ease-out-expo)',
      'Staggered inner content reveal (flag → title → description → CTAs, 80ms cadence)',
    ],
    hardcoded: [
      { kind: 'color', value: '#BAB8FF', where: 'full-bleed background behind the illustration', platforms: ['web', 'expo'] },
      { kind: 'color', value: 'rgba(255,255,255,0.92)', where: 'translucent card background fill', platforms: ['web', 'expo'] },
      { kind: 'color', value: 'rgba(0,0,0,0.08)', where: 'card boxShadow (should be elevation token)', platforms: ['web'] },
      { kind: 'color', value: '#000', where: 'card shadowColor (should be elevation token)', platforms: ['expo'] },
      { kind: 'color', value: '#E5E0E8', where: 'secondary shadow/border accent', platforms: ['web', 'expo'] },
    ],
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

function SidebarSectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  // Mirrors the SectionLabel used in ParameterPanel (fontSize 11, weight 600, letter-spacing 0.8, margin-bottom 8).
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8,
      margin: '0 0 8px', color, transition: 'color 0.3s',
    }}>
      {children}
    </p>
  );
}

/**
 * LoadingReplayButton — sidebar CTA that replays the Loading animation.
 *
 * Rendered right below the NuDS Check card when the current screen is
 * `loading`. Clicking it pushes `?replay={timestamp}` into the URL; the
 * motionKey in App.tsx includes this value for the loading case, so React
 * fully remounts the LoadingScreen — which rewinds stepIndex to 0 and
 * restarts the entire animation cycle cleanly.
 *
 * Intentionally lightweight: no motion choreography, no extra state —
 * it's just a thin bridge between the sidebar and the screen.
 */
function LoadingReplayButton({
  pathname,
  search,
  navigate,
  palette,
  isLight,
}: {
  pathname: string;
  search: string;
  navigate: (path: string) => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}) {
  const params = new URLSearchParams(search);
  const langParam = params.get('lang') ?? 'pt-BR';
  const locale: Locale = parseProtoLocale(langParam);
  const t = getTranslations(locale).loading;
  const [hover, setHover] = useState(false);

  const handleClick = useCallback(() => {
    const nextParams = new URLSearchParams(search);
    nextParams.set('replay', String(Date.now()));
    navigate(`${pathname}?${nextParams.toString()}`);
  }, [pathname, search, navigate]);

  const cardBg = isLight ? '#fff' : palette.surfaceSecondary;
  const borderCol = isLight ? 'rgba(130,10,209,0.14)' : 'rgba(130,10,209,0.22)';
  const hoverBorder = isLight ? 'rgba(130,10,209,0.28)' : 'rgba(130,10,209,0.4)';

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        marginTop: 12,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: `1px solid ${hover ? hoverBorder : borderCol}`,
        borderRadius: 10,
        background: cardBg,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
      }}
    >
      <RotateCcw
        size={14}
        strokeWidth={2}
        style={{ color: palette.accent, flexShrink: 0 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>
          {t.restart}
        </span>
        <span style={{ fontSize: 10, color: palette.textSecondary, letterSpacing: 0.1 }}>
          Replay the loading animation
        </span>
      </div>
    </button>
  );
}

function NuDSComplianceBadge({ palette, isLight }: { palette: ReturnType<typeof useTheme>['palette']; isLight: boolean }) {
  const { pathname, search } = usePrototypeLocation();
  const currentScreen = resolveCurrentScreen(pathname);
  const [modalOpen, setModalOpen] = useState(false);
  const [hover, setHover] = useState(false);

  const screenTitle = currentScreen ? SCREEN_BLOCK_META[currentScreen]?.title : null;
  const variantParam = new URLSearchParams(search).get('variant');
  const variantLabel = variantParam ? variantParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Default';
  const fullTitle = screenTitle ? `${screenTitle} · ${variantLabel}` : null;

  const webHas = currentScreen ? WEB_SCREENS.has(currentScreen) : false;
  const expoHas = currentScreen ? EXPO_SCREENS.has(currentScreen) : false;
  // READY_SCREENS keeps acting as a safety gate: a screen must be marked ready AND have a report to be scored.
  const isReady = currentScreen ? READY_SCREENS.has(currentScreen) : false;
  const report = currentScreen ? SCREEN_REPORTS[currentScreen] : undefined;
  const webPct = webHas && isReady ? computeScreenPct(report, 'web') : 0;
  const expoPct = expoHas && isReady ? computeScreenPct(report, 'expo') : 0;

  if (!currentScreen) return null;

  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.03)';
  const cardBorder = isLight ? 'rgba(130,10,209,0.14)' : 'rgba(130,10,209,0.22)';
  const hoverBorder = isLight ? 'rgba(130,10,209,0.28)' : 'rgba(130,10,209,0.4)';
  const dividerColor = isLight ? 'rgba(31,2,48,0.06)' : 'rgba(255,255,255,0.06)';
  const trackBg = isLight ? 'rgba(31,2,48,0.06)' : 'rgba(255,255,255,0.08)';

  const tokensCount = report?.tokens.length ?? 0;
  const componentsCount = report ? new Set([...report.components.web, ...report.components.expo]).size : 0;
  const extensionsCount = report?.extensions.length ?? 0;
  const hardcodedCount = report?.hardcoded.length ?? 0;

  // Re-key by screen + variant so the entrance animation replays on every navigation.
  const animKey = `${currentScreen}-${variantParam ?? 'default'}`;

  return (
    <>
      <motion.button
        key={animKey}
        type="button"
        onClick={() => setModalOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: 'flex', flexDirection: 'column', width: '100%',
          padding: 0, borderRadius: 14, overflow: 'hidden',
          background: cardBg,
          border: `1px solid ${hover ? hoverBorder : cardBorder}`,
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: hover
            ? (isLight ? '0 4px 16px rgba(130,10,209,0.10)' : '0 4px 16px rgba(0,0,0,0.3)')
            : (isLight ? '0 1px 2px rgba(0,0,0,0.03)' : '0 1px 2px rgba(0,0,0,0.2)'),
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: 'easeOut' }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px 8px',
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -60 }}
            animate={{ scale: [0, 1.18, 1], rotate: [-60, 5, 0] }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1], times: [0, 0.6, 1] }}
            style={{
              width: 24, height: 24, borderRadius: 7,
              background: isLight ? 'rgba(130,10,209,0.08)' : 'rgba(130,10,209,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield style={{ width: 12, height: 12, color: palette.accent }} />
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: palette.accent,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              lineHeight: 1.2,
            }}>
              Foundation
            </div>
            <div style={{
              fontSize: 10, fontWeight: 500, color: palette.textSecondary,
              lineHeight: 1.3, marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {hardcodedCount === 0 ? 'Zero hardcoded values' : `${hardcodedCount} hardcoded`}
            </div>
          </div>
          <ExternalLink style={{
            width: 11, height: 11,
            color: palette.textSecondary,
            opacity: hover ? 0.9 : 0.35,
            flexShrink: 0,
            transition: 'opacity 0.2s',
          }} />
        </motion.div>

        {/* Compliance bars */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.22, ease: 'easeOut' }}
          style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '8px 12px 10px',
            borderTop: `1px solid ${dividerColor}`,
          }}
        >
          <NuDSComplianceRow label="Web" pct={webPct} available={webHas} palette={palette} trackBg={trackBg} fillDelay={0.35} />
          <NuDSComplianceRow label="Expo" pct={expoPct} available={expoHas} palette={palette} trackBg={trackBg} fillDelay={0.45} />
        </motion.div>

        {/* Metrics grid */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderTop: `1px solid ${dividerColor}`,
            }}
          >
            <MetricCell value={tokensCount} label="Tokens" palette={palette} delay={0.5} />
            <MetricCell value={componentsCount} label="Components" palette={palette} borderLeft={dividerColor} delay={0.58} />
            <MetricCell value={extensionsCount} label="Extensions" palette={palette} borderLeft={dividerColor} delay={0.66} />
          </motion.div>
        )}
      </motion.button>

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

function NuDSComplianceRow({ label, pct, available, palette, trackBg, fillDelay = 0 }: {
  label: string;
  pct: number;
  available: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  trackBg: string;
  /** Delay (in seconds) before the bar starts filling, used for entrance choreography. */
  fillDelay?: number;
}) {
  const color = pctColor(pct, palette.accent, palette.textSecondary, available);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontSize: 10, fontWeight: 600, color: palette.textSecondary,
        width: 32, flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: 4, borderRadius: 2, overflow: 'hidden',
        background: trackBg,
      }}>
        {available && (
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: fillDelay, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: '100%',
              background: color, borderRadius: 2,
            }}
          />
        )}
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, color,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 30, textAlign: 'right', flexShrink: 0,
        opacity: available ? 1 : 0.4,
      }}>
        {available ? `${pct}%` : 'N/A'}
      </span>
    </div>
  );
}

function MetricCell({ value, label, palette, borderLeft, delay = 0 }: {
  value: number;
  label: string;
  palette: ReturnType<typeof useTheme>['palette'];
  borderLeft?: string;
  /** Delay (in seconds) before the count-up starts. */
  delay?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.85,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [count, value, delay]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '7px 4px',
      borderLeft: borderLeft ? `1px solid ${borderLeft}` : 'none',
    }}>
      <motion.span
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontSize: 15, fontWeight: 700, color: palette.textPrimary,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
          display: 'inline-block',
        }}
      >
        {rounded}
      </motion.span>
      <span style={{
        fontSize: 9, fontWeight: 500, color: palette.textSecondary,
        textTransform: 'uppercase', letterSpacing: '0.4px',
        marginTop: 2,
      }}>
        {label}
      </span>
    </div>
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

            {/* Deflators (hardcoded offenses) — tabular, per-platform penalty breakdown */}
            {report.hardcoded.length > 0 && (
              <DeflatorsTable
                offenses={report.hardcoded}
                webPct={webPct}
                expoPct={expoPct}
                webHas={webHas}
                expoHas={expoHas}
                isLight={isLight}
                palette={palette}
                warnColor={warnColor}
                warnBg={warnBg}
              />
            )}

            {report.hardcoded.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke={extColor} strokeWidth="1.5" />
                  <path d="M6 10.5L9 13.5L14 7" stroke={extColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: extColor }}>Zero hardcoded values · 100% / 100%</span>
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

          {/* Author */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: palette.textPrimary }}>
              Created by Julio Ferracini — Design &amp; Product
            </div>
            <div style={{ fontSize: 10, color: palette.textSecondary, marginTop: 2 }}>
              Creator &amp; Maintainer
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/**
 * DeflatorsTable — renders the "hardcoded offenses" section of the Foundation Report
 * as an inline spreadsheet-style breakdown, showing the per-platform penalty each
 * offense triggers and the total that produces the final score.
 *
 * Designed to turn the modal into a mini-roadmap: every row is a concrete
 * "thing to fix" with a measurable score gain.
 */
function DeflatorsTable({
  offenses, webPct, expoPct, webHas, expoHas, isLight, palette, warnColor, warnBg,
}: {
  offenses: HardcodedOffense[];
  webPct: number;
  expoPct: number;
  webHas: boolean;
  expoHas: boolean;
  isLight: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  warnColor: string;
  warnBg: string;
}) {
  const rowBorder = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
  const headerBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const kindChipStyle = (kind: OffenseKind): React.CSSProperties => ({
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px',
    padding: '2px 6px', borderRadius: 4, background: warnBg, color: warnColor,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    display: 'inline-block', minWidth: 42, textAlign: 'center',
  });

  // 5-column grid: kind | value+where | web penalty | expo penalty
  const GRID = '56px 1fr 56px 56px';

  const webTotalPenalty = 100 - webPct;
  const expoTotalPenalty = 100 - expoPct;

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: warnColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
        Deflators · hardcoded offenses
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: GRID, gap: 8,
        padding: '6px 10px', background: headerBg, borderRadius: 6,
        fontSize: 9, fontWeight: 700, color: palette.textSecondary,
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
      }}>
        <span>Kind</span>
        <span>Value · where</span>
        <span style={{ textAlign: 'right' }}>Web</span>
        <span style={{ textAlign: 'right' }}>Expo</span>
      </div>

      {/* Data rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {offenses.map((o, i) => {
          const penalty = PENALTY_PER_UNIT[o.kind];
          const webCell = webHas && o.platforms.includes('web') ? `−${penalty}%` : '—';
          const expoCell = expoHas && o.platforms.includes('expo') ? `−${penalty}%` : '—';
          return (
            <div
              key={`${o.kind}-${o.value}-${i}`}
              style={{
                display: 'grid', gridTemplateColumns: GRID, gap: 8, alignItems: 'start',
                padding: '8px 10px',
                borderBottom: i < offenses.length - 1 ? `1px solid ${rowBorder}` : 'none',
              }}
            >
              <span style={kindChipStyle(o.kind)}>{o.kind}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <code style={{
                  fontSize: 11, fontWeight: 600, color: palette.textPrimary,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {o.value}
                </code>
                <span style={{ fontSize: 10, color: palette.textSecondary, lineHeight: 1.35 }}>
                  {o.where}
                </span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, textAlign: 'right',
                color: webCell === '—' ? palette.textSecondary : warnColor,
                opacity: webCell === '—' ? 0.4 : 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {webCell}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, textAlign: 'right',
                color: expoCell === '—' ? palette.textSecondary : warnColor,
                opacity: expoCell === '—' ? 0.4 : 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {expoCell}
              </span>
            </div>
          );
        })}
      </div>

      {/* Totals footer */}
      <div style={{
        display: 'grid', gridTemplateColumns: GRID, gap: 8,
        padding: '10px 10px 4px',
        borderTop: `1.5px solid ${rowBorder}`,
        marginTop: 2,
      }}>
        <span />
        <span style={{ fontSize: 10, fontWeight: 700, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Total penalty
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, textAlign: 'right',
          color: webHas ? warnColor : palette.textSecondary,
          opacity: webHas ? 1 : 0.4,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {webHas ? `−${webTotalPenalty}%` : '—'}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, textAlign: 'right',
          color: expoHas ? warnColor : palette.textSecondary,
          opacity: expoHas ? 1 : 0.4,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {expoHas ? `−${expoTotalPenalty}%` : '—'}
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: GRID, gap: 8,
        padding: '4px 10px 2px',
      }}>
        <span />
        <span style={{ fontSize: 10, fontWeight: 700, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Foundation score
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700, textAlign: 'right',
          color: pctColor(webPct, palette.accent, palette.textSecondary, webHas),
          fontVariantNumeric: 'tabular-nums',
        }}>
          {webHas ? `${webPct}%` : 'N/A'}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700, textAlign: 'right',
          color: pctColor(expoPct, palette.accent, palette.textSecondary, expoHas),
          fontVariantNumeric: 'tabular-nums',
        }}>
          {expoHas ? `${expoPct}%` : 'N/A'}
        </span>
      </div>

      {/* Methodology note */}
      <div style={{
        marginTop: 10, padding: '8px 10px', borderRadius: 6,
        background: headerBg, fontSize: 10, lineHeight: 1.5, color: palette.textSecondary,
      }}>
        Deflators count <strong>unique values</strong>, not occurrences. Caps per category:
        color/font <code>−30%</code>, spacing/radius <code>−15%</code>, element uncapped. Extensions
        justify custom components but don't excuse hardcodes inside them.
      </div>
    </div>
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
          <span style={{ fontSize: 13, fontWeight: 700, color: pctColor(pct, palette.accent, palette.textSecondary, available) }}>{pct}%</span>
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

