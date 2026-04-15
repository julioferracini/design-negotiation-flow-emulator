import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { getTranslations } from '@shared/i18n';
import type { Locale } from '@shared/i18n';
import {
  getUseCaseForLocale,
  generateInstallmentList,
  type PlanConfig,
  type UseCase,
} from '../../../config/useCases';
import { formatCurrency, interpolate } from '../../../config/formatters';

const ANIM_DURATION = 0.42;
const STAGGER = 0.08;

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

function formatPlan(
  plan: PlanConfig,
  sg: ReturnType<typeof getTranslations>['suggested'],
  fmtAmount: (v: number) => string,
) {
  const installments =
    plan.installmentCount === 1
      ? interpolate(sg.installmentOf, { amount: fmtAmount(plan.installmentAmount) })
      : interpolate(sg.installmentsOf, { count: String(plan.installmentCount), amount: fmtAmount(plan.installmentAmount) });
  const discount = interpolate(sg.discountAmount, { amount: fmtAmount(plan.discountAmount) });
  const total = interpolate(sg.totalLabel, { amount: fmtAmount(plan.totalAmount) });
  return { installments, discount, total };
}

/* ── SVG Icons (NuDS paths) ─────────────────────────────────────── */

function ChevronRight({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ transform: 'rotate(-90deg)' }}>
      <g transform="translate(4.827, 6.997)">
        <path
          d="M5.17259 3.99408L1.17851 0L0 1.17851L4.58333 5.76184C4.90877 6.08728 5.43641 6.08728 5.76184 5.76184L10.3452 1.17851L9.16667 0L5.17259 3.99408Z"
          fill={color}
        />
      </g>
    </svg>
  );
}

function ArrowBack({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
      <g transform="translate(5.955, 2.744)">
        <path
          d="M0.244078 6.66667L6.91074 0L8.08926 1.17851L2.01184 7.25592L8.08926 13.3333L6.91074 14.5118L0.244078 7.84518C-0.0813592 7.51974 -0.0813592 6.9921 0.244078 6.66667Z"
          fill={color}
        />
      </g>
    </svg>
  );
}

function HelpCircleIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <g transform="translate(1.667, 1.667)">
        <path
          d="M9.16667 5.22329C8.84893 5.03985 8.47954 4.96637 8.11579 5.01426C7.75204 5.06215 7.41426 5.22873 7.15483 5.48816C6.89539 5.74759 6.72882 6.08537 6.68093 6.44913C6.65911 6.61488 6.66248 6.78177 6.68998 6.94444L5.04663 7.22222C4.99163 6.8969 4.98488 6.56306 5.02852 6.23158C5.1243 5.50408 5.45745 4.82851 5.97631 4.30965C6.49518 3.79079 7.17075 3.45763 7.89825 3.36185C8.62575 3.26608 9.36453 3.41303 10 3.77992C10.6355 4.14681 11.1321 4.71313 11.4129 5.39106C11.6937 6.06898 11.743 6.82062 11.5531 7.5294C11.3632 8.23818 10.9447 8.86448 10.3625 9.31118C10.0103 9.58147 9.69651 9.84447 9.47113 10.1207C9.24918 10.3927 9.16667 10.6122 9.16667 10.8029V10.8333H7.5V10.8029C7.5 10.0899 7.81998 9.50803 8.17976 9.06707C8.5361 8.63033 8.98327 8.26875 9.34794 7.98893C9.63901 7.76558 9.84826 7.45242 9.94321 7.09804C10.0382 6.74365 10.0135 6.36783 9.87314 6.02886C9.73273 5.6899 9.48441 5.40674 9.16667 5.22329Z"
          fill={color}
        />
        <path d="M9.16667 13.3333V11.6667H7.5V13.3333H9.16667Z" fill={color} />
        <path
          d="M8.33333 16.6667C12.9357 16.6667 16.6667 12.9357 16.6667 8.33333C16.6667 3.73096 12.9357 0 8.33333 0C3.73096 0 0 3.73096 0 8.33333C0 12.9357 3.73096 16.6667 8.33333 16.6667ZM8.33333 15C4.65143 15 1.66667 12.0152 1.66667 8.33333C1.66667 4.65143 4.65143 1.66667 8.33333 1.66667C12.0152 1.66667 15 4.65143 15 8.33333C15 12.0152 12.0152 15 8.33333 15Z"
          fill={color}
        />
      </g>
    </svg>
  );
}

/* ── Navigation Row (NuDS Navigation List pattern) ──────────────── */

function NavRow({
  label,
  description,
  description2,
  trailing,
  chevronColor,
  showDivider = false,
  onPress,
  palette,
}: {
  label: string;
  description?: string;
  description2?: string;
  trailing?: React.ReactNode;
  chevronColor?: string;
  showDivider?: boolean;
  onPress?: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <div>
      <div
        role={onPress ? 'button' : undefined}
        tabIndex={onPress ? 0 : undefined}
        onClick={onPress}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 16px',
          cursor: onPress ? 'pointer' : 'default',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{
            fontSize: 14, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.14px',
            color: palette.textPrimary, transition: 'color 0.3s',
          }}>
            {label}
          </span>
          {description != null && (
            <span style={{
              fontSize: 14, fontWeight: 400, lineHeight: 1.5,
              color: palette.positive, transition: 'color 0.3s',
            }}>
              {description}
            </span>
          )}
          {description2 != null && (
            <span style={{
              fontSize: 14, fontWeight: 400, lineHeight: 1.5,
              color: palette.textSecondary, transition: 'color 0.3s',
            }}>
              {description2}
            </span>
          )}
        </div>

        {trailing && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {trailing}
          </div>
        )}

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <ChevronRight color={chevronColor ?? palette.textSecondary} />
        </div>
      </div>

      {showDivider && (
        <div style={{
          height: 1,
          background: palette.border, transition: 'background 0.3s',
        }} />
      )}
    </div>
  );
}

/* ── List Card (NuDS Navigation List container) ─────────────────── */

function ListCard({
  children,
  accentHighlight = false,
  palette,
}: {
  children: React.ReactNode;
  accentHighlight?: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        border: `1px solid ${accentHighlight ? withAlpha(palette.accent, 0.25) : palette.border}`,
        background: accentHighlight ? withAlpha(palette.accent, 0.06) : palette.background,
        overflow: 'hidden',
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      {children}
    </div>
  );
}

/* ── NuDS Badge (web replica) ───────────────────────────────────── */

function NuDSBadge({
  label,
  palette,
}: {
  label: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.3,
        background: withAlpha(palette.accent, 0.08),
        color: palette.accent,
        whiteSpace: 'nowrap',
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      {label}
    </span>
  );
}

/* ── Installment List Bottom Sheet ──────────────────────────────── */

function InstallmentListSheet({
  visible,
  onClose,
  locale,
  palette,
}: {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const t = getTranslations(locale);
  const sg = t.suggested;
  const useCase = getUseCaseForLocale(locale);
  const curr = useCase.currency;
  const fmtAmount = (v: number) => formatCurrency(v, curr);
  const items = useMemo(() => generateInstallmentList(useCase.debt), [useCase.debt]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)', zIndex: 20,
            }}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              maxHeight: '85%', background: palette.background,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              zIndex: 30, display: 'flex', flexDirection: 'column',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
              transition: 'background 0.3s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: palette.border }} />
            </div>
            <div style={{ padding: '12px 24px 16px' }}>
              <h2 style={{
                margin: 0, fontSize: 20, fontWeight: 600, lineHeight: 1.2,
                color: palette.textPrimary, letterSpacing: '-0.3px',
              }}>
                {t.installmentList.title}
              </h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 24 }}>
              {items.map((item, i) => {
                const installments = item.count === 1
                  ? interpolate(sg.installmentOf, { amount: fmtAmount(item.amount) })
                  : interpolate(sg.installmentsOf, { count: String(item.count), amount: fmtAmount(item.amount) });
                const discount = interpolate(sg.discountAmount, { amount: fmtAmount(item.discount) });
                const total = interpolate(sg.totalLabel, { amount: fmtAmount(item.total) });
                return (
                  <NavRow
                    key={item.count}
                    label={installments}
                    description={discount}
                    description2={total}
                    trailing={item.recommended ? (
                      <NuDSBadge label={t.installmentList.recommendedLabel} palette={palette} />
                    ) : undefined}
                    chevronColor={item.recommended ? palette.accent : undefined}
                    showDivider={i < items.length - 1}
                    palette={palette}
                  />
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Main Screen ────────────────────────────────────────────────── */

export default function SuggestedConditionsScreen({
  locale,
  plans: plansProp,
  onBack,
  onSelectPlan,
}: {
  locale: Locale;
  plans?: PlanConfig[];
  onBack?: () => void;
  onSelectPlan?: (plan: PlanConfig) => void;
}) {
  const { palette } = useTheme();
  const t = getTranslations(locale);
  const sg = t.suggested;
  const [showSheet, setShowSheet] = useState(false);

  const useCase: UseCase = useMemo(() => getUseCaseForLocale(locale), [locale]);
  const curr = useCase.currency;
  const fmtAmount = useCallback((v: number) => formatCurrency(v, curr), [curr]);

  const plans = plansProp ?? useCase.plans;
  const highlightPlan = plans.find((p) => p.bestMatch) ?? plans[0];
  const secondaryPlans = plans.filter((p) => p.id !== highlightPlan.id);
  const hp = formatPlan(highlightPlan, sg, fmtAmount);

  const baseDelay = 0.1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: palette.background,
        color: palette.textPrimary,
        transition: 'background 0.3s, color 0.3s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── NavigationBar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.36 }}
        style={{ paddingTop: 'var(--safe-area-top, 59px)', flexShrink: 0 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0 4px', minHeight: 64,
        }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              style={{
                width: 44, height: 44, border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowBack color={palette.textPrimary} />
            </button>
          )}
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'center',
            color: palette.textPrimary, transition: 'color 0.3s',
            marginRight: onBack ? 44 : 0,
          }}>
            {sg.headerTitle}
          </span>
        </div>
      </motion.div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: 0.36, ease: 'easeOut', delay: baseDelay },
            y: { type: 'spring', stiffness: 200, damping: 24, delay: baseDelay },
          }}
          style={{ padding: '8px 24px 0' }}
        >
          <h1 style={{
            margin: '0 0 24px', fontSize: 28, fontWeight: 500, lineHeight: 1.2,
            letterSpacing: '-0.84px', color: palette.textPrimary,
            whiteSpace: 'pre-line', transition: 'color 0.3s',
          }}>
            {sg.title}
          </h1>
        </motion.div>

        {/* Target Amount */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: 0.36, ease: 'easeOut', delay: baseDelay + STAGGER },
            y: { type: 'spring', stiffness: 200, damping: 24, delay: baseDelay + STAGGER },
          }}
          style={{ padding: '0 24px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{
              fontSize: 28, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.84px',
              color: palette.textSecondary, transition: 'color 0.3s',
            }}>
              {curr.symbol}
            </span>
            <span style={{
              fontSize: 28, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.84px',
              color: palette.textPrimary, transition: 'color 0.3s',
            }}>
              {formatCurrency(useCase.targetAmount, curr, { showSymbol: false })}
            </span>
          </div>
          <p style={{
            margin: '8px 0 0', fontSize: 14, lineHeight: 1.3, letterSpacing: '-0.14px',
            color: palette.textSecondary, transition: 'color 0.3s',
          }}>
            {sg.targetLabel}
          </p>
        </motion.div>

        {/* Highlight Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: ANIM_DURATION, ease: 'easeOut', delay: baseDelay + STAGGER * 3 },
            y: { type: 'spring', stiffness: 180, damping: 22, delay: baseDelay + STAGGER * 3 },
          }}
          style={{ padding: '0 16px 12px' }}
        >
          <ListCard accentHighlight palette={palette}>
            <NavRow
              label={hp.installments}
              description={hp.discount}
              description2={hp.total}
              trailing={
                highlightPlan.bestMatch ? (
                  <NuDSBadge label={sg.bestMatchBadge} palette={palette} />
                ) : undefined
              }
              chevronColor={palette.accent}
              onPress={onSelectPlan ? () => onSelectPlan(highlightPlan) : undefined}
              palette={palette}
            />
          </ListCard>
        </motion.div>

        {/* Secondary Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: ANIM_DURATION, ease: 'easeOut', delay: baseDelay + STAGGER * 4 },
            y: { type: 'spring', stiffness: 180, damping: 22, delay: baseDelay + STAGGER * 4 },
          }}
          style={{ padding: '0 16px' }}
        >
          <ListCard palette={palette}>
            {secondaryPlans.map((plan, i) => {
              const fp = formatPlan(plan, sg, fmtAmount);
              return (
                <NavRow
                  key={plan.id}
                  label={fp.installments}
                  description={fp.discount}
                  description2={fp.total}
                  showDivider
                  onPress={onSelectPlan ? () => onSelectPlan(plan) : undefined}
                  palette={palette}
                />
              );
            })}
            <NavRow
              label={sg.moreOptions}
              description2={interpolate(sg.moreOptionsSubtitle, { max: String(useCase.debt.installmentRange.max) })}
              chevronColor={palette.accent}
              onPress={() => setShowSheet(true)}
              palette={palette}
            />
          </ListCard>
        </motion.div>

        {/* FAQ Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            opacity: { duration: ANIM_DURATION, ease: 'easeOut', delay: baseDelay + STAGGER * 5 },
            y: { type: 'spring', stiffness: 180, damping: 22, delay: baseDelay + STAGGER * 5 },
          }}
          style={{ padding: '24px 20px' }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 16, borderRadius: 24,
              background: palette.surface, cursor: 'pointer',
              transition: 'background 0.3s',
            }}
          >
            <p style={{
              margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.3,
              color: palette.textPrimary, letterSpacing: '-0.16px',
              transition: 'color 0.3s',
            }}>
              {sg.faqTitle}
            </p>
            <div style={{
              width: 40, height: 40, borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: palette.background, flexShrink: 0, marginLeft: 12,
              transition: 'background 0.3s',
            }}>
              <HelpCircleIcon color={palette.textSecondary} size={24} />
            </div>
          </div>
        </motion.div>

        <div style={{ height: 16 }} />
      </div>

      {/* Installment List Bottom Sheet */}
      <InstallmentListSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        locale={locale}
        palette={palette}
      />
    </div>
  );
}
