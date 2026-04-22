import type { ScreenVisibility } from '../types';

type ScreenKey = keyof ScreenVisibility;

export type ScreenContentVariant = {
  id: string;
  label: string;
  description: string;
  version: string;
  status: 'ready' | 'soon';
  isDefault?: boolean;
  screenPath: string;
};

export type BlockMeta = {
  key: ScreenKey;
  title: string;
  description: string;
  path: string;
};

export const SCREEN_BLOCK_ORDER: ScreenKey[] = [
  'offerHub', 'eligibility', 'inputValue', 'simulation', 'suggested',
  'dueDate', 'summary', 'terms', 'pin', 'loading', 'feedback',
];

export const READY_SCREENS: Set<ScreenKey> = new Set([
  'offerHub', 'eligibility', 'suggested', 'simulation', 'summary', 'inputValue', 'dueDate', 'terms', 'pin', 'loading', 'feedback',
]);

export const SCREEN_BLOCK_META: Record<ScreenKey, BlockMeta> = {
  offerHub: { key: 'offerHub', title: 'Offer Hub', description: 'Centralize and compare debt resolution offers', path: 'offer-hub' },
  eligibility: { key: 'eligibility', title: 'Eligibility', description: 'Qualification gate for installment plans', path: 'eligibility' },
  inputValue: { key: 'inputValue', title: 'Input Value', description: 'Numeric keypad for installment and downpayment amounts', path: 'input-value' },
  simulation: { key: 'simulation', title: 'Simulation', description: 'Interactive slider to explore payment scenarios', path: 'simulation' },
  suggested: { key: 'suggested', title: 'Suggested Conditions', description: 'Present available plans and recommend the best fit', path: 'suggested-conditions' },
  dueDate: { key: 'dueDate', title: 'Due Date', description: 'Calendar with locale-aware business day rules', path: 'due-date' },
  summary: { key: 'summary', title: 'Summary', description: 'Consolidate every decision into an editable checkout', path: 'summary' },
  terms: { key: 'terms', title: 'Terms & Conditions', description: 'Scrollable legal copy with scroll-to-confirm', path: 'terms-and-conditions' },
  pin: { key: 'pin', title: 'PIN', description: '4-digit confirmation code entry', path: 'pin' },
  loading: { key: 'loading', title: 'Loading', description: 'Progress animation during processing', path: 'loading' },
  feedback: { key: 'feedback', title: 'Feedback', description: 'Success/error screen with next-step CTAs', path: 'feedback' },
};

/**
 * Pack categorization — groups screens by purpose.
 * - Onboarding Pack: pre-flow screens (marketing, product intro, offer comparison)
 * - Negotiation Pack: user-facing decision screens
 * - System Pack: infrastructure screens (auth, progress, completion)
 */
export type PackId = 'onboarding' | 'negotiation' | 'system';

/**
 * Display-only item for packs — used for "Soon" screens that are planned
 * but not yet wired into the flow / ScreenVisibility type.
 */
export interface PackExtraItem {
  id: string;
  title: string;
  description: string;
}

export interface Pack {
  id: PackId;
  title: string;
  description: string;
  screens: ScreenKey[];
  /** Optional "Soon" items shown in the Building Blocks menu but not yet part of the flow. */
  extraItems?: PackExtraItem[];
}

export const PACKS: Pack[] = [
  {
    id: 'onboarding',
    title: 'Onboarding Pack',
    description: 'Pre-flow screens that introduce the product — marketing, product onboarding, and offer comparison.',
    screens: [],
    extraItems: [
      {
        id: 'entryScreen',
        title: 'Entry Screen',
        description: 'Marketing, offer or product onboarding screen presenting the product before the flow starts.',
      },
      {
        id: 'compareOffers',
        title: 'Compare Offers',
        description: 'Side-by-side offer comparator to help the user evaluate available options.',
      },
    ],
  },
  {
    id: 'negotiation',
    title: 'Negotiation Pack',
    description: 'User-facing screens where decisions are made — offers, values, dates, and confirmation.',
    screens: ['offerHub', 'eligibility', 'inputValue', 'simulation', 'suggested', 'dueDate', 'summary', 'terms'],
  },
  {
    id: 'system',
    title: 'System Pack',
    description: 'Infrastructure screens — authentication, processing, and completion.',
    screens: ['pin', 'loading', 'feedback'],
  },
];

export const SCREEN_CONTENT_VARIANTS: Partial<Record<ScreenKey, ScreenContentVariant[]>> = {
  offerHub: [
    {
      id: 'default',
      label: 'Default',
      description: 'All debt types with segment control tabs (All, Credit Card, Loans). Multi-product renegotiation.',
      version: 'v1.2',
      status: 'ready',
      isDefault: true,
      screenPath: 'offer-hub',
    },
    {
      id: 'lending-only',
      label: 'Lending',
      description: 'Loan offers only. Segment control is hidden since there is a single product category.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'offer-hub?variant=lending-only',
    },
    {
      id: 'credit-card-only',
      label: 'Credit Card',
      description: 'Credit card offers only. Segment control is hidden since there is a single product category.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'offer-hub?variant=credit-card-only',
    },
    {
      id: 'stress-test',
      label: 'Stress Test (8)',
      description: '8 offer cards in a single view. No segments. Tests scroll, layout density, and card stagger.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'offer-hub?variant=stress-test',
    },
  ],
  simulation: [
    {
      id: 'default',
      label: 'Default',
      description: 'Standard simulation with downpayment always active. If debt exceeds the locale threshold, 5% minimum is pre-filled; otherwise starts at zero.',
      version: 'v2.0',
      status: 'ready',
      isDefault: true,
      screenPath: 'simulation',
    },
    {
      id: 'entry-from-21',
      label: 'Entry from Installment 21',
      description: 'Downpayment kicks in starting at installment 21. Common for long-term debt restructuring.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'simulation?variant=entry-from-21',
    },
  ],
  inputValue: [
    {
      id: 'installment-value',
      label: 'Installment Value',
      description: 'Clean numeric keypad input without suggestion shortcuts. User types the full amount manually.',
      version: 'v1.0',
      status: 'ready',
      isDefault: true,
      screenPath: 'input-value?variant=installment-value',
    },
    {
      id: 'installment-value-chips',
      label: 'Installment w/ Chips',
      description: 'Numeric keypad with suggestion chips for quick amount selection. Speeds up input for common values.',
      version: 'v1.1',
      status: 'ready',
      screenPath: 'input-value?variant=installment-value-chips',
    },
    {
      id: 'downpayment-value',
      label: 'Downpayment Value',
      description: 'Numeric keypad to define the down payment amount. Used when entry payment is required.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'input-value?variant=downpayment-value',
    },
    {
      id: 'downpayment-value-chips',
      label: 'Downpayment w/ Chips',
      description: 'Numeric keypad with suggestion chips for downpayment. Quick selection for common entry values.',
      version: 'v1.1',
      status: 'ready',
      screenPath: 'input-value?variant=downpayment-value-chips',
    },
  ],
  loading: [
    {
      id: 'three-step',
      label: '3-Step',
      description: 'Three-step loading motion. Each step fades in, the previous one holds at 10% opacity above, and the progress bar advances to 33% → 66% → 100%.',
      version: 'v1.0',
      status: 'ready',
      isDefault: true,
      screenPath: 'loading?variant=threeStep',
    },
    {
      id: 'two-step',
      label: '2-Step',
      description: 'Two-step loading motion. Shorter sequence used between quicker transitions; fills the progress bar 50% → 100%.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'loading?variant=twoStep',
    },
  ],
  dueDate: [
    {
      id: 'first-installment-date',
      label: 'First Installment Date',
      description: 'Calendar to select the first installment payment date. Subsequent payments follow monthly.',
      version: 'v1.0',
      status: 'ready',
      isDefault: true,
      screenPath: 'due-date?variant=first-installment-date',
    },
    {
      id: 'downpayment-date',
      label: 'Downpayment Date',
      description: 'Calendar to select when the downpayment (entry) will be paid. Used for scheduling the initial payment.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'due-date?variant=downpayment-date',
    },
    {
      id: 'single-payment-date',
      label: 'Single Payment Date',
      description: 'Calendar to select the payment date. Simple date picker for one-time payments.',
      version: 'v1.0',
      status: 'ready',
      screenPath: 'due-date?variant=single-payment-date',
    },
  ],
};
