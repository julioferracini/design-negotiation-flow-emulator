/**
 * PrototypeViewport — Responsive iPhone-like frame with device resolution selector.
 *
 * Auto-scales the device frame to fit the available panel space.
 * User can switch between common device resolutions.
 * Theme-aware: applies palette colors from ThemeContext.
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

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
        gap: 12,
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

          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            ['--safe-area-top' as string]: `${selectedDevice.safeAreaTop}px`,
          }}>
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
    </div>
  );
}
