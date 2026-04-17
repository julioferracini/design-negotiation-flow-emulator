/**
 * Experience Architecture — mocked data layer.
 *
 * This module is the single source of truth for the Experience
 * Architecture page and the Emulator's Capability Panel. Everything
 * here is MOCKED for now, but the shapes and exported functions are
 * designed to be swapped for an API/backend call later without
 * touching the UI:
 *
 *   - `buildMatrixRows()`    — flattened matrix-ready view of all use cases
 *   - `getMatrixRow(ucId)`   — single-row lookup (for the Capability Panel)
 *   - `getExperimentsCount(ucId)` — per-use-case mocked experiment counter
 *   - `SCREEN_KEYS`, `SCREEN_LABELS`, `FORMULA_LABELS` — display metadata
 *
 * The product-line source (`PRODUCT_LINES`) is not duplicated here;
 * this module reads from `../config/productLines` and enriches it.
 */

import { PRODUCT_LINES } from '../config/productLines';
import type {
  AmortizationFormulaId,
  Locale,
  ProductLineId,
  ScreenVisibility,
  UseCaseDefinition,
} from '../types';

/* ─────────────── Screen keys & labels ─────────────── */

/**
 * Screens surfaced in the capability matrix. `eligibility` is in the
 * type but intentionally excluded from the editorial matrix view.
 */
export const SCREEN_KEYS: readonly (keyof ScreenVisibility)[] = [
  'offerHub',
  'inputValue',
  'simulation',
  'suggested',
  'dueDate',
  'summary',
  'terms',
  'pin',
  'loading',
  'feedback',
] as const;

export const SCREEN_LABELS: Record<keyof ScreenVisibility, string> = {
  offerHub: 'Offer Hub',
  eligibility: 'Eligibility',
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

/* ─────────────── Formula metadata (display-only) ─────────────── */

/**
 * Formula labels used in matrix cells and capability-row badges.
 * Colors are NOT defined here — we reserve `var(--nf-accent)` for
 * emphasis and render the badge via `.nf-page__badge` which is
 * token-driven.
 */
export const FORMULA_LABELS: Record<AmortizationFormulaId, string> = {
  price: 'Price',
  sac: 'SAC',
  flat_discount: 'Flat',
};

/* ─────────────── Mocked experiments per use case ─────────────── */

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

export function getExperimentsCount(useCaseId: string): number {
  return MOCK_EXPERIMENTS[useCaseId] ?? 0;
}

/* ─────────────── Matrix row (flattened, API-ready shape) ─────────────── */

/**
 * One row per use case — denormalized so the UI doesn't need to
 * join across product lines at render time. Shape is stable and
 * safe to map onto an API response later.
 */
export interface ExperienceMatrixRow {
  useCaseId: string;
  useCaseName: string;
  useCaseDescription: string;
  productLineId: ProductLineId;
  productLineName: string;
  flowType: UseCaseDefinition['flowType'];
  supportedLocales: Locale[];
  formula: AmortizationFormulaId;
  enabledScreens: (keyof ScreenVisibility)[];
  enabledScreenCount: number;
  totalScreens: number;
  coverage: Record<keyof ScreenVisibility, boolean>;
  experiments: number;
  installmentRange: { min: number; max: number };
  interestRateMonthly: number;
  discountPercentageMax: number;
}

export function buildMatrixRows(): ExperienceMatrixRow[] {
  const rows: ExperienceMatrixRow[] = [];

  for (const pl of PRODUCT_LINES) {
    for (const uc of pl.useCases) {
      const formula: AmortizationFormulaId = uc.defaults.formula ?? 'price';
      const coverage = Object.fromEntries(
        SCREEN_KEYS.map((k) => [k, Boolean(uc.screens[k])]),
      ) as Record<keyof ScreenVisibility, boolean>;
      const enabledScreens = SCREEN_KEYS.filter((k) => uc.screens[k]);

      rows.push({
        useCaseId: uc.id,
        useCaseName: uc.name,
        useCaseDescription: uc.description,
        productLineId: pl.id,
        productLineName: pl.name,
        flowType: uc.flowType,
        supportedLocales: uc.supportedLocales,
        formula,
        enabledScreens,
        enabledScreenCount: enabledScreens.length,
        totalScreens: SCREEN_KEYS.length,
        coverage,
        experiments: getExperimentsCount(uc.id),
        installmentRange: uc.defaults.installmentRange,
        interestRateMonthly: uc.defaults.interestRateMonthly,
        discountPercentageMax: uc.defaults.discountPercentageMax,
      });
    }
  }

  return rows;
}

export function getMatrixRow(useCaseId: string): ExperienceMatrixRow | undefined {
  return buildMatrixRows().find((r) => r.useCaseId === useCaseId);
}

/* ─────────────── Product-line metadata (for fold 2 cards) ─────────────── */

/**
 * Brand illustration assigned to each product line for the feature
 * grid (Fold 2 of Experience Architecture). Temporary reuse of
 * existing assets in `web/public/brand/`; replace with dedicated
 * illustrations when available.
 */
export const PRODUCT_LINE_BRAND: Record<ProductLineId, { image: string; teaser: string }> = {
  'debt-resolution': {
    image: '/brand/score.png',
    teaser: 'Renegotiate overdue debt across products, markets and discount policies.',
  },
  'lending': {
    image: '/brand/magic-coin.png',
    teaser: 'Origination flows for payroll, personal and public-servant credit.',
  },
  'credit-card': {
    image: '/brand/homem-card.png',
    teaser: 'Card billing, installment plans and refinancing across Latam markets.',
  },
};

/* ─────────────── Aggregates used by the hero intro stats ─────────────── */

export interface ExperienceStats {
  productLines: number;
  useCases: number;
  screens: number;
  locales: number;
  formulas: number;
  experiments: number;
}

export function getExperienceStats(): ExperienceStats {
  const rows = buildMatrixRows();
  const locales = new Set(rows.flatMap((r) => r.supportedLocales));
  const formulas = new Set(rows.map((r) => r.formula));
  const experiments = rows.reduce((acc, r) => acc + r.experiments, 0);

  return {
    productLines: PRODUCT_LINES.length,
    useCases: rows.length,
    screens: SCREEN_KEYS.length,
    locales: locales.size,
    formulas: formulas.size,
    experiments,
  };
}
