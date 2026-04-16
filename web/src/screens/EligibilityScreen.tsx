/**
 * Eligibility Screen — Web prototype (Phase 2).
 *
 * NuDS-compliant: tokens via nuds/ adapter, BEM classes from prototype.css.
 * Motion: staggered card entrance, benefit list fade, card selection transition.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { useEmulatorConfig } from '../context/EmulatorConfigContext';
import { NText, Badge, Button, TopBar, boxShadow } from '../nuds';
import type { NuDSWebTheme } from '../nuds';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import { getUseCaseForLocale } from '../../../config/useCases';
import { formatCurrency, interpolate } from '../../../config/formatters';

type OptionType = 'fixed' | 'flexible';

/* ─────────── Inline SVG Icons ─────────── */

function FixedIcon({ color, size = 20 }: { color: string; size?: number }) {
  const d = size * 0.22;
  const r = size * 0.1;
  const positions = [
    [d, d], [size - d, d],
    [d, size - d], [size - d, size - d],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {positions.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </svg>
  );
}

function FlexibleIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M18.178 8c2.573 0 3.822 3.11 1.984 4.948l-5.345 5.345a3 3 0 01-4.245 0L5.84 13.56c-1.838-1.838-.59-4.948 1.984-4.948h.532a3 3 0 012.122.878L12 11.012l1.522-1.522A3 3 0 0115.644 8h2.534z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M4.5 10.5L8 14L15.5 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────── Option Card ─────────── */

function OptionCard({
  type,
  selected,
  onSelect,
  title,
  subtitle,
  t,
}: {
  type: OptionType;
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  t: NuDSWebTheme;
}) {
  const iconColor = selected ? t.color.main : t.color.content.secondary;
  const iconBg = selected ? t.color.surface.accent : t.color.background.secondary;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      style={{
        flex: 1,
        aspectRatio: '1',
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: t.spacing[4],
        borderRadius: t.radius.lg,
        border: selected
          ? `2px solid ${t.color.main}`
          : `1px solid ${t.color.border.secondary}`,
        background: selected
          ? t.color.surface.accentSubtle
          : t.color.background.primary,
        boxShadow: boxShadow.level1,
        cursor: 'pointer',
        textAlign: 'left',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      {/* Icon circle — top left */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: t.radius.full,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.25s ease',
        }}
      >
        {type === 'fixed'
          ? <FixedIcon color={iconColor} />
          : <FlexibleIcon color={iconColor} />}
      </div>

      {/* Title + description — bottom left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NText
          variant="subtitleMediumStrong"
          theme={t}
          as="span"
          style={{
            margin: 0,
            color: selected ? t.color.main : t.color.content.primary,
            whiteSpace: 'pre-line',
            transition: 'color 0.25s ease',
          }}
        >
          {title}
        </NText>
        <NText
          variant="labelSmallDefault"
          theme={t}
          as="span"
          style={{
            margin: 0,
            color: selected ? t.color.main : t.color.content.secondary,
            transition: 'color 0.25s ease',
          }}
        >
          {subtitle}
        </NText>
      </div>
    </motion.button>
  );
}

/* ─────────── Benefit Row ─────────── */

function BenefitRow({
  text, index, total, t,
}: {
  text: string;
  index: number;
  total: number;
  t: NuDSWebTheme;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 * index, duration: 0.3, ease: 'easeOut' }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: t.spacing[4],
          padding: `${t.spacing[4]}px ${t.spacing[5]}px`,
        }}
      >
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <CheckIcon color={t.color.content.secondary} size={20} />
        </div>
        <NText variant="labelSmallDefault" theme={t} as="span" style={{ margin: 0 }}>
          {text}
        </NText>
      </motion.div>
      {index < total - 1 && (
        <div
          style={{
            height: 1,
            background: t.color.border.secondary,
            marginLeft: t.spacing[5],
            marginRight: t.spacing[5],
          }}
        />
      )}
    </>
  );
}

/* ─────────── Main Screen ─────────── */

export default function EligibilityScreen({
  locale,
  onClose,
  onSelectFixed,
  onSelectFlexible,
}: {
  locale: Locale;
  onClose?: () => void;
  onSelectFixed?: () => void;
  onSelectFlexible?: () => void;
}) {
  const { nuds } = useTheme();
  const t = nuds;
  const { debtOverrides, effectiveRules } = useEmulatorConfig();
  const tr = getTranslations(locale);
  const el = tr.eligibility;

  const [selectedOption, setSelectedOption] = useState<OptionType>('fixed');

  const baseUseCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = baseUseCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);

  const discountsDisabled =
    effectiveRules.offer1DiscountPercent === 0 &&
    effectiveRules.offer2DiscountPercent === 0 &&
    effectiveRules.offer3DiscountPercent === 0;

  const originalTotal = debtOverrides.cardBalance + debtOverrides.loanBalance;
  const discountPercent = discountsDisabled ? 0 : effectiveRules.offer1DiscountPercent;
  const discountAmount = originalTotal * discountPercent;
  const discountedTotal = originalTotal - discountAmount;

  const discountBadgeText =
    !discountsDisabled && discountAmount > 0
      ? interpolate(el.discountBadge, { amount: fmtAmount(discountAmount) })
      : '';

  const optionData = selectedOption === 'fixed' ? el.fixedOption : el.flexibleOption;
  const benefits = optionData.benefits;
  const ctaText = optionData.cta;

  const handleCta = () => {
    if (selectedOption === 'fixed') {
      onSelectFixed?.();
    } else {
      onSelectFlexible?.();
    }
  };

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
          title={el.title}
          variant="default"
          leading={
            onClose ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6.2 6.67 12.87 0l1.18 1.18-6.08 6.08 6.08 6.07-1.18 1.18L6.2 7.85a.83.83 0 0 1 0-1.18Z" fill={t.color.content.primary} transform="translate(5.955, 2.744)" />
              </svg>
            ) : undefined
          }
          onPressLeading={onClose}
          theme={t}
          style={{ padding: `0 ${t.spacing[2]}px ${t.spacing[3]}px` }}
        />
      </div>

      {/* Scrollable content */}
      <div
        className="nf-proto__scroll"
        style={{
          padding: `0 0 ${120 + t.spacing[5]}px`,
        }}
      >
        {/* Balance section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: t.spacing[4],
            paddingBottom: t.spacing[6],
            textAlign: 'center',
          }}
        >
          <NText variant="subtitleSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: 0 }}>
            {el.totalBalanceLabel}
          </NText>

          {!discountsDisabled && discountAmount > 0 && (
            <NText variant="labelXSmallDefault" tone="secondary" theme={t} as="p" style={{ margin: '2px 0 0' }}>
              {el.fromPrefix}{' '}
              <span style={{ textDecoration: 'line-through' }}>{fmtAmount(originalTotal)}</span>{' '}
              {el.toSuffix}
            </NText>
          )}

          <div style={{ padding: '7px 0' }}>
            <NText variant="titleLarge" theme={t} as="p" style={{ margin: 0 }}>
              {fmtAmount(discountedTotal)}
            </NText>
          </div>

          {discountBadgeText && (
            <motion.span
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-block', marginTop: t.spacing[2] }}
            >
              <Badge label={discountBadgeText} color="success" theme={t} />
            </motion.span>
          )}
        </motion.div>

        {/* Question */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
          style={{
            textAlign: 'center',
            marginTop: t.spacing[6],
            marginBottom: t.spacing[3],
          }}
        >
          <NText
            variant="titleXSmall"
            theme={t}
            as="p"
            style={{ margin: 0, whiteSpace: 'pre-line' }}
          >
            {el.question}
          </NText>
        </motion.div>

        {/* Option cards — 2-column flex */}
        <div
          style={{
            display: 'flex',
            gap: t.spacing[3],
            padding: `0 ${t.spacing[4]}px`,
            marginBottom: t.spacing[4],
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, type: 'spring', stiffness: 200, damping: 24 }}
            style={{ flex: 1, display: 'flex' }}
          >
            <OptionCard
              type="fixed"
              selected={selectedOption === 'fixed'}
              onSelect={() => setSelectedOption('fixed')}
              title={el.fixedOption.title}
              subtitle={el.fixedOption.subtitle}
              t={t}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, type: 'spring', stiffness: 200, damping: 24 }}
            style={{ flex: 1, display: 'flex' }}
          >
            <OptionCard
              type="flexible"
              selected={selectedOption === 'flexible'}
              onSelect={() => setSelectedOption('flexible')}
              title={el.flexibleOption.title}
              subtitle={el.flexibleOption.subtitle}
              t={t}
            />
          </motion.div>
        </div>

        {/* Benefits list */}
        <div style={{ width: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedOption}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {benefits.map((text, i) => (
                <BenefitRow
                  key={`${selectedOption}-${i}`}
                  text={text}
                  index={i}
                  total={benefits.length}
                  t={t}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${t.spacing[4]}px ${t.spacing[5]}px ${t.spacing[6]}px`,
          background: `${t.color.background.screen}F0`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: t.color.border.secondary,
          }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedOption}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              label={ctaText}
              variant="primary"
              expanded
              theme={t}
              onClick={handleCta}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
