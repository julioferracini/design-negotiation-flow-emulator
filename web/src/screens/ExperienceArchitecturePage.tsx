import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PRODUCT_LINES } from '../../../shared/config/productLines';
import { LOCALE_FLAGS, type ScreenVisibility } from '../../../shared/types';

const SCREEN_KEYS: (keyof ScreenVisibility)[] = [
  'offerHub', 'inputValue', 'simulation', 'suggested',
  'dueDate', 'summary', 'terms', 'pin', 'loading', 'feedback',
];

const SCREEN_LABELS: Record<keyof ScreenVisibility, string> = {
  offerHub: 'Offer Hub',
  inputValue: 'Input Value',
  simulation: 'Simulation',
  suggested: 'Suggested',
  dueDate: 'Due Date',
  summary: 'Summary',
  terms: 'Terms',
  pin: 'PIN',
  loading: 'Loading',
  feedback: 'Feedback',
};

const FORMULA_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  flat_discount: { label: 'Flat', color: '#B45309', bg: '#FFF3E0' },
  price: { label: 'Price', color: '#1565C0', bg: '#E3F2FD' },
  sac: { label: 'SAC', color: '#2E7D32', bg: '#E8F5E9' },
};

const FORMULA_LABELS_DARK: Record<string, { color: string; bg: string }> = {
  flat_discount: { color: '#FFB74D', bg: 'rgba(255,152,0,0.15)' },
  price: { color: '#64B5F6', bg: 'rgba(33,150,243,0.15)' },
  sac: { color: '#81C784', bg: 'rgba(76,175,80,0.15)' },
};

const PL_COLORS: Record<string, string> = {
  'debt-resolution': '#820AD1',
  'lending': '#1565C0',
  'credit-card': '#2E7D32',
};

const MOCK_EXPERIMENTS: Record<string, number> = {
  'dr-mdr-br': 3,
  'dr-late-lending-short': 1,
  'dr-late-lending-long': 2,
  'dr-cc-long-agreements': 0,
  'dr-fp-br': 1,
  'dr-rdp-br': 0,
  'lending-inss-br': 2,
  'lending-payroll-br': 1,
  'lending-siape': 0,
  'lending-military': 0,
  'lending-personal': 1,
  'cc-bill-installment-mx': 2,
  'cc-refinancing-co': 1,
};

interface ExperienceArchitecturePageProps {
  onNavigate: (path: string) => void;
}

export default function ExperienceArchitecturePage({ onNavigate }: ExperienceArchitecturePageProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const [mapExpanded, setMapExpanded] = useState(true);

  const stats = useMemo(() => {
    const allUC = PRODUCT_LINES.flatMap((pl) => pl.useCases);
    const locales = new Set(allUC.flatMap((uc) => uc.supportedLocales));
    const formulas = new Set(allUC.map((uc) => uc.defaults.formula).filter(Boolean));
    return {
      useCases: allUC.length,
      productLines: PRODUCT_LINES.length,
      markets: locales.size,
      formulas: formulas.size,
    };
  }, []);

  return (
    <div
      className="nf-page nf-page--flex-col"
      data-mode={mode}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 48px 32px 72px', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <h1 style={{
            fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0,
            color: 'var(--nf-text)', transition: 'color 0.3s',
          }}>
            Experience Architecture
          </h1>
          <p style={{
            fontSize: 12, margin: '4px 0 0', lineHeight: 1.4,
            color: 'var(--nf-text-tertiary)',
          }}>
            How each use case leverages the framework — visual map and capability matrix across all product lines.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {[
              `${stats.useCases} use cases`,
              `${stats.productLines} product lines`,
              `${stats.markets} markets`,
              `${stats.formulas} amortization formulas`,
            ].map((label) => (
              <span
                key={label}
                className="nf-page__chip"
                style={{ background: 'var(--nf-bg)', color: 'var(--nf-text-secondary)' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* Use Case Map — collapsible */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setMapExpanded(!mapExpanded)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px',
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                color: 'var(--nf-text-secondary)',
              }}>
                Use Case Map
              </span>
              <span
                className="nf-page__badge nf-page__badge--neutral"
              >
                {stats.useCases}
              </span>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--nf-text-secondary)',
                  transform: mapExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>

            <AnimatePresence>
              {mapExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {PRODUCT_LINES.map((pl) => (
                      <ProductLineGroup
                        key={pl.id}
                        productLine={pl}
                        palette={palette}
                        isLight={isLight}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--nf-border)', margin: '8px 0 24px' }} />

          {/* Capability Matrix */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
              color: 'var(--nf-text-secondary)', margin: '0 0 12px',
            }}>
              Capability Matrix
            </h2>
            <CapabilityMatrix palette={palette} isLight={isLight} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

type Palette = ReturnType<typeof useTheme>['palette'];

function ProductLineGroup({ productLine, palette, isLight, onNavigate }: {
  productLine: typeof PRODUCT_LINES[number];
  palette: Palette;
  isLight: boolean;
  onNavigate: (path: string) => void;
}) {
  const plColor = PL_COLORS[productLine.id] ?? palette.accent;

  return (
    <div style={{
      borderRadius: 14, border: '1px solid var(--nf-border)',
      background: 'var(--nf-bg-secondary)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--nf-border)',
        background: `${plColor}08`,
      }}>
        <div style={{ width: 3, height: 16, borderRadius: 1.5, background: plColor }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--nf-text)', flex: 1 }}>
          {productLine.name}
        </span>
        <span
          className="nf-page__badge nf-page__badge--neutral"
        >
          {productLine.useCases.length} use cases
        </span>
      </div>
      <div style={{
        padding: 12, display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10,
      }}>
        {productLine.useCases.map((uc, i) => {
          const formula = uc.defaults.formula ?? 'price';
          const fl = isLight ? FORMULA_LABELS[formula] : { ...FORMULA_LABELS[formula], ...FORMULA_LABELS_DARK[formula] };
          const enabledScreens = SCREEN_KEYS.filter((k) => uc.screens[k]).length;

          return (
            <motion.button
              key={uc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              onClick={() => onNavigate(`/emulator?uc=${uc.id}`)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              style={{
                padding: '12px 14px', borderRadius: 10, border: '1px solid var(--nf-border)',
                background: 'var(--nf-bg-elevated)', cursor: 'pointer', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 6,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nf-text)', lineHeight: 1.3 }}>
                  {uc.name}
                </span>
                <ArrowUpRight size={11} style={{ color: 'var(--nf-text-secondary)', flexShrink: 0 }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <span
                  className="nf-page__chip"
                  style={{
                    fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                    background: fl.bg, color: fl.color,
                  }}
                >
                  {fl.label}
                </span>
                <span
                  className="nf-page__chip"
                  style={{
                    fontSize: 8, textTransform: 'uppercase',
                    background: 'var(--nf-bg)', color: 'var(--nf-text-secondary)',
                  }}
                >
                  Flow {uc.flowType}
                </span>
                <span
                  className="nf-page__chip"
                  style={{
                    fontSize: 8,
                    background: 'var(--nf-bg)', color: 'var(--nf-text-secondary)',
                  }}
                >
                  {enabledScreens}/{SCREEN_KEYS.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {uc.supportedLocales.map((loc) => (
                  <span key={loc} style={{ fontSize: 12 }}>{LOCALE_FLAGS[loc]}</span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function CapabilityMatrix({ palette, isLight }: { palette: Palette; isLight: boolean }) {
  const totalCols = 1 + 1 + 1 + SCREEN_KEYS.length + 1 + 3;

  return (
    <div className="nf-page__table-wrap">
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="nf-page__table" style={{ minWidth: 1100, tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', position: 'sticky', left: 0, zIndex: 3, minWidth: 200 }}>
                Use Case
              </th>
              <th>Formula</th>
              <th>Locales</th>
              {SCREEN_KEYS.map((k) => (
                <th key={k}>{SCREEN_LABELS[k]}</th>
              ))}
              <th>Experiments</th>
              <th>Installments</th>
              <th>Interest</th>
              <th>Discount</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCT_LINES.map((pl) => {
              const plColor = PL_COLORS[pl.id] ?? palette.accent;
              return [
                <tr key={`group-${pl.id}`}>
                  <td
                    colSpan={totalCols}
                    style={{
                      padding: '10px 14px', fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: 0.8,
                      color: plColor,
                      background: `${plColor}06`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 3, height: 12, borderRadius: 1.5, background: plColor }} />
                      {pl.name}
                    </div>
                  </td>
                </tr>,
                ...pl.useCases.map((uc) => {
                  const formula = uc.defaults.formula ?? 'price';
                  const fl = isLight ? FORMULA_LABELS[formula] : { ...FORMULA_LABELS[formula], ...FORMULA_LABELS_DARK[formula] };
                  const d = uc.defaults;
                  const experiments = MOCK_EXPERIMENTS[uc.id] ?? 0;
                  return (
                    <tr key={uc.id}>
                      <td style={{
                        textAlign: 'left', fontWeight: 600, color: 'var(--nf-text)',
                        position: 'sticky', left: 0, zIndex: 1,
                        background: 'var(--nf-bg-secondary)',
                      }}>
                        {uc.name}
                      </td>
                      <td>
                        <span
                          className="nf-page__chip"
                          style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            background: fl.bg, color: fl.color,
                          }}
                        >
                          {fl.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          {uc.supportedLocales.map((loc) => (
                            <span key={loc} style={{ fontSize: 12 }}>{LOCALE_FLAGS[loc]}</span>
                          ))}
                        </div>
                      </td>
                      {SCREEN_KEYS.map((k) => (
                        <td key={k}>
                          <div style={{
                            width: 8, height: 8, borderRadius: 4, margin: '0 auto',
                            background: uc.screens[k] ? palette.accent : 'transparent',
                            border: uc.screens[k] ? 'none' : '1.5px solid var(--nf-border-strong)',
                          }} />
                        </td>
                      ))}
                      <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: experiments > 0 ? palette.accent : 'var(--nf-text-secondary)' }}>
                        {experiments}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                        {d.installmentRange.min}–{d.installmentRange.max}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                        {d.interestRateMonthly}%
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                        {d.discountPercentageMax}%
                      </td>
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
