import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { useEmulatorConfig, type RuleOverrides } from '../../context/EmulatorConfigContext';
import { getRules } from '../../../../config/financialCalculator';
import { getUseCaseForLocale } from '../../../../config/useCases';
import { formatCurrency } from '../../../../config/formatters';
import type { Locale } from '../../../../i18n/types';
import { RotateCcw, Save, X } from 'lucide-react';

export default function RulesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const config = useEmulatorConfig();
  const locale = config.locale;
  const defaults = getRules(locale);
  const curr = getUseCaseForLocale(locale).currency;

  const showDpFields = config.screenSettings.simulation?.enabled || config.screenSettings.downpaymentValue?.enabled;
  const showOfferFields = config.screenSettings.offerHub?.enabled;

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
  }, [r]);

  const parsed: Partial<RuleOverrides> = {
    minInstallments: Math.max(1, Number(draftMin) || defaults.minInstallments),
    maxInstallments: Math.max(2, Number(draftMax) || defaults.maxInstallments),
    downPaymentDebtThreshold: Math.max(0, Number(draftThreshold) || 0),
    downPaymentMinPercent: Math.max(0, Math.min(100, Number(draftMinPct) || 0)) / 100,
    monthlyInterestRate: Math.max(0, Number(draftRate) || 0) / 100,
    offer1DiscountPercent: Math.max(0, Math.min(100, Number(draftOffer1) || 0)) / 100,
    offer2DiscountPercent: Math.max(0, Math.min(100, Number(draftOffer2) || 0)) / 100,
    offer2Installments: Math.max(1, Number(draftOffer2Inst) || defaults.offer2Installments),
    offer3DiscountPercent: Math.max(0, Math.min(100, Number(draftOffer3) || 0)) / 100,
    offer3Installments: Math.max(1, Number(draftOffer3Inst) || defaults.offer3Installments),
    downPaymentThreshold: Math.max(0, Number(draftDpThresh) || 0),
  };

  const isDirty = Object.entries(parsed).some(
    ([key, val]) => val !== config.effectiveRules[key as keyof typeof config.effectiveRules]
  );
  const isDefault = Object.keys(config.ruleOverrides).length === 0;

  const handleSave = () => config.setRuleOverrides(parsed);
  const handleReset = () => config.resetRuleOverrides();

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
    color: palette.textSecondary, marginTop: 18, marginBottom: 8,
  };

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
                {!isDefault && (
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

              <div style={sectionLabel}>Interest</div>
              <div>
                <div style={labelStyle}>Monthly Rate</div>
                <div style={boxStyle}>
                  <input type="number" min={0} step={0.01} value={draftRate} onChange={(e) => setDraftRate(e.target.value)} style={fieldStyle} />
                  <span style={suffixStyle}>% a.m.</span>
                </div>
              </div>

              {showDpFields && (<>
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

              {showOfferFields && (<>
                <div style={sectionLabel}>Offer Discounts</div>
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
              </>)}

              {!showDpFields && !showOfferFields && (
                <p style={{ fontSize: 12, color: palette.textSecondary, marginTop: 16, lineHeight: 1.5, fontStyle: 'italic' }}>
                  Enable Simulation or Offer Hub screens to see additional rule fields.
                </p>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
              padding: '12px 20px', borderTop: `1px solid ${palette.border}`, flexShrink: 0,
            }}>
              <motion.button
                type="button" onClick={handleReset}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                disabled={isDefault && !isDirty}
                style={{
                  height: 32, padding: '0 12px', borderRadius: 8,
                  border: `1px solid ${palette.border}`,
                  background: isLight ? '#fff' : palette.surfaceSecondary,
                  color: palette.textSecondary, cursor: isDefault && !isDirty ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, opacity: isDefault && !isDirty ? 0.4 : 1,
                }}
              >
                <RotateCcw style={{ width: 12, height: 12 }} /> Reset
              </motion.button>
              <motion.button
                type="button" onClick={handleSave}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                disabled={!isDirty}
                style={{
                  height: 32, padding: '0 14px', borderRadius: 8, border: 'none',
                  background: isDirty ? palette.accent : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                  color: isDirty ? '#fff' : palette.textSecondary,
                  cursor: isDirty ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, opacity: isDirty ? 1 : 0.4,
                }}
              >
                <Save style={{ width: 12, height: 12 }} /> Save
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
