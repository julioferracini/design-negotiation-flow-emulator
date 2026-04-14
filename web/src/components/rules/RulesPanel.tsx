import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { useEmulatorConfig, DEFAULT_DEBT_BY_LOCALE, DEFAULT_SIMULATED_LATENCY_MS, type RuleOverrides } from '../../context/EmulatorConfigContext';
import { getRules, type AmortizationFormula } from '../../../../config/financialCalculator';
import { getUseCaseForLocale } from '../../../../config/useCases';
import { formatCurrency } from '../../../../config/formatters';
import type { Locale } from '../../../../i18n/types';
import { SUPPORTED_LOCALES, LOCALE_FLAGS, LOCALE_SHORT_NAMES, LOCALE_REGION_EN } from '../../../../shared/types';
import { RotateCcw, X, CreditCard, Landmark, ChevronDown } from 'lucide-react';

export default function RulesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const config = useEmulatorConfig();
  const locale = config.locale;
  const defaults = getRules(locale);
  const curr = getUseCaseForLocale(locale).currency;

  const [localeDropdownOpen, setLocaleDropdownOpen] = useState(false);
  const showDpFields = config.screenSettings.simulation?.enabled || config.screenSettings.downpaymentValue?.enabled;

  // ── Negotiation Values ──
  const debtDefaults = DEFAULT_DEBT_BY_LOCALE[locale];
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
  const debtIsDirty = cardDirty || loanDirty;
  const debtIsDefault = config.debtOverrides.cardBalance === debtDefaults.cardBalance && config.debtOverrides.loanBalance === debtDefaults.loanBalance;

  const handleDebtSave = () => {
    const card = Math.max(0, parseField(draftCard));
    const loan = Math.max(0, parseField(draftLoan));
    setDraftCard(fmtField(card));
    setDraftLoan(fmtField(loan));
    config.setDebtOverrides({ cardBalance: card, loanBalance: loan });
  };
  const handleDebtReset = () => config.resetDebtOverrides();

  const debtTotal = parseField(draftCard) + parseField(draftLoan);
  const fmtTotal = formatCurrency(debtTotal, curr);

  const debtInputStyle = (dirty: boolean): React.CSSProperties => ({
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    padding: '8px 0 8px 10px', fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
    color: dirty ? palette.accent : palette.textPrimary, width: 0, minWidth: 0,
  });

  // ── Latency Simulation ──
  const [draftLatency, setDraftLatency] = useState(String(config.simulatedLatencyMs));
  const latencyIsDirty = draftLatency !== String(config.simulatedLatencyMs);
  const latencyIsDefault = config.simulatedLatencyMs === DEFAULT_SIMULATED_LATENCY_MS;
  const MAX_LATENCY_MS = 6000;

  const handleLatencySave = () => {
    const parsed = Math.min(MAX_LATENCY_MS, Math.max(0, Math.round(Number(draftLatency) || 0)));
    setDraftLatency(String(parsed));
    config.setSimulatedLatencyMs(parsed);
  };
  const handleLatencyReset = () => {
    setDraftLatency(String(DEFAULT_SIMULATED_LATENCY_MS));
    config.setSimulatedLatencyMs(DEFAULT_SIMULATED_LATENCY_MS);
  };

  // ── Financial Rules ──
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

  const hasAnyDiscount = r.offer1DiscountPercent > 0 || r.offer2DiscountPercent > 0 || r.offer3DiscountPercent > 0;
  const [offersEnabled, setOffersEnabled] = useState(hasAnyDiscount);

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
    setOffersEnabled(r.offer1DiscountPercent > 0 || r.offer2DiscountPercent > 0 || r.offer3DiscountPercent > 0);
  }, [r]);

  const buildRulesParsed = useCallback((): Partial<RuleOverrides> => ({
    minInstallments: Math.max(1, Number(draftMin) || defaults.minInstallments),
    maxInstallments: Math.max(2, Number(draftMax) || defaults.maxInstallments),
    downPaymentDebtThreshold: Math.max(0, Number(draftThreshold) || 0),
    downPaymentMinPercent: Math.max(0, Math.min(100, Number(draftMinPct) || 0)) / 100,
    monthlyInterestRate: Math.max(0, Number(draftRate) || 0) / 100,
    offer1DiscountPercent: offersEnabled ? Math.max(0, Math.min(100, Number(draftOffer1) || 0)) / 100 : 0,
    offer2DiscountPercent: offersEnabled ? Math.max(0, Math.min(100, Number(draftOffer2) || 0)) / 100 : 0,
    offer2Installments: Math.max(1, Number(draftOffer2Inst) || defaults.offer2Installments),
    offer3DiscountPercent: offersEnabled ? Math.max(0, Math.min(100, Number(draftOffer3) || 0)) / 100 : 0,
    offer3Installments: Math.max(1, Number(draftOffer3Inst) || defaults.offer3Installments),
    downPaymentThreshold: Math.max(0, Number(draftDpThresh) || 0),
  }), [draftMin, draftMax, draftThreshold, draftMinPct, draftRate, draftOffer1, draftOffer2, draftOffer2Inst, draftOffer3, draftOffer3Inst, draftDpThresh, offersEnabled, defaults]);

  const rulesParsed = buildRulesParsed();

  const rulesIsDirty = Object.entries(rulesParsed).some(
    ([key, val]) => val !== config.effectiveRules[key as keyof typeof config.effectiveRules]
  );
  const rulesIsDefault = Object.keys(config.ruleOverrides).length === 0;

  const handleRulesSave = () => config.setRuleOverrides(rulesParsed);
  const handleRulesReset = () => config.resetRuleOverrides();

  const handleToggleOffers = () => {
    const next = !offersEnabled;
    setOffersEnabled(next);
    if (!next) {
      config.setRuleOverrides({
        ...rulesParsed,
        offer1DiscountPercent: 0,
        offer2DiscountPercent: 0,
        offer3DiscountPercent: 0,
      });
    } else {
      const d = defaults;
      setDraftOffer1(String(Math.round(d.offer1DiscountPercent * 100)));
      setDraftOffer2(String(Math.round(d.offer2DiscountPercent * 100)));
      setDraftOffer3(String(Math.round(d.offer3DiscountPercent * 100)));
      config.setRuleOverrides({
        ...rulesParsed,
        offer1DiscountPercent: d.offer1DiscountPercent,
        offer2DiscountPercent: d.offer2DiscountPercent,
        offer3DiscountPercent: d.offer3DiscountPercent,
      });
    }
  };

  // ── Save All / Reset All ──
  const anyDirty = debtIsDirty || rulesIsDirty || latencyIsDirty;
  const allDefault = debtIsDefault && rulesIsDefault && latencyIsDefault;

  const handleSaveAll = () => {
    if (debtIsDirty) handleDebtSave();
    if (rulesIsDirty) handleRulesSave();
    if (latencyIsDirty) handleLatencySave();
  };

  const handleResetAll = () => {
    handleDebtReset();
    handleRulesReset();
    handleLatencyReset();
    setOffersEnabled(defaults.offer1DiscountPercent > 0 || defaults.offer2DiscountPercent > 0 || defaults.offer3DiscountPercent > 0);
  };

  // ── Styles ──
  const fieldStyle: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    padding: '8px 10px', fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
    color: palette.textPrimary, width: 0, minWidth: 0,
  };

  const boxStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    borderRadius: 8, border: `1px solid ${palette.border}`,
    background: isLight ? '#fff' : palette.surfaceSecondary,
    overflow: 'hidden', transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: palette.textSecondary, marginBottom: 4,
  };

  const suffixStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: palette.textSecondary, padding: '0 8px 0 0', flexShrink: 0,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
    color: palette.textSecondary, marginTop: 0, marginBottom: 8,
  };

  const divider = <div style={{ height: 1, background: `${palette.border}60`, margin: '18px 0' }} />;

  const saveBtnStyle = (dirty: boolean): React.CSSProperties => ({
    height: 28, padding: '0 12px', borderRadius: 7, border: 'none',
    background: dirty ? palette.accent : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
    color: dirty ? '#fff' : palette.textSecondary,
    cursor: dirty ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 600, opacity: dirty ? 1 : 0.4,
    transition: 'background 0.2s, opacity 0.2s',
  });

  const resetBtnStyle = (canReset: boolean): React.CSSProperties => ({
    height: 28, padding: '0 10px', borderRadius: 7,
    border: `1px solid ${palette.border}`,
    background: isLight ? '#fff' : palette.surfaceSecondary,
    color: palette.textSecondary,
    cursor: canReset ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 600, opacity: canReset ? 1 : 0.4,
    transition: 'opacity 0.2s',
  });

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
              width: 340, maxWidth: '90vw', zIndex: 995,
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
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: palette.textPrimary }}>
                  Financial Rules
                </h3>
                <span style={{ fontSize: 11, color: palette.textSecondary }}>
                  {locale.toUpperCase()} &middot; {curr.code}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {!rulesIsDefault && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: palette.accent, padding: '2px 6px', borderRadius: 4, background: palette.accentSubtle }}>
                    modified
                  </span>
                )}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none',
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X style={{ width: 14, height: 14, color: palette.textSecondary }} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', WebkitOverflowScrolling: 'touch' }}>

              {/* ── Country / Language ── */}
              <div style={{ position: 'relative', marginBottom: 18 }}>
                <button
                  onClick={() => setLocaleDropdownOpen(!localeDropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                    padding: '10px 14px', borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    background: isLight ? '#fff' : palette.surfaceSecondary,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{LOCALE_FLAGS[locale]}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}>
                      {LOCALE_SHORT_NAMES[locale]}
                    </span>
                    <span style={{ fontSize: 10, color: palette.textSecondary }}>
                      ({LOCALE_REGION_EN[locale]})
                    </span>
                  </div>
                  <ChevronDown style={{ width: 14, height: 14, color: palette.accent, transform: localeDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>
                {localeDropdownOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setLocaleDropdownOpen(false)} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                      background: isLight ? '#fff' : palette.surfaceSecondary,
                      borderRadius: 12, border: `1px solid ${palette.border}`,
                      boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.4)',
                      padding: 4,
                    }}>
                      {SUPPORTED_LOCALES.map((loc) => {
                        const active = loc === locale;
                        return (
                          <button
                            key={loc}
                            onClick={() => { config.setLocale(loc); setLocaleDropdownOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                              padding: '9px 12px', borderRadius: 8, border: 'none',
                              background: active ? palette.accentSubtle : 'transparent',
                              cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: 16 }}>{LOCALE_FLAGS[loc]}</span>
                            <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? palette.accent : palette.textPrimary }}>
                              {LOCALE_SHORT_NAMES[loc]}
                            </span>
                            <span style={{ fontSize: 10, color: palette.textSecondary }}>
                              ({LOCALE_REGION_EN[loc]})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* ── Amortization Formula ── */}
              <FormulaSelector
                value={config.effectiveRules.formula}
                onChange={(f) => config.setRuleOverrides({ formula: f })}
                palette={palette}
                isLight={isLight}
              />

              {divider}

              {/* ── Negotiation Values ── */}
              <div style={sectionLabel}>Negotiation Values</div>
              <p style={{ fontSize: 11, color: palette.textSecondary, margin: '0 0 12px', lineHeight: 1.4 }}>
                Total values per segment for the selected country ({curr.code}).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <CreditCard style={{ width: 11, height: 11, color: palette.textSecondary }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: palette.textSecondary }}>Card</span>
                  </div>
                  <div style={boxStyle}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, padding: '0 0 0 10px', flexShrink: 0 }}>{curr.symbol}</span>
                    <input
                      type="text" inputMode="decimal" value={draftCard}
                      onChange={(e) => setDraftCard(e.target.value)}
                      onBlur={() => setDraftCard(fmtField(Math.max(0, parseField(draftCard))))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleDebtSave(); }}
                      style={debtInputStyle(cardDirty)}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Landmark style={{ width: 11, height: 11, color: palette.textSecondary }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: palette.textSecondary }}>Loans</span>
                  </div>
                  <div style={boxStyle}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, padding: '0 0 0 10px', flexShrink: 0 }}>{curr.symbol}</span>
                    <input
                      type="text" inputMode="decimal" value={draftLoan}
                      onChange={(e) => setDraftLoan(e.target.value)}
                      onBlur={() => setDraftLoan(fmtField(Math.max(0, parseField(draftLoan))))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleDebtSave(); }}
                      style={debtInputStyle(loanDirty)}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                  Total: {fmtTotal}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <motion.button type="button" onClick={handleDebtSave} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} disabled={!debtIsDirty} style={saveBtnStyle(debtIsDirty)}>
                    Save
                  </motion.button>
                  <motion.button type="button" onClick={handleDebtReset} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} disabled={debtIsDefault && !debtIsDirty} style={resetBtnStyle(!(debtIsDefault && !debtIsDirty))}>
                    <RotateCcw style={{ width: 11, height: 11 }} /> Reset
                  </motion.button>
                </div>
              </div>

              {divider}

              {/* ── Installments ── */}
              <div style={sectionLabel}>Installments</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={labelStyle}>Min</div>
                  <div style={boxStyle}>
                    <input type="number" min={1} value={draftMin} onChange={(e) => setDraftMin(e.target.value)} style={fieldStyle} />
                    <span style={suffixStyle}>x</span>
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Max</div>
                  <div style={boxStyle}>
                    <input type="number" min={2} value={draftMax} onChange={(e) => setDraftMax(e.target.value)} style={fieldStyle} />
                    <span style={suffixStyle}>x</span>
                  </div>
                </div>
              </div>

              {config.effectiveRules.formula !== 'flat_discount' && (<>
                {divider}

                {/* ── Interest ── */}
                <div style={sectionLabel}>Interest</div>
                <div>
                  <div style={labelStyle}>Monthly Rate</div>
                  <div style={boxStyle}>
                    <input type="number" min={0} step={0.01} value={draftRate} onChange={(e) => setDraftRate(e.target.value)} style={fieldStyle} />
                    <span style={suffixStyle}>% a.m.</span>
                  </div>
                </div>
              </>)}

              {showDpFields && (<>
                {divider}

                {/* ── Downpayment ── */}
                <div style={sectionLabel}>Downpayment</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={labelStyle}>Threshold</div>
                    <div style={boxStyle}>
                      <input type="number" min={0} value={draftDpThresh} onChange={(e) => setDraftDpThresh(e.target.value)} style={fieldStyle} />
                      <span style={suffixStyle}>x</span>
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>Min %</div>
                    <div style={boxStyle}>
                      <input type="number" min={0} max={100} value={draftMinPct} onChange={(e) => setDraftMinPct(e.target.value)} style={fieldStyle} />
                      <span style={suffixStyle}>%</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={labelStyle}>Debt Threshold ({curr.code})</div>
                  <div style={boxStyle}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, padding: '0 0 0 10px', flexShrink: 0 }}>{curr.symbol}</span>
                    <input type="number" min={0} value={draftThreshold} onChange={(e) => setDraftThreshold(e.target.value)} style={fieldStyle} />
                  </div>
                </div>
              </>)}

              {divider}

              {/* ── Offer Discounts (with toggle) ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={sectionLabel}>Offer Discounts</div>
                <button
                  onClick={handleToggleOffers}
                  style={{
                    position: 'relative', width: 36, height: 20, borderRadius: 10, border: 'none',
                    background: offersEnabled ? palette.accent : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'),
                    cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: offersEnabled ? 18 : 2,
                    width: 16, height: 16, borderRadius: 8,
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {offersEnabled ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={labelStyle}>Cash</div>
                      <div style={boxStyle}>
                        <input type="number" min={0} max={100} value={draftOffer1} onChange={(e) => setDraftOffer1(e.target.value)} style={fieldStyle} />
                        <span style={suffixStyle}>%</span>
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Short</div>
                      <div style={boxStyle}>
                        <input type="number" min={0} max={100} value={draftOffer2} onChange={(e) => setDraftOffer2(e.target.value)} style={fieldStyle} />
                        <span style={suffixStyle}>%</span>
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Long</div>
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
                </div>
              ) : (
                <p style={{ fontSize: 11, color: palette.textSecondary, margin: '0 0 4px', lineHeight: 1.4, fontStyle: 'italic' }}>
                  Discounts disabled — all discount values are set to 0% and offer tags are hidden.
                </p>
              )}

              {divider}

              {/* ── Latency Simulation ── */}
              <div style={sectionLabel}>Latency Simulation</div>
              <p style={{ fontSize: 11, color: palette.textSecondary, margin: '0 0 10px', lineHeight: 1.4 }}>
                This is a screen library with mock data — navigation is instant by default.
                In production, values come from a server request. Use this control to simulate
                network latency and approximate the real experience.
              </p>
              <div style={boxStyle}>
                <input
                  type="number" min={0} max={MAX_LATENCY_MS} step={100}
                  value={draftLatency}
                  onChange={(e) => setDraftLatency(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLatencySave(); }}
                  style={fieldStyle}
                />
                <span style={suffixStyle}>ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: palette.textSecondary }}>
                  {`Default: ${DEFAULT_SIMULATED_LATENCY_MS} ms · Max: ${MAX_LATENCY_MS} ms`}
                </span>
              </div>
            </div>

            {/* Footer — Save All + Reset All */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
              padding: '12px 20px', borderTop: `1px solid ${palette.border}`, flexShrink: 0,
            }}>
              <motion.button
                type="button" onClick={handleSaveAll}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                disabled={!anyDirty}
                style={{
                  height: 32, padding: '0 14px', borderRadius: 8, border: 'none',
                  background: anyDirty ? palette.accent : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                  color: anyDirty ? '#fff' : palette.textSecondary,
                  cursor: anyDirty ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, opacity: anyDirty ? 1 : 0.4,
                }}
              >
                Save All
              </motion.button>
              <motion.button
                type="button" onClick={handleResetAll}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                disabled={allDefault && !anyDirty}
                style={{
                  height: 32, padding: '0 12px', borderRadius: 8,
                  border: `1px solid ${palette.border}`,
                  background: isLight ? '#fff' : palette.surfaceSecondary,
                  color: palette.textSecondary,
                  cursor: allDefault && !anyDirty ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, opacity: allDefault && !anyDirty ? 0.4 : 1,
                }}
              >
                <RotateCcw style={{ width: 12, height: 12 }} /> Reset All
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const FORMULA_OPTIONS: { id: AmortizationFormula; label: string; description: string }[] = [
  { id: 'flat_discount', label: 'Flat', description: 'Equal payments, no interest, linear discount' },
  { id: 'price', label: 'Price', description: 'Fixed payments with compound interest (PMT)' },
  { id: 'sac', label: 'SAC', description: 'Decreasing payments, constant amortization' },
];

function FormulaSelector({ value, onChange, palette, isLight }: {
  value: AmortizationFormula;
  onChange: (f: AmortizationFormula) => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}) {
  const selected = FORMULA_OPTIONS.find((o) => o.id === value) ?? FORMULA_OPTIONS[0];
  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        color: palette.textSecondary, marginBottom: 8,
      }}>
        Amortization
      </div>
      <div style={{
        display: 'flex', borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${palette.border}`,
        background: isLight ? '#fff' : palette.surfaceSecondary,
      }}>
        {FORMULA_OPTIONS.map((opt, i) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              style={{
                flex: 1, padding: '10px 0', border: 'none',
                borderRight: i < FORMULA_OPTIONS.length - 1 ? `1px solid ${palette.border}` : 'none',
                background: active ? palette.accentSubtle : 'transparent',
                color: active ? palette.accent : palette.textSecondary,
                fontSize: 12, fontWeight: active ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 10, color: palette.textSecondary, margin: '6px 0 0', lineHeight: 1.4 }}>
        {selected.description}
      </p>
    </div>
  );
}
