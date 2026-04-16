/**
 * Offer Hub — Web prototype (Phase 2).
 *
 * NuDS-compliant: tokens via nuds/ adapter, BEM classes from prototype.css.
 * Motion: staggered card entrance (spring), tab-switch fade, pulse badge.
 */

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useEmulatorConfig } from '../context/EmulatorConfigContext';
import { NText, Badge, Button, TopBar, boxShadow } from '../nuds';
import type { NuDSWebTheme } from '../nuds';
import { useScreenLoading } from '../hooks/useScreenLoading';
import { CardShimmer } from '../components/ScreenShimmer';
import { getTranslations } from '@shared/i18n';
import type { Locale, Translations } from '@shared/i18n';
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
  tabs, activeIndex, onSelect, t,
}: {
  tabs: { key: string; label: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  t: NuDSWebTheme;
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
    <div ref={ref} className="nf-proto__segmented-control">
      {width > 0 && (
        <motion.div
          layout
          className="nf-proto__segmented-control__indicator"
          style={{ width: tabW }}
          animate={{ x: activeIndex * tabW }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      {tabs.map((tab, i) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(i)}
          className={`nf-proto__segmented-control__tab ${i === activeIndex ? 'nf-proto__segmented-control__tab--active' : 'nf-proto__segmented-control__tab--inactive'}`}
          style={{ color: i === activeIndex ? t.color.main : t.color.content.secondary }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────── Offer Card ─────────── */

function OfferCard({
  offer, oh, fmtAmount, index, t,
}: {
  offer: OfferConfig;
  oh: OfferHubStrings;
  fmtAmount: (v: number) => string;
  index: number;
  t: NuDSWebTheme;
}) {
  const hl = offer.highlighted;
  const title = ohLookup(oh, offer.titleKey);
  const badgeText = offer.badge ? ohLookup(oh, offer.badge) : null;
  const paymentLabel = interpolate(ohLookup(oh, offer.paymentLabelKey), { amount: fmtAmount(offer.paymentValue) });
  const hasBenefit = offer.benefitValue > 0;
  const benefit = hasBenefit ? interpolate(ohLookup(oh, offer.benefitKey), { amount: fmtAmount(offer.benefitValue) }) : '';
  const ctaText = ohLookup(oh, offer.ctaKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { duration: 0.42, ease: 'easeOut', delay: index * 0.1 },
        y: { type: 'spring', stiffness: 180, damping: 22, delay: index * 0.1 },
      }}
      style={{ marginBottom: t.spacing[4] }}
    >
      <div className={`nf-proto__card ${hl ? 'nf-proto__card--highlighted' : ''}`}>
        <div className="nf-proto__card__top">
          {badgeText && (
            <div style={{ marginBottom: t.spacing[2] }}>
              <Badge
                label={badgeText}
                color={offer.badgeType === 'green' ? 'success' : 'accent'}
                theme={t}
              />
            </div>
          )}
          <NText variant="titleXSmall" theme={t} as="p" style={{ margin: `0 0 ${t.spacing[2]}px` }}>
            {title}
          </NText>
          <NText variant="labelXSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: `0 0 ${t.spacing[1]}px` }}>
            {paymentLabel}
          </NText>
          {hasBenefit && (
            <NText variant="labelXSmallStrong" color={t.color.positive} theme={t} as="p" style={{ margin: 0 }}>
              {benefit}
            </NText>
          )}
        </div>

        <div className="nf-proto__card__bottom">
          <Button
            label={ctaText}
            variant={hl ? 'primary' : 'secondary'}
            expanded
            compact
            theme={t}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────── Pulse Badge ─────────── */

function PulseBadge({ text, t }: { text: string; t: NuDSWebTheme }) {
  return (
    <motion.span
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'inline-block', marginTop: t.spacing[2] }}
    >
      <Badge label={text} color="success" theme={t} />
    </motion.span>
  );
}

/* ─────────── Main Screen ─────────── */

export default function OfferHubScreen({
  locale, onClose, variant,
}: {
  locale: Locale;
  onClose?: () => void;
  variant?: string;
}) {
  const { nuds } = useTheme();
  const t = nuds;
  const { loading } = useScreenLoading();
  const { debtOverrides, effectiveRules } = useEmulatorConfig();
  const discountsDisabled = effectiveRules.offer1DiscountPercent === 0 && effectiveRules.offer2DiscountPercent === 0 && effectiveRules.offer3DiscountPercent === 0;
  const tr = getTranslations(locale);
  const oh = tr.offerHub;
  const allTabs = oh.tabs;

  const hasCard = debtOverrides.cardBalance > 0;
  const hasLoans = debtOverrides.loanBalance > 0;

  const singleSegment = hasCard && !hasLoans ? 'card' : !hasCard && hasLoans ? 'loans' : null;

  const availableTabs = (() => {
    if (singleSegment) return allTabs.filter((tab) => tab.key === singleSegment);
    return allTabs.filter((tab) => {
      if (tab.key === 'card') return hasCard;
      if (tab.key === 'loans') return hasLoans;
      return hasCard || hasLoans;
    });
  })();

  const isStressTest = variant === 'stress-test';
  const fixedTabKey = variant === 'lending-only' ? 'loans'
    : variant === 'credit-card-only' ? 'card'
    : isStressTest ? 'all'
    : singleSegment ?? null;
  const showSegmentControl = !fixedTabKey && availableTabs.length > 1;

  const baseUseCase: UseCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = baseUseCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const useCase: UseCase = useMemo(() => {
    const baseCard = baseUseCase.tabs.find((tb) => tb.key === 'card');
    const baseLoan = baseUseCase.tabs.find((tb) => tb.key === 'loans');
    if (!baseCard || !baseLoan) return baseUseCase;

    const cardScale = baseCard.originalTotal > 0 ? debtOverrides.cardBalance / baseCard.originalTotal : 0;
    const loanScale = baseLoan.originalTotal > 0 ? debtOverrides.loanBalance / baseLoan.originalTotal : 0;

    const scaleTab = (tab: TabConfig): TabConfig => {
      if (discountsDisabled) {
        const orig = tab.key === 'card' ? debtOverrides.cardBalance : tab.key === 'loans' ? debtOverrides.loanBalance : debtOverrides.cardBalance + debtOverrides.loanBalance;
        return { ...tab, originalTotal: orig, discountedTotal: orig, discountValue: 0 };
      }
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
        const benefitValue = discountsDisabled ? 0 : Math.round(o.benefitValue * s * 100) / 100;
        return { ...o, paymentValue: Math.round(o.paymentValue * s * 100) / 100, benefitValue };
      }),
    };
  }, [baseUseCase, debtOverrides, discountsDisabled]);

  const stressTestOffers: OfferConfig[] = useMemo(() => {
    if (!isStressTest) return [];
    const total = debtOverrides.cardBalance + debtOverrides.loanBalance;
    const d = discountsDisabled ? 0 : 1;
    return [
      { id: 'st-1', tab: 'all', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerSolveAllMonthly', paymentLabelKey: 'firstPaymentFrom', paymentValue: total * 0.01, benefitKey: 'upToAmount', benefitValue: total * 0.37 * d, ctaKey: 'cta', highlighted: true },
      { id: 'st-2', tab: 'all', badge: d ? 'badgeBestDiscount' : undefined, badgeType: 'green', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: total * 0.63, benefitKey: 'discount', benefitValue: total * 0.37 * d, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: 'st-3', tab: 'all', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: total * 0.12, benefitKey: 'discount', benefitValue: total * 0.12 * d, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: 'st-4', tab: 'all', badge: 'badgeMonthlyPayments', badgeType: 'purple', titleKey: 'offerPayCurrentBill', paymentLabelKey: 'firstPaymentFrom', paymentValue: total * 0.02, benefitKey: 'upToAmount', benefitValue: total * 0.25 * d, ctaKey: 'cta', highlighted: true },
      { id: 'st-5', tab: 'all', titleKey: 'offerPayLateLoan', paymentLabelKey: 'payOnlyAmount', paymentValue: total * 0.45, benefitKey: 'discount', benefitValue: total * 0.18 * d, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: 'st-6', tab: 'all', badge: d ? 'badgeBestDiscount' : undefined, badgeType: 'green', titleKey: 'offerSolveAllMonthly', paymentLabelKey: 'firstPaymentFrom', paymentValue: total * 0.03, benefitKey: 'upToAmount', benefitValue: total * 0.30 * d, ctaKey: 'cta', highlighted: false },
      { id: 'st-7', tab: 'all', titleKey: 'offerPayLateInstallments', paymentLabelKey: 'payAmount', paymentValue: total * 0.08, benefitKey: 'discount', benefitValue: total * 0.08 * d, ctaKey: 'checkDetailsButton', highlighted: false },
      { id: 'st-8', tab: 'all', titleKey: 'offerSolveAllNow', paymentLabelKey: 'payOnlyAmount', paymentValue: total * 0.55, benefitKey: 'discount', benefitValue: total * 0.22 * d, ctaKey: 'checkDetailsButton', highlighted: false },
    ];
  }, [isStressTest, debtOverrides, discountsDisabled]);

  const tabs = fixedTabKey ? allTabs : availableTabs;

  const [activeTab, setActiveTab] = useState(() => {
    if (fixedTabKey) {
      const idx = tabs.findIndex((tb) => tb.key === fixedTabKey);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [displayedTab, setDisplayedTab] = useState(activeTab);

  const tabKey = fixedTabKey ?? (tabs[displayedTab]?.key ?? (hasCard ? 'card' : hasLoans ? 'loans' : 'all'));
  const tabData: TabConfig | undefined = getTabData(useCase, tabKey);
  const offers = isStressTest ? stressTestOffers : getOffersForTab(useCase, tabKey);

  const switchTab = useCallback(
    (index: number) => {
      if (index === activeTab) return;
      setActiveTab(index);
      setDisplayedTab(index);
    },
    [activeTab],
  );

  const discountBadgeText = tabData && !discountsDisabled && tabData.discountValue > 0
    ? interpolate(oh.discount, { amount: fmtAmount(tabData.discountValue) })
    : '';

  if (loading) {
    return (
      <div className="nf-proto" style={{ background: t.color.background.screen, color: t.color.content.primary }}>
        <CardShimmer t={t} />
      </div>
    );
  }

  return (
    <div
      className="nf-proto"
      style={{ background: t.color.background.screen, color: t.color.content.primary }}
    >
      {/* Header */}
      <div
        className="nf-proto__safe-top"
        style={{
          paddingBottom: t.spacing[3],
          background: `${t.color.background.screen}A3`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10,
        }}
      >
        <TopBar
          title={oh.title}
          variant="modal"
          onClose={onClose}
          theme={t}
          style={{ padding: `0 ${t.spacing[2]}px ${t.spacing[3]}px` }}
        />

        {showSegmentControl && (
          <div style={{ padding: `0 ${t.spacing[5]}px` }}>
            <SegmentedControl tabs={tabs} activeIndex={activeTab} onSelect={switchTab} t={t} />
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="nf-proto__scroll" style={{ padding: `0 ${t.spacing[5]}px ${t.spacing[4]}px` }}>
        {/* Balance */}
        <div style={{ paddingTop: t.spacing[4], paddingBottom: t.spacing[6], textAlign: 'center' }}>
          <NText variant="subtitleSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: 0 }}>
            {oh.totalLabel}
          </NText>
          <AnimatePresence mode="wait">
            {tabData && (
              <motion.div
                key={tabKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                {!discountsDisabled && tabData.discountValue > 0 && (
                  <NText variant="labelXSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: '2px 0 0' }}>
                    {oh.fromPrefix}{' '}
                    <span style={{ textDecoration: 'line-through' }}>{fmtAmount(tabData.originalTotal)}</span>{' '}
                    {oh.toSuffix}
                  </NText>
                )}
                <div style={{ padding: '7px 0' }}>
                  <NText variant="titleLarge" theme={t} as="p" style={{ margin: 0 }}>
                    {fmtAmount(tabData.discountedTotal)}
                  </NText>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {discountBadgeText ? <PulseBadge text={discountBadgeText} t={t} /> : null}
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
                t={t}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
