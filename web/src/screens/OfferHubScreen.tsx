/**
 * Offer Hub — Web prototype (Phase 2).
 *
 * Theme-aware: all colors come from palette (segment + mode).
 * Motion: staggered card entrance (spring), tab-switch fade, pulse badge.
 * Layout: safe area padding for web viewport notch.
 */

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useEmulatorConfig } from '../context/EmulatorConfigContext';
import { getTranslations } from '../../../i18n/translations';
import type { Locale, Translations } from '../../../i18n/types';
import {
  getUseCaseForLocale,
  getOffersForTab,
  getTabData,
  type OfferConfig,
  type TabConfig,
  type UseCase,
} from '../../../config/useCases';
import { formatCurrency, interpolate } from '../../../config/formatters';

type OfferHubStrings = Translations['offerHub'];

function ohLookup(oh: OfferHubStrings, key: string): string {
  return ((oh as Record<string, unknown>)[key] as string) ?? key;
}

/* ─────────── Segmented Control ─────────── */

function SegmentedControl({
  tabs,
  activeIndex,
  onSelect,
  palette,
}: {
  tabs: { key: string; label: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth));
    ro.observe(el);
    setWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const tabW = width > 0 ? (width - 4) / tabs.length : 0;

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        display: 'flex',
        borderRadius: 64,
        height: 48,
        padding: 2,
        background: palette.surfaceSecondary,
      }}
    >
      {width > 0 && (
        <motion.div
          layout
          style={{
            position: 'absolute',
            top: 2,
            bottom: 2,
            left: 2,
            width: tabW,
            borderRadius: 999,
            background: palette.background,
            border: `1px solid ${palette.border}`,
            boxShadow: '0px 1px 0px 0px rgba(31,0,47,0.05)',
            zIndex: 0,
          }}
          animate={{ x: activeIndex * tabW }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      {tabs.map((tab, i) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(i)}
          style={{
            flex: 1,
            zIndex: 1,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.3,
            color: i === activeIndex ? palette.accent : palette.textSecondary,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────── Offer Card with stagger entrance ─────────── */

function OfferCard({
  offer,
  oh,
  fmtAmount,
  index,
  palette,
}: {
  offer: OfferConfig;
  oh: OfferHubStrings;
  fmtAmount: (v: number) => string;
  index: number;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const hl = offer.highlighted;
  const title = ohLookup(oh, offer.titleKey);
  const badgeText = offer.badge ? ohLookup(oh, offer.badge) : null;
  const paymentLabel = interpolate(ohLookup(oh, offer.paymentLabelKey), { amount: fmtAmount(offer.paymentValue) });
  const benefit = interpolate(ohLookup(oh, offer.benefitKey), { amount: fmtAmount(offer.benefitValue) });
  const ctaText = ohLookup(oh, offer.ctaKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { duration: 0.42, ease: 'easeOut', delay: index * 0.1 },
        y: { type: 'spring', stiffness: 180, damping: 22, delay: index * 0.1 },
      }}
      style={{ marginBottom: 16 }}
    >
      <div
        style={{
          borderRadius: 24,
          border: `0.5px solid ${hl ? `${palette.accent}50` : palette.border}`,
          background: hl ? palette.accentSubtle : palette.background,
          overflow: 'hidden',
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        <div style={{ padding: 20, paddingBottom: 16 }}>
          {badgeText && (
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  background: offer.badgeType === 'green' ? 'rgba(12,122,58,0.12)' : `${palette.accent}18`,
                  color: offer.badgeType === 'green' ? '#0c7a3a' : palette.accent,
                  transition: 'background 0.3s, color 0.3s',
                }}
              >
                {badgeText}
              </span>
            </div>
          )}
          <p style={{
            margin: '0 0 8px', fontSize: 20, fontWeight: 500, lineHeight: 1.2,
            letterSpacing: '-0.4px', color: palette.textPrimary, transition: 'color 0.3s',
          }}>
            {title}
          </p>
          <p style={{
            margin: '0 0 4px', fontSize: 12, lineHeight: 1.3,
            color: palette.textSecondary, transition: 'color 0.3s',
          }}>
            {paymentLabel}
          </p>
          <p style={{
            margin: 0, fontSize: 12, fontWeight: 500, lineHeight: 1.3, color: '#0c7a3a',
          }}>
            {benefit}
          </p>
        </div>

        <div style={{ padding: '0 12px 12px' }}>
          <button
            type="button"
            style={{
              width: '100%',
              height: 36,
              borderRadius: 999,
              border: hl ? 'none' : `1px solid ${palette.border}`,
              background: hl ? palette.accent : 'transparent',
              color: hl ? '#fff' : palette.textPrimary,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.3s, border-color 0.3s, color 0.3s',
              boxShadow: hl
                ? 'inset 0px -1px 0px 0px rgba(0,0,0,0.2), 0px 1px 0px 0px rgba(31,0,47,0.05), inset 0px 1px 0px 0px rgba(255,255,255,0.2)'
                : 'inset 0px 0px 0px 1px rgba(31,0,47,0.02), inset 0px -1px 0px 0px rgba(31,0,47,0.1), 0px 1px 0px 0px rgba(31,0,47,0.05)',
            }}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────── Pulse Badge ─────────── */

function PulseBadge({ text }: { text: string }) {
  return (
    <motion.span
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        display: 'inline-block',
        marginTop: 8,
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
        background: 'rgba(12,122,58,0.12)',
        color: '#0c7a3a',
      }}
    >
      {text}
    </motion.span>
  );
}

/* ─────────── Main Screen ─────────── */

export default function OfferHubScreen({
  locale,
  onClose,
  variant,
}: {
  locale: Locale;
  onClose?: () => void;
  variant?: string;
}) {
  const { palette } = useTheme();
  const { debtOverrides } = useEmulatorConfig();
  const t = getTranslations(locale);
  const oh = t.offerHub;
  const allTabs = oh.tabs;

  const hasCard = debtOverrides.cardBalance > 0;
  const hasLoans = debtOverrides.loanBalance > 0;

  const availableTabs = useMemo(() => {
    return allTabs.filter((tab) => {
      if (tab.key === 'card') return hasCard;
      if (tab.key === 'loans') return hasLoans;
      return hasCard || hasLoans;
    });
  }, [allTabs, hasCard, hasLoans]);

  const fixedTabKey = variant === 'lending-only' ? 'loans'
    : variant === 'credit-card-only' ? 'card'
    : null;
  const showSegmentControl = !fixedTabKey && availableTabs.length > 1;

  const baseUseCase: UseCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = baseUseCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const useCase: UseCase = useMemo(() => {
    const baseCard = baseUseCase.tabs.find((t) => t.key === 'card');
    const baseLoan = baseUseCase.tabs.find((t) => t.key === 'loans');
    if (!baseCard || !baseLoan) return baseUseCase;

    const cardScale = baseCard.originalTotal > 0 ? debtOverrides.cardBalance / baseCard.originalTotal : 0;
    const loanScale = baseLoan.originalTotal > 0 ? debtOverrides.loanBalance / baseLoan.originalTotal : 0;

    const scaleTab = (tab: TabConfig): TabConfig => {
      if (tab.key === 'card') {
        return { ...tab, originalTotal: debtOverrides.cardBalance, discountedTotal: Math.round(tab.discountedTotal * cardScale * 100) / 100, discountValue: Math.round(tab.discountValue * cardScale * 100) / 100 };
      }
      if (tab.key === 'loans') {
        return { ...tab, originalTotal: debtOverrides.loanBalance, discountedTotal: Math.round(tab.discountedTotal * loanScale * 100) / 100, discountValue: Math.round(tab.discountValue * loanScale * 100) / 100 };
      }
      const allOriginal = debtOverrides.cardBalance + debtOverrides.loanBalance;
      const allDiscounted = Math.round(tab.discountedTotal * cardScale * (baseCard.originalTotal / (baseCard.originalTotal + baseLoan.originalTotal)) + tab.discountedTotal * loanScale * (baseLoan.originalTotal / (baseCard.originalTotal + baseLoan.originalTotal)));
      return { ...tab, originalTotal: allOriginal, discountedTotal: Math.round(allDiscounted * 100) / 100, discountValue: Math.round((allOriginal - allDiscounted) * 100) / 100 };
    };

    const scaleForTab = (tab: string) => tab === 'card' ? cardScale : tab === 'loans' ? loanScale : (cardScale + loanScale) / 2;

    return {
      ...baseUseCase,
      debt: { ...baseUseCase.debt, totalOriginal: debtOverrides.cardBalance + debtOverrides.loanBalance },
      tabs: baseUseCase.tabs.map(scaleTab),
      offers: baseUseCase.offers.map((o) => {
        const s = scaleForTab(o.tab);
        return { ...o, paymentValue: Math.round(o.paymentValue * s * 100) / 100, benefitValue: Math.round(o.benefitValue * s * 100) / 100 };
      }),
    };
  }, [baseUseCase, debtOverrides]);

  const tabs = fixedTabKey ? allTabs : availableTabs;

  const [activeTab, setActiveTab] = useState(() => {
    if (fixedTabKey) {
      const idx = tabs.findIndex((t) => t.key === fixedTabKey);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [displayedTab, setDisplayedTab] = useState(activeTab);

  const tabKey = fixedTabKey ?? (tabs[displayedTab]?.key ?? (hasCard ? 'card' : hasLoans ? 'loans' : 'all'));
  const tabData: TabConfig | undefined = getTabData(useCase, tabKey);
  const offers = getOffersForTab(useCase, tabKey);

  const switchTab = useCallback(
    (index: number) => {
      if (index === activeTab) return;
      setActiveTab(index);
      setDisplayedTab(index);
    },
    [activeTab],
  );

  const discountBadgeText = tabData
    ? interpolate(oh.discount, { amount: fmtAmount(tabData.discountValue) })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: palette.background,
        color: palette.textPrimary,
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      {/* Header with safe area */}
      <div
        style={{
          paddingTop: 'var(--safe-area-top, 59px)',
          paddingBottom: 12,
          background: `${palette.background}A3`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10,
          flexShrink: 0,
          transition: 'background 0.3s',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 44px',
            alignItems: 'center',
            padding: '0 8px 12px',
            minHeight: 44,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 40, height: 40, border: 'none', borderRadius: 12,
                  background: 'transparent', cursor: 'pointer',
                  color: palette.textSecondary, fontSize: 22, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.3s',
                }}
              >
                ×
              </button>
            ) : null}
          </div>
          <span style={{
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            color: palette.textPrimary, transition: 'color 0.3s',
          }}>
            {oh.title}
          </span>
          <div aria-hidden />
        </div>

        {showSegmentControl && (
          <div style={{ padding: '0 20px' }}>
            <SegmentedControl tabs={tabs} activeIndex={activeTab} onSelect={switchTab} palette={palette} />
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Total balance */}
        <div style={{ paddingTop: 16, paddingBottom: 24, textAlign: 'center' }}>
          <p style={{
            margin: 0, fontSize: 16, lineHeight: 1.3,
            color: palette.textSecondary, transition: 'color 0.3s',
          }}>
            {oh.totalLabel}
          </p>
          <AnimatePresence mode="wait">
            {tabData && (
              <motion.div
                key={tabKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <p style={{
                  margin: '2px 0 0', fontSize: 12, lineHeight: 1.3,
                  color: palette.textSecondary, letterSpacing: '0.12px', transition: 'color 0.3s',
                }}>
                  {oh.fromPrefix}{' '}
                  <span style={{ textDecoration: 'line-through' }}>{fmtAmount(tabData.originalTotal)}</span>{' '}
                  {oh.toSuffix}
                </p>
                <div style={{ padding: '7px 0' }}>
                  <p style={{
                    margin: 0, fontSize: 36, fontWeight: 500, lineHeight: 1.1,
                    color: palette.textPrimary, transition: 'color 0.3s',
                  }}>
                    {fmtAmount(tabData.discountedTotal)}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {discountBadgeText ? <PulseBadge text={discountBadgeText} /> : null}
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayedTab}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {offers.map((offer, i) => (
              <OfferCard
                key={`${tabKey}-${offer.id}`}
                offer={offer}
                oh={oh}
                fmtAmount={fmtAmount}
                index={i}
                palette={palette}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
