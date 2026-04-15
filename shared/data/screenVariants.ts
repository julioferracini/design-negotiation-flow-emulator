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
  'offerHub', 'inputValue', 'simulation', 'suggested',
  'dueDate', 'summary', 'terms', 'pin', 'loading', 'feedback',
];

export const READY_SCREENS: Set<ScreenKey> = new Set([
  'offerHub', 'suggested', 'simulation', 'summary', 'inputValue', 'dueDate', 'terms',
]);

export const SCREEN_BLOCK_META: Record<ScreenKey, BlockMeta> = {
  offerHub: { key: 'offerHub', title: 'Offer Hub', description: 'Three renegotiation offers', path: 'offer-hub' },
  inputValue: { key: 'inputValue', title: 'Input Value', description: 'ATM-style numeric keypad', path: 'input-value' },
  simulation: { key: 'simulation', title: 'Simulation', description: 'Flow A slider with animations', path: 'simulation' },
  suggested: { key: 'suggested', title: 'Suggested Conditions', description: 'Flow B best-match card', path: 'suggested-conditions' },
  dueDate: { key: 'dueDate', title: 'Due Date', description: 'Calendar for payment date', path: 'due-date' },
  summary: { key: 'summary', title: 'Summary', description: 'Review with edit capability', path: 'summary' },
  terms: { key: 'terms', title: 'Terms & Conditions', description: 'Scrollable legal copy', path: 'terms-and-conditions' },
  pin: { key: 'pin', title: 'PIN', description: '4-digit confirmation', path: 'pin' },
  loading: { key: 'loading', title: 'Loading', description: 'Progress animation', path: 'loading' },
  feedback: { key: 'feedback', title: 'Feedback', description: 'Success screen with CTA', path: 'feedback' },
};

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
