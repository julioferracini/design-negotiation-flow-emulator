/**
 * BDCComplianceBadge — sidebar card for the BDC (Flutter NuDS) report.
 *
 * Visual sibling of the Foundation `NuDSComplianceBadge`: same card shell, same
 * entrance choreography — but fully driven by `useBDCReport`. Today the hook
 * returns a disconnected payload, so the card renders its empty states:
 *   - muted header sub-label ("Not connected")
 *   - single "Flutter" progress row with N/A
 *   - em-dashes on the metrics grid
 *
 * Clicking still opens the modal so the structure is discoverable.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Boxes, ExternalLink } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { usePrototypeLocation } from '../../../hooks/usePrototypeLocation';
import { SCREEN_BLOCK_META } from '../../../../../shared/data/screenVariants';
import { useBDCReport } from './useBDCReport';
import { BDCReportModal } from './BDCReportModal';

type Palette = ReturnType<typeof useTheme>['palette'];
type ScreenSlug = keyof typeof SCREEN_BLOCK_META;

function resolveCurrentScreen(pathname: string): ScreenSlug | null {
  const slug = pathname.split('/').filter(Boolean).pop()?.toLowerCase().replace(/_/g, '-');
  if (!slug) return null;
  for (const [key, meta] of Object.entries(SCREEN_BLOCK_META)) {
    if (meta.path === slug) return key as ScreenSlug;
  }
  return null;
}

interface BDCComplianceBadgeProps {
  palette: Palette;
  isLight: boolean;
}

export function BDCComplianceBadge({ palette, isLight }: BDCComplianceBadgeProps) {
  const { pathname, search } = usePrototypeLocation();
  const currentScreen = resolveCurrentScreen(pathname);
  const report = useBDCReport(currentScreen);
  const [modalOpen, setModalOpen] = useState(false);
  const [hover, setHover] = useState(false);

  const screenTitle = currentScreen ? SCREEN_BLOCK_META[currentScreen]?.title : null;
  const variantParam = new URLSearchParams(search).get('variant');
  const variantLabel = variantParam ? variantParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Default';
  const fullTitle = screenTitle ? `${screenTitle} · ${variantLabel}` : 'Flutter report';

  if (!currentScreen) return null;

  const connected = report.connectionState === 'connected';
  const statusLabel = (() => {
    switch (report.connectionState) {
      case 'connected': return 'Connected';
      case 'loading': return 'Loading…';
      case 'error': return 'Connection error';
      case 'disconnected':
      default: return 'Not connected';
    }
  })();

  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.03)';
  const cardBorder = isLight ? 'rgba(130,10,209,0.14)' : 'rgba(130,10,209,0.22)';
  const hoverBorder = isLight ? 'rgba(130,10,209,0.28)' : 'rgba(130,10,209,0.4)';
  const dividerColor = isLight ? 'rgba(31,2,48,0.06)' : 'rgba(255,255,255,0.06)';
  const trackBg = isLight ? 'rgba(31,2,48,0.06)' : 'rgba(255,255,255,0.08)';

  const pct = report.platform.pct ?? 0;
  const tokensCount = report.platform.tokens.length;
  const componentsCount = report.platform.components.length;
  const extensionsCount = report.platform.extensions.length;

  const animKey = `bdc-${currentScreen}-${variantParam ?? 'default'}`;

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
          marginTop: 10,
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
            <Boxes style={{ width: 12, height: 12, color: palette.accent }} />
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: palette.accent,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              lineHeight: 1.2,
            }}>
              BDC
            </div>
            <div style={{
              fontSize: 10, fontWeight: 500, color: palette.textSecondary,
              lineHeight: 1.3, marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {statusLabel}
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

        {/* Single progress row (Flutter). Mirrors the Foundation rows so the
            two cards read as a family even when this one is empty. */}
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
          <ProgressRow
            label={report.platform.label}
            pct={pct}
            available={connected}
            palette={palette}
            trackBg={trackBg}
          />
        </motion.div>

        {/* Metrics grid */}
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
          <MetricCell value={tokensCount} label="Tokens" connected={connected} palette={palette} />
          <MetricCell value={componentsCount} label="Components" connected={connected} palette={palette} borderLeft={dividerColor} />
          <MetricCell value={extensionsCount} label="Extensions" connected={connected} palette={palette} borderLeft={dividerColor} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {modalOpen && (
          <BDCReportModal
            screenTitle={fullTitle}
            report={report}
            palette={palette}
            isLight={isLight}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ProgressRow({ label, pct, available, palette, trackBg }: {
  label: string;
  pct: number;
  available: boolean;
  palette: Palette;
  trackBg: string;
}) {
  const color = available ? palette.accent : palette.textSecondary;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontSize: 10, fontWeight: 600, color: palette.textSecondary,
        width: 44, flexShrink: 0,
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
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%', background: color, borderRadius: 2 }}
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

function MetricCell({ value, label, connected, palette, borderLeft }: {
  value: number;
  label: string;
  connected: boolean;
  palette: Palette;
  borderLeft?: string;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '7px 4px',
      borderLeft: borderLeft ? `1px solid ${borderLeft}` : 'none',
    }}>
      <span style={{
        fontSize: 15, fontWeight: 700, color: palette.textPrimary,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
        display: 'inline-block',
        opacity: connected ? 1 : 0.55,
      }}>
        {connected ? value : '—'}
      </span>
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
