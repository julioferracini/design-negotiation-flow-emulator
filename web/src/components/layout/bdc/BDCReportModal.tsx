/**
 * BDCReportModal — "Flutter NuDS report" dialog.
 *
 * Visual sibling of the Foundation `NuDSReportModal` (same shell, spacing and
 * typography), but fully driven by a `BDCReport`. When disconnected, every
 * section renders its empty/placeholder state; when connected, the same
 * components render real lists — no extra UI work needed.
 */

import { motion } from 'motion/react';
import { Boxes, ExternalLink } from 'lucide-react';
import type { useTheme } from '../../../context/ThemeContext';
import type { BDCReport, BDCRepoStatus } from './types';

type Palette = ReturnType<typeof useTheme>['palette'];

interface BDCReportModalProps {
  screenTitle: string;
  report: BDCReport;
  palette: Palette;
  isLight: boolean;
  onClose: () => void;
}

export function BDCReportModal({ screenTitle, report, palette, isLight, onClose }: BDCReportModalProps) {
  const modalBg = isLight ? '#FFFFFF' : '#1A1A1C';
  const sectionBg = isLight ? '#F8F6F8' : '#222224';
  const chipBg = isLight ? 'rgba(130,10,209,0.07)' : 'rgba(130,10,209,0.12)';
  const tokenBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)';
  const mutedColor = palette.textSecondary;
  const { platform, connectionState } = report;
  const disconnected = connectionState !== 'connected';

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
                <Boxes style={{ width: 16, height: 16, color: palette.accent }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: palette.accent, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Flutter NuDS report
                </span>
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

          {/* Platform card — single column (Flutter only, for now). */}
          <div style={{ marginBottom: 16 }}>
            <PlatformCard
              label={platform.label}
              connected={platform.connected}
              pct={platform.pct}
              components={platform.components}
              chipBg={chipBg}
              sectionBg={sectionBg}
              palette={palette}
            />
          </div>

          {/* Foundation Layer (empty/connected) */}
          <div style={{ padding: 18, borderRadius: 14, background: sectionBg, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.accent, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 14 }}>
              Foundation Layer
            </div>

            {platform.tokens.length > 0 ? (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Design Tokens
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {platform.tokens.map((tk) => (
                    <span key={tk} style={{ fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 6, background: tokenBg, color: mutedColor, fontFamily: 'monospace' }}>{tk}</span>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyLine color={mutedColor}>
                {disconnected ? 'No foundation data yet · awaiting BDC service' : 'No tokens reported'}
              </EmptyLine>
            )}

            {platform.extensions.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Custom Extensions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {platform.extensions.map((ext) => (
                    <div key={ext} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: mutedColor, lineHeight: 1.4 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: mutedColor, flexShrink: 0, marginTop: 5 }} />
                      {ext}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Repo links — fully driven by `report.repos`. Disconnected repos
              render as disabled chips with a "pending integration" sublabel. */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {report.repos.map((repo) => (
              <RepoLink key={repo.id} repo={repo} palette={palette} sectionBg={sectionBg} isLight={isLight} />
            ))}
          </div>

          {/* Author footer — mirrors the Foundation modal for visual parity. */}
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

function EmptyLine({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ fontSize: 11, color, fontStyle: 'italic', opacity: 0.75, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function PlatformCard({ label, connected, pct, components, chipBg, sectionBg, palette }: {
  label: string;
  connected: boolean;
  pct: number | null;
  components: string[];
  chipBg: string;
  sectionBg: string;
  palette: Palette;
}) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: sectionBg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: palette.accent, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
        {connected && pct !== null ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: palette.accent }}>{pct}%</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, opacity: 0.5 }}>N/A</span>
        )}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Components</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {components.length > 0 ? components.map((c) => (
          <span key={c} style={{ fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 6, background: chipBg, color: palette.accent }}>{c}</span>
        )) : (
          <span style={{ fontSize: 11, color: palette.textSecondary, opacity: 0.5, fontStyle: 'italic' }}>
            {connected ? 'No components reported' : 'Not connected yet'}
          </span>
        )}
      </div>
    </div>
  );
}

function RepoLink({ repo, palette, sectionBg, isLight }: {
  repo: BDCRepoStatus;
  palette: Palette;
  sectionBg: string;
  isLight: boolean;
}) {
  const disabled = !repo.connected;
  const commonStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
    borderRadius: 12, background: sectionBg, textDecoration: 'none',
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: disabled
      ? `1px dashed ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`
      : '1px solid transparent',
  };

  const body = (
    <>
      <GitIcon size={20} color={palette.textSecondary} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>
          {repo.label}
          {disabled && (
            <span style={{
              marginLeft: 6, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.4px', textTransform: 'uppercase',
              padding: '1px 5px', borderRadius: 4,
              background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
              color: palette.textSecondary,
            }}>
              Desconectado
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: palette.textSecondary, marginTop: 1 }}>{repo.sublabel}</div>
      </div>
      <ExternalLink style={{ width: 12, height: 12, color: palette.textSecondary, opacity: 0.4 }} />
    </>
  );

  if (disabled || !repo.url) {
    return <div aria-disabled="true" style={commonStyle}>{body}</div>;
  }
  return (
    <a href={repo.url} target="_blank" rel="noopener noreferrer" style={commonStyle}>
      {body}
    </a>
  );
}

function GitIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
