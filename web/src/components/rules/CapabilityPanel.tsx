import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEmulatorConfig } from '../../context/EmulatorConfigContext';
import { LOCALE_FLAGS } from '../../../../shared/types';
import {
  FORMULA_LABELS,
  getMatrixRow,
  SCREEN_KEYS,
  SCREEN_LABELS,
} from '../../../../shared/data/experienceArchitecture';

/**
 * Capability Panel — Emulator side view of the Experience
 * Architecture matrix row for the currently selected use case.
 * Same floating-panel chrome as RulesPanel; content is the single
 * use case's coverage + metadata + experiments, mirroring the
 * editorial row design on the EA page.
 */
export default function CapabilityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const config = useEmulatorConfig();

  const row = useMemo(() => getMatrixRow(config.useCaseId), [config.useCaseId]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 994, background: 'rgba(0,0,0,0.2)' }}
          />
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 360, maxWidth: '92vw', zIndex: 995,
              background: palette.background,
              borderLeft: `1px solid ${palette.border}`,
              display: 'flex', flexDirection: 'column',
              boxShadow: isLight ? '-4px 0 24px rgba(0,0,0,0.08)' : '-4px 0 24px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: `1px solid ${palette.border}`,
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: palette.textPrimary, fontFamily: 'var(--nf-font-display)', letterSpacing: '-0.012em' }}>
                  Capability atlas
                </h3>
                <span style={{ fontSize: 11, color: palette.textSecondary, fontFamily: 'var(--nf-font-mono)', letterSpacing: '0.06em' }}>
                  {row ? row.productLineName.toUpperCase() : 'NO USE CASE SELECTED'}
                </span>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Close"
              >
                <X style={{ width: 14, height: 14, color: palette.textSecondary }} />
              </motion.button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', WebkitOverflowScrolling: 'touch' }}>
              {!row ? (
                <EmptyState />
              ) : (
                <>
                  {/* Use case headline */}
                  <div style={{ marginBottom: 22 }}>
                    <span
                      style={{
                        fontFamily: 'var(--nf-font-mono)',
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: palette.textSecondary,
                      }}
                    >
                      — Flow {row.flowType}
                    </span>
                    <h4
                      style={{
                        margin: '6px 0 6px',
                        fontFamily: 'var(--nf-font-display)',
                        fontSize: 22,
                        fontWeight: 600,
                        letterSpacing: '-0.018em',
                        lineHeight: 1.1,
                        color: palette.textPrimary,
                      }}
                    >
                      {row.useCaseName}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: palette.textSecondary,
                      }}
                    >
                      {row.useCaseDescription}
                    </p>
                  </div>

                  {/* Quick-stat grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    marginBottom: 22,
                  }}>
                    <MetaRow label="Formula" value={FORMULA_LABELS[row.formula]} />
                    <MetaRow label="Experiments" value={String(row.experiments)} />
                    <MetaRow
                      label="Installments"
                      value={`${row.installmentRange.min}–${row.installmentRange.max}`}
                    />
                    <MetaRow label="Interest" value={`${row.interestRateMonthly}% /m`} />
                    <MetaRow
                      label="Max discount"
                      value={`${row.discountPercentageMax}%`}
                    />
                    <MetaRow
                      label="Coverage"
                      value={`${row.enabledScreenCount}/${row.totalScreens}`}
                    />
                  </div>

                  {/* Markets */}
                  <SectionLabel>Markets</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
                    {row.supportedLocales.map((loc) => (
                      <span
                        key={loc}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 999,
                          background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                          fontFamily: 'var(--nf-font-mono)',
                          fontSize: 11,
                          fontWeight: 500,
                          color: palette.textSecondary,
                          letterSpacing: '0.04em',
                        }}
                      >
                        <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>{LOCALE_FLAGS[loc]}</span>
                        {loc.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  {/* Screen coverage checklist */}
                  <SectionLabel>Screen coverage</SectionLabel>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 0,
                    borderTop: `1px solid ${palette.border}`,
                  }}>
                    {SCREEN_KEYS.map((k) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 2px',
                          borderBottom: `1px solid ${palette.border}`,
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: palette.textPrimary, fontWeight: 500 }}>
                          {SCREEN_LABELS[k]}
                        </span>
                        <span
                          aria-hidden
                          className={`nf-page__ea-dot${row.coverage[k] ? ' nf-page__ea-dot--on' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <h5
      style={{
        margin: '0 0 10px',
        fontFamily: 'var(--nf-font-mono)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: palette.textSecondary,
      }}
    >
      {children}
    </h5>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: '10px 12px',
        borderRadius: 10,
        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${palette.border}`,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--nf-font-mono)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: palette.textSecondary,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--nf-font-mono)',
          fontSize: 13,
          fontWeight: 600,
          color: palette.textPrimary,
          letterSpacing: '-0.005em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  const { palette } = useTheme();
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'var(--nf-font-mono)',
          fontSize: 12,
          letterSpacing: '0.06em',
          color: palette.textSecondary,
          lineHeight: 1.6,
        }}
      >
        No use case is currently loaded.
        <br />
        Pick a product line and use case to see its capability row.
      </p>
    </div>
  );
}
