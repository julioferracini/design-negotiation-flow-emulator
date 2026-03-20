import type { TransitionPresetName } from '../transitions/presets';

export type ScreenType = 'normal' | 'bottomSheet' | 'overlay' | 'fullscreen';

export type ScreenMeta = {
  name: string;
  title: string;
  type: ScreenType;
  component: string;
  transition: TransitionPresetName;
  description: string;
  status: 'done' | 'soon';
};

/**
 * Central registry of all screens in the app.
 *
 * To add a new screen:
 * 1. Create the component in screens/
 * 2. Add an entry here with a unique name
 * 3. Reference that name in a flow (config/flows.ts)
 */
export const SCREEN_REGISTRY: Record<string, ScreenMeta> = {
  start: {
    name: 'start',
    title: 'Start / Language Selector',
    type: 'normal',
    component: 'screens/StartScreen',
    transition: 'none',
    description: 'Entry screen where the user picks a language.',
    status: 'done',
  },
  offerHub: {
    name: 'offerHub',
    title: 'Offer Hub',
    type: 'normal',
    component: 'screens/OfferHubScreen',
    transition: 'slideLeft',
    description: 'Three renegotiation offers (cash, short-term, long-term).',
    status: 'done',
  },
  suggestedConditions: {
    name: 'suggestedConditions',
    title: 'Suggested Conditions',
    type: 'normal',
    component: 'screens/ConditionsScreen',
    transition: 'fade',
    description: 'Best-match card, secondary plan options, and bottom sheet list.',
    status: 'done',
  },
  installmentList: {
    name: 'installmentList',
    title: 'Installment List',
    type: 'bottomSheet',
    component: 'screens/InstallmentListModal',
    transition: 'pushIn',
    description: 'Full list of all installment options (modal bottom sheet).',
    status: 'done',
  },
  installmentValue: {
    name: 'installmentValue',
    title: 'Installment Value',
    type: 'normal',
    component: 'screens/InstallmentValueScreen',
    transition: 'slideLeft',
    description: 'ATM-style numeric keypad for monthly payment target.',
    status: 'soon',
  },
  simulation: {
    name: 'simulation',
    title: 'Simulation',
    type: 'normal',
    component: 'screens/SimulationScreen',
    transition: 'slideLeft',
    description: 'Slider with animated numbers and downpayment alert.',
    status: 'done',
  },
  dueDate: {
    name: 'dueDate',
    title: 'Due Date',
    type: 'bottomSheet',
    component: 'screens/DueDateScreen',
    transition: 'slideUp',
    description: 'Calendar bottom sheet for payment date selection.',
    status: 'soon',
  },
  downPaymentValue: {
    name: 'downPaymentValue',
    title: 'Down Payment Value',
    type: 'normal',
    component: 'screens/DownPaymentValueScreen',
    transition: 'slideLeft',
    description: 'Slider or input for downpayment amount.',
    status: 'soon',
  },
  downPaymentDate: {
    name: 'downPaymentDate',
    title: 'Down Payment Date',
    type: 'bottomSheet',
    component: 'screens/DownPaymentDateScreen',
    transition: 'slideUp',
    description: 'Calendar picker for downpayment date.',
    status: 'soon',
  },
  summary: {
    name: 'summary',
    title: 'Summary',
    type: 'normal',
    component: 'screens/SummaryScreen',
    transition: 'slideLeft',
    description: 'Full review with installments, interest, and edit capability.',
    status: 'soon',
  },
  terms: {
    name: 'terms',
    title: 'Terms & Conditions',
    type: 'normal',
    component: 'screens/TermsScreen',
    transition: 'slideLeft',
    description: 'Scrollable legal copy, confirm after reading.',
    status: 'soon',
  },
  pin: {
    name: 'pin',
    title: 'PIN',
    type: 'overlay',
    component: 'screens/PinScreen',
    transition: 'fade',
    description: '4-digit confirmation overlay.',
    status: 'soon',
  },
  loading: {
    name: 'loading',
    title: 'Loading',
    type: 'fullscreen',
    component: 'screens/LoadingScreen',
    transition: 'fade',
    description: 'Three-step progress animation.',
    status: 'soon',
  },
  success: {
    name: 'success',
    title: 'Success',
    type: 'normal',
    component: 'screens/SuccessScreen',
    transition: 'fade',
    description: 'Confirmation screen after successful agreement.',
    status: 'soon',
  },
  feedback: {
    name: 'feedback',
    title: 'Feedback',
    type: 'normal',
    component: 'screens/FeedbackScreen',
    transition: 'slideLeft',
    description: 'Post-success with first-payment CTA.',
    status: 'soon',
  },
};

export function getScreenMeta(name: string): ScreenMeta | undefined {
  return SCREEN_REGISTRY[name];
}

export function getAllScreenNames(): string[] {
  return Object.keys(SCREEN_REGISTRY);
}

export function getScreensByType(type: ScreenType): ScreenMeta[] {
  return Object.values(SCREEN_REGISTRY).filter((s) => s.type === type);
}

export function getScreensByStatus(status: 'done' | 'soon'): ScreenMeta[] {
  return Object.values(SCREEN_REGISTRY).filter((s) => s.status === status);
}
