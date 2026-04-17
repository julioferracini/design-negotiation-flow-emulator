import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PRODUCT_LINES } from '../../../shared/config/productLines';
import { LOCALE_FLAGS } from '../../../shared/types';
import {
  buildMatrixRows,
  FORMULA_LABELS,
  getExperienceStats,
  PRODUCT_LINE_BRAND,
  SCREEN_KEYS,
  SCREEN_LABELS,
  type ExperienceMatrixRow,
} from '../../../shared/data/experienceArchitecture';

/* ═══════════════════════════════════════════════════════════════════ */
/*  Motion variants                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const EA_CSS = `
  .ea-shell {
    position: relative; z-index: 1;
    width: 100%; height: 100%;
    overflow: auto; background: var(--nf-bg);
  }

  .ea-fold { padding-top: 96px; padding-bottom: 96px; }

  .ea-fold-foot {
    margin-top: 56px;
    padding-top: 28px;
    border-top: 1px solid var(--nf-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--nf-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--nf-text-tertiary);
  }

  @media (max-width: 700px) {
    .ea-fold { padding-top: 56px; padding-bottom: 56px; }
  }
`;

interface ExperienceArchitecturePageProps {
  onNavigate: (path: string) => void;
}

export default function ExperienceArchitecturePage({ onNavigate }: ExperienceArchitecturePageProps) {
  const { mode } = useTheme();

  const shellRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const [subView, setSubView] = useState<'table' | null>(null);
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);

  const stats = useMemo(() => getExperienceStats(), []);
  const rows = useMemo(() => buildMatrixRows(), []);

  const groupedRows = useMemo(() => {
    return PRODUCT_LINES.map((pl) => ({
      id: pl.id,
      name: pl.name,
      rows: rows.filter((r) => r.productLineId === pl.id),
    }));
  }, [rows]);

  /* ───── Scroll-linked scrubs on section heads ───── */

  const { scrollYProgress: spLines } = useScroll({
    target: linesRef,
    container: shellRef,
    offset: ['start end', 'end start'],
  });
  const spLinesSmooth = useSpring(spLines, { stiffness: 60, damping: 22, mass: 0.6 });
  const linesHeadY = useTransform(spLinesSmooth, [0, 0.25, 0.75, 1], [40, 0, 0, -20]);
  const linesHeadScale = useTransform(spLinesSmooth, [0, 0.25, 0.75, 1], [0.92, 1, 1, 0.96]);

  const { scrollYProgress: spMatrix } = useScroll({
    target: matrixRef,
    container: shellRef,
    offset: ['start end', 'end start'],
  });
  const spMatrixSmooth = useSpring(spMatrix, { stiffness: 60, damping: 22, mass: 0.6 });
  const matrixHeadY = useTransform(spMatrixSmooth, [0, 0.25, 0.75, 1], [40, 0, 0, -20]);
  const matrixHeadScale = useTransform(spMatrixSmooth, [0, 0.25, 0.75, 1], [0.92, 1, 1, 0.96]);

  const { scrollYProgress: spHero } = useScroll({
    target: heroRef,
    container: shellRef,
    offset: ['start start', 'end start'],
  });
  const spHeroSmooth = useSpring(spHero, { stiffness: 60, damping: 22, mass: 0.6 });
  const heroTitleY = useTransform(spHeroSmooth, [0, 1], [0, -40]);

  /* ───── Handlers ───── */

  const handleRowClick = useCallback(
    (row: ExperienceMatrixRow) => {
      onNavigate(`/emulator?uc=${row.useCaseId}&view=matrix`);
    },
    [onNavigate],
  );

  const scrollToMatrix = useCallback(
    (lineId: string | null) => {
      setFocusedLineId(lineId);
      const target = matrixRef.current;
      const shell = shellRef.current;
      if (!target || !shell) return;
      shell.scrollTo({ top: target.offsetTop - 40, behavior: 'smooth' });
    },
    [],
  );

  const openTable = useCallback(() => {
    setSubView('table');
  }, []);

  const closeTable = useCallback(() => {
    setSubView(null);
  }, []);

  return (
    <div data-mode={mode} className="nf-page">
      <style>{EA_CSS}</style>

      <AnimatePresence mode="wait">
        {subView === 'table' ? (
          /* ═══ Sub-view: Comparison Table ═══ */
          <motion.div
            key="table"
            className="ea-shell"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="nf-page__ea-back-bar">
              <button type="button" onClick={closeTable}>
                <ArrowLeft size={14} strokeWidth={2} />
                Experience Architecture
              </button>
              <span className="nf-page__ea-back-bar-sep">/</span>
              <span>Capability Matrix</span>
            </div>

            <section className="ea-fold nf-page__container">
              <div className="nf-page__section-head">
                <div className="nf-page__section-head-left">
                  <span className="nf-page__eyebrow">
                    Table · {String(stats.useCases).padStart(2, '0')} use cases
                  </span>
                  <h2 className="nf-page__section-title">
                    Capability{' '}
                    <span className="nf-page__hero-emph">matrix</span>.
                  </h2>
                </div>
                <p className="nf-page__section-desc">
                  Full comparison grid across all use cases. Each column
                  is a building block screen; compare coverage at a glance.
                </p>
              </div>

              <div className="nf-page__ea-table-wrap">
                <table className="nf-page__ea-table">
                  <thead>
                    <tr>
                      <th className="nf-page__ea-table-th nf-page__ea-table-th--sticky">Use case</th>
                      <th className="nf-page__ea-table-th">Line</th>
                      <th className="nf-page__ea-table-th">Flow</th>
                      {SCREEN_KEYS.map((k) => (
                        <th key={k} className="nf-page__ea-table-th nf-page__ea-table-th--screen">
                          {SCREEN_LABELS[k]}
                        </th>
                      ))}
                      <th className="nf-page__ea-table-th">Formula</th>
                      <th className="nf-page__ea-table-th">Rate</th>
                      <th className="nf-page__ea-table-th">Discount</th>
                      <th className="nf-page__ea-table-th">Markets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRows.map((group) => (
                      group.rows.map((row, idx) => (
                        <tr
                          key={row.useCaseId}
                          className="nf-page__ea-table-row"
                          onClick={() => handleRowClick(row)}
                        >
                          <td className="nf-page__ea-table-td nf-page__ea-table-td--name">
                            <span className="nf-page__ea-table-td-index">{String(idx + 1).padStart(2, '0')}</span>
                            {row.useCaseName}
                          </td>
                          <td className="nf-page__ea-table-td nf-page__ea-table-td--mono">{row.productLineName}</td>
                          <td className="nf-page__ea-table-td nf-page__ea-table-td--mono">{row.flowType}</td>
                          {SCREEN_KEYS.map((k) => (
                            <td key={k} className="nf-page__ea-table-td nf-page__ea-table-td--dot">
                              <span className={`nf-page__ea-dot${row.coverage[k] ? ' nf-page__ea-dot--on' : ''}`} />
                            </td>
                          ))}
                          <td className="nf-page__ea-table-td nf-page__ea-table-td--mono">{FORMULA_LABELS[row.formula]}</td>
                          <td className="nf-page__ea-table-td nf-page__ea-table-td--mono">{row.interestRateMonthly}%</td>
                          <td className="nf-page__ea-table-td nf-page__ea-table-td--mono">{row.discountPercentageMax}%</td>
                          <td className="nf-page__ea-table-td">
                            <span className="nf-page__video-row-locales">
                              {row.supportedLocales.map((loc) => (
                                <span key={loc}>{LOCALE_FLAGS[loc]}</span>
                              ))}
                            </span>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ea-fold-foot">
                <span>— End of matrix</span>
                <button type="button" className="nf-page__ea-cta-link" onClick={closeTable}>
                  <ArrowLeft size={13} strokeWidth={2} />
                  Back to overview
                </button>
              </div>
            </section>
          </motion.div>
        ) : (
          /* ═══ Main overview ═══ */
          <motion.div
            key="overview"
            ref={shellRef}
            className="ea-shell"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* ═══ Fold 1 — Hero Intro ═══ */}
            <section ref={heroRef} className="ea-fold nf-page__container nf-page__ea-hero">
              <div className="nf-page__ea-hero-head">
                <div className="nf-page__ea-hero-head-left">
                  <motion.span
                    className="nf-page__eyebrow"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    Atlas · Coverage map
                  </motion.span>
                  <motion.h1
                    className="nf-page__ea-hero-title"
                    style={{ y: heroTitleY }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                  >
                    Map the{' '}
                    <span className="nf-page__hero-emph">flow</span>.
                  </motion.h1>
                </div>
                <motion.p
                  className="nf-page__ea-hero-desc"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
                >
                  Every product line and use case we support, indexed. Browse
                  the architecture or jump straight into a flow.
                </motion.p>
              </div>

              <motion.div
                className="nf-page__ea-stat-rail"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
              >
                <StatPill value={String(stats.productLines).padStart(2, '0')} label="product lines" />
                <StatPill value={String(stats.useCases).padStart(2, '0')} label="use cases" />
                <StatPill value={String(stats.screens).padStart(2, '0')} label="screens" />
                <StatPill value={String(stats.locales).padStart(2, '0')} label="markets" />
                <StatPill value={String(stats.formulas).padStart(2, '0')} label="formulas" />
              </motion.div>
            </section>

            {/* ═══ Fold 2 — Product Lines (bento triple) ═══ */}
            <section ref={linesRef} className="ea-fold nf-page__container">
              <div className="nf-page__section-head">
                <div className="nf-page__section-head-left">
                  <motion.span
                    className="nf-page__eyebrow nf-page__eyebrow--sticky"
                    style={{ y: linesHeadY, scale: linesHeadScale }}
                  >
                    Index · {String(PRODUCT_LINES.length).padStart(2, '0')} lines
                  </motion.span>
                  <motion.h2
                    className="nf-page__section-title"
                    style={{ y: linesHeadY, scale: linesHeadScale }}
                  >
                    Product{' '}
                    <span className="nf-page__hero-emph">lines</span>.
                  </motion.h2>
                </div>
                <p className="nf-page__section-desc">
                  Each line groups related use cases. Pick one to drill into
                  its capability rows below, or jump straight to a use case.
                </p>
              </div>

              <div className="nf-page__feature-grid nf-page__feature-grid--triple">
                {PRODUCT_LINES.map((pl, i) => {
                  const brand = PRODUCT_LINE_BRAND[pl.id];
                  const ucCount = pl.useCases.length;
                  const isFocused = focusedLineId === pl.id;
                  return (
                    <ProductLineCard
                      key={pl.id}
                      index={i}
                      name={pl.name}
                      useCaseCount={ucCount}
                      useCaseNames={pl.useCases.map((uc) => uc.name)}
                      image={brand?.image ?? '/brand/snowball.png'}
                      teaser={brand?.teaser ?? pl.description}
                      focused={isFocused}
                      anyFocused={focusedLineId !== null}
                      onClick={() => scrollToMatrix(isFocused ? null : pl.id)}
                    />
                  );
                })}
              </div>

              <div className="ea-fold-foot">
                <span>— NF / Atlas</span>
                <span>Browse the architecture.</span>
              </div>
            </section>

            {/* ═══ Fold 3 — Capability Matrix (editorial list) ═══ */}
            <section ref={matrixRef} className="ea-fold nf-page__container">
              <div className="nf-page__section-head">
                <div className="nf-page__section-head-left">
                  <motion.span
                    className="nf-page__eyebrow nf-page__eyebrow--sticky"
                    style={{ y: matrixHeadY, scale: matrixHeadScale }}
                  >
                    Matrix · {String(stats.useCases).padStart(2, '0')} use cases
                  </motion.span>
                  <motion.h2
                    className="nf-page__section-title"
                    style={{ y: matrixHeadY, scale: matrixHeadScale }}
                  >
                    Capability{' '}
                    <span className="nf-page__hero-emph">atlas</span>.
                  </motion.h2>
                </div>
                <p className="nf-page__section-desc">
                  Every use case with its formula, markets and screen
                  coverage. Click a row to open it in the Emulator.
                </p>
              </div>

              <div className="nf-page__video-list">
                {groupedRows.map((group) => {
                  const groupDim = focusedLineId !== null && focusedLineId !== group.id;
                  return (
                    <div key={group.id}>
                      <h3 className="nf-page__ea-line-header">
                        <span className="nf-page__ea-line-header-name">
                          {group.name}
                        </span>
                        <span className="nf-page__ea-line-header-count">
                          {String(group.rows.length).padStart(2, '0')} use cases
                        </span>
                      </h3>
                      {group.rows.map((row, idx) => (
                        <CapabilityRow
                          key={row.useCaseId}
                          row={row}
                          index={idx}
                          dim={groupDim}
                          onClick={() => handleRowClick(row)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="ea-fold-foot">
                <span>— End of atlas</span>
                <button type="button" className="nf-page__ea-cta-link" onClick={openTable}>
                  Open Comparison Table
                  <ArrowUpRight size={13} strokeWidth={2} />
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Stat Pill                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <span className="nf-page__ea-stat-pill">
      <span className="nf-page__ea-stat-pill-value">{value}</span>
      <span>{label}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Product Line Card — reuses .nf-page__feature anatomy             */
/* ═══════════════════════════════════════════════════════════════════ */

function ProductLineCard({
  index,
  name,
  useCaseCount,
  useCaseNames,
  image,
  teaser,
  focused,
  anyFocused,
  onClick,
}: {
  index: number;
  name: string;
  useCaseCount: number;
  useCaseNames: string[];
  image: string;
  teaser: string;
  focused: boolean;
  anyFocused: boolean;
  onClick: () => void;
}) {
  const base = import.meta.env.BASE_URL;
  const [isHover, setIsHover] = useState(false);
  const rotateSign = index % 2 === 0 ? 1 : -1;
  const dim = anyFocused && !focused;

  return (
    <motion.button
      type="button"
      className="nf-page__feature"
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      initial={{ opacity: 0, y: 48, rotate: rotateSign * 1.2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
      style={{ opacity: dim ? 0.4 : 1 }}
    >
      <div className="nf-page__feature-float">
        <div className="nf-page__feature-thumb">
          <img
            src={`${base}${image.replace(/^\//, '')}`}
            alt=""
            loading="lazy"
          />
        </div>

        <motion.div
          className="nf-page__feature-arrow"
          aria-hidden
          animate={{ rotate: isHover ? 0 : -8 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <ArrowUpRight size={17} strokeWidth={1.8} />
        </motion.div>

        <div className="nf-page__feature-body">
          <div className="nf-page__feature-meta">
            <span className="nf-page__feature-meta-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden>·</span>
            <span className="nf-page__feature-meta-status--ready">
              {useCaseCount} use cases
            </span>
          </div>
          <h3 className="nf-page__feature-title">{name}</h3>
          <p className="nf-page__feature-desc">{teaser}</p>
          <p
            className="nf-page__feature-desc"
            style={{ marginTop: 2, fontFamily: 'var(--nf-font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--nf-text-tertiary)' }}
          >
            {useCaseNames.slice(0, 3).join(' · ')}
            {useCaseNames.length > 3 ? ` · +${useCaseNames.length - 3} more` : ''}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Capability Row — reuses .nf-page__video-row anatomy              */
/* ═══════════════════════════════════════════════════════════════════ */

function CapabilityRow({
  row,
  index,
  dim,
  onClick,
}: {
  row: ExperienceMatrixRow;
  index: number;
  dim: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className={`nf-page__video-row nf-page__video-row--matrix${dim ? ' nf-page__video-row--dim' : ''}`}
      initial={{ opacity: 0, x: -28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: EASE }}
      onClick={onClick}
    >
      <span className="nf-page__video-row-index">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="nf-page__video-row-linebadge">
        Flow {row.flowType}
      </span>
      <span className="nf-page__video-row-body">
        <h3 className="nf-page__video-row-title">{row.useCaseName}</h3>
        <span className="nf-page__video-row-submeta">
          {row.enabledScreenCount}/{row.totalScreens} screens · {row.experiments} experiments ·{' '}
          {row.interestRateMonthly}% i.m. · up to {row.discountPercentageMax}% off
        </span>
      </span>
      <span className="nf-page__ea-coverage" aria-label="Screen coverage">
        {SCREEN_KEYS.map((k) => (
          <span
            key={k}
            className={`nf-page__ea-dot${row.coverage[k] ? ' nf-page__ea-dot--on' : ''}`}
            data-label={SCREEN_LABELS[k]}
          />
        ))}
      </span>
      <span className="nf-page__video-row-soon" aria-label={`Formula: ${FORMULA_LABELS[row.formula]}`}>
        {FORMULA_LABELS[row.formula]}
      </span>
      <span className="nf-page__video-row-locales" aria-hidden>
        {row.supportedLocales.map((loc) => (
          <span key={loc}>{LOCALE_FLAGS[loc]}</span>
        ))}
      </span>
      <ArrowUpRight
        size={22}
        strokeWidth={1.8}
        className="nf-page__video-row-arrow"
        aria-hidden
      />
    </motion.button>
  );
}
