/**
 * SplitScreen — Main layout with resizable left/right panels (50/50 default).
 *
 * Left: ParameterPanel (use case configuration)
 * Right: PrototypeViewport (iPhone frame with navigable prototype)
 *
 * Theme-aware: applies palette colors from ThemeContext to entire layout.
 */

import { useState } from 'react';
import {
  Panel,
  Group,
  Separator,
} from 'react-resizable-panels';
import { GripVertical, ChevronDown } from 'lucide-react';
import ParameterPanel from './ParameterPanel';
import { SCREEN_BLOCK_META, SCREEN_CONTENT_VARIANTS } from './ParameterPanel';
import PrototypeViewport from './PrototypeViewport';
import { useTheme } from '../../context/ThemeContext';
import { usePrototypeLocation } from '../../hooks/usePrototypeLocation';
import type { ScreenKey } from '../../context/EmulatorConfigContext';

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const PATH_TO_SCREEN: Record<string, ScreenKey> = {};
for (const [key, meta] of Object.entries(SCREEN_BLOCK_META)) {
  PATH_TO_SCREEN[meta.path] = key as ScreenKey;
}

interface SplitScreenProps {
  children: React.ReactNode;
}

export default function SplitScreen({ children }: SplitScreenProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const { pathname, search, navigate } = usePrototypeLocation();
  const [variantDropdownOpen, setVariantDropdownOpen] = useState(false);

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

  const bgMain = isLight ? '#f5f3f7' : palette.background;
  const bgPanel = isLight ? '#f8f7f9' : palette.surface;
  const borderColor = palette.border;
  const textPrimary = palette.textPrimary;
  const gripColor = isLight ? 'rgba(31,2,48,0.25)' : palette.textSecondary;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: bgMain,
      transition: 'background 0.3s ease',
    }}>
      <Group
        orientation="horizontal"
        defaultLayout={{ left: 1, right: 1 }}
        style={{ display: 'flex', height: '100%', width: '100%' }}
      >
        {/* Left Panel — Configuration */}
        <Panel id="left" minSize={25} style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: bgPanel,
            transition: 'background 0.3s ease',
          }}>
            <div style={{ padding: '20px 32px 14px 72px' }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: textPrimary,
                  margin: 0,
                  transition: 'color 0.3s ease',
                }}
              >
                Emulator
              </h1>
              <p style={{
                fontSize: 12,
                color: isLight ? 'rgba(31,2,48,0.5)' : 'rgba(255,255,255,0.45)',
                margin: '4px 0 0',
                lineHeight: 1.4,
                transition: 'color 0.3s ease',
              }}>
                Use case prototypes with financial and regulatory parameters
              </p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ParameterPanel />
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <Separator
          style={{
            width: 1,
            background: borderColor,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'col-resize',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 40,
            borderRadius: 6,
            background: isLight ? '#fff' : palette.surfaceSecondary,
            border: `1px solid ${borderColor}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
          }}>
            <GripVertical style={{
              width: 14,
              height: 14,
              color: gripColor,
              transition: 'color 0.3s ease',
            }} />
          </div>
        </Separator>

        {/* Right Panel — Prototype */}
        <Panel id="right" minSize={30} style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: bgMain,
            transition: 'background 0.3s ease',
          }}>
            <div style={{ padding: '20px 32px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.3px',
                color: textPrimary,
                margin: 0,
                transition: 'color 0.3s ease',
              }}>
                Prototype
              </h1>

              {screenTitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'variantBadgeFade 0.35s ease-out' }}>
                  <div style={{
                    padding: '4px 12px', borderRadius: 12,
                    background: isLight ? palette.surface : palette.surfaceSecondary,
                    border: `1px solid ${palette.border}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>{screenTitle}</span>
                  </div>

                  {activeVariant && (
                    <>
                      <span style={{ fontSize: 11, color: palette.textSecondary }}>·</span>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => hasMultipleVariants && setVariantDropdownOpen(!variantDropdownOpen)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '4px 12px', borderRadius: 12,
                            background: isLight ? palette.accentSubtle : withAlpha(palette.accent, 0.12),
                            border: `1px solid ${withAlpha(palette.accent, 0.18)}`,
                            cursor: hasMultipleVariants ? 'pointer' : 'default',
                            fontSize: 12, fontWeight: 600, color: palette.accent,
                          }}
                        >
                          {activeVariant.label}
                          {hasMultipleVariants && <ChevronDown style={{ width: 12, height: 12, color: palette.accent }} />}
                        </button>

                        {variantDropdownOpen && variants && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setVariantDropdownOpen(false)} />
                            <div style={{
                              position: 'absolute', top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)',
                              background: isLight ? '#fff' : palette.surfaceSecondary,
                              borderRadius: 12, border: `1px solid ${palette.border}`,
                              boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.4)',
                              padding: 4, zIndex: 50, minWidth: 200, whiteSpace: 'nowrap',
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
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                                      width: '100%', padding: '8px 12px', borderRadius: 8,
                                      border: 'none', background: isActive ? palette.accentSubtle : 'transparent',
                                      cursor: 'pointer', fontSize: 12,
                                      fontWeight: isActive ? 600 : 400,
                                      color: isActive ? palette.accent : palette.textPrimary,
                                      textAlign: 'left',
                                    }}
                                  >
                                    <span>{v.label}</span>
                                    <span style={{ fontSize: 10, color: palette.textSecondary, fontFamily: 'monospace' }}>{v.version}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PrototypeViewport>
                {children}
              </PrototypeViewport>
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
