/**
 * i18n Types — Translation structure for all supported locales.
 *
 * `Locale` is re-exported from shared/types to keep it as the single source of truth.
 */

import type { Locale } from '../types';
export type { Locale };

/* ─────────────── Shared sub-types (prototype-specific) ─────────────── */

export type ScreenEntry = {
  id: string;
  label: string;
  description: string;
  status: 'done' | 'soon';
};

export type UseCaseEntry = {
  id: string;
  label: string;
  status: 'done' | 'soon';
};

/**
 * LoadingStepCopy — copy for a single step in the Loading screen.
 * `durationMs` is optional so Use Cases can slow down or speed up individual
 * steps (e.g. a heavier "computing" step could hold longer than a short
 * "saving" step).
 */
export type LoadingStepCopy = {
  title: string;
  durationMs?: number;
};

/* ─────────────── Translations ─────────────── */

export type Translations = {
  /** Prototype-specific: start / language selector screen */
  start: {
    title: string;
    subtitle: string;
    languages: Record<Locale, { name: string; description: string }>;
  };

  /** Prototype-specific: screen/use-case browser */
  picker: {
    headerTitle: string;
    browseByScreen: string;
    browseByUseCase: string;
    soonLabel: string;
    screens: ScreenEntry[];
    useCases: UseCaseEntry[];
  };

  common: {
    continue: string;
    back: string;
    close: string;
    confirm: string;
    cancel: string;
    next: string;
    previous: string;
    done: string;
    skip: string;
    loading: string;
    error: string;
    retry: string;
  };

  offerHub: {
    tabs: { key: string; label: string }[];
    title: string;
    subtitle: string;
    totalLabel: string;
    fromPrefix: string;
    toSuffix: string;
    originalBalance: string;
    savings: string;
    discount: string;
    badge: string;
    cta: string;
    lastUpdate: string;
    upToAmount: string;
    firstPaymentFrom: string;
    payAmount: string;
    payOnlyAmount: string;
    currentBalanceAmount: string;
    stayUpToDate: string;
    payButton: string;
    checkDetailsButton: string;
    offerSolveAllMonthly: string;
    offerSolveAllNow: string;
    offerConsolidateDebts: string;
    offerFinanceCurrentBill: string;
    offerPayCurrentBill: string;
    offerPayLateLoan: string;
    offerPayLateInstallments: string;
    badgeMonthlyPayments: string;
    badgeBestDiscount: string;
  };

  suggested: {
    headerTitle: string;
    title: string;
    targetLabel: string;
    bestMatchBadge: string;
    installmentsOf: string;
    installmentOf: string;
    discountAmount: string;
    totalLabel: string;
    noDownpayment: string;
    downpaymentOf: string;
    moreOptions: string;
    moreOptionsSubtitle: string;
    faqTitle: string;
    sheetTitle: string;
    editValueTitle: string;
    confirm: string;
    infoSheetTitle: string;
    backLabel: string;
  };

  installmentList: {
    title: string;
    recommendedLabel: string;
  };

  inputValue: {
    title: string;
    subtitle: string;
    monthlyPayment: string;
    installments: string;
    totalAmount: string;
    savings: string;
    continue: string;
    heading: string;
    clearButton: string;
    tips: string[];
    loadingText: string;
    simulateWith: string;
    simulate: string;
    minimumError: string;
    variants: {
      installmentValue: {
        title: string;
        subtitle: string;
        heading: string;
      };
      downpaymentValue: {
        title: string;
        subtitle: string;
        heading: string;
      };
    };
  };

  eligibility: {
    title: string;
    totalBalanceLabel: string;
    fromPrefix: string;
    toSuffix: string;
    discountBadge: string;
    question: string;
    fixedOption: {
      title: string;
      subtitle: string;
      benefits: string[];
      cta: string;
    };
    flexibleOption: {
      title: string;
      subtitle: string;
      benefits: string[];
      cta: string;
    };
  };

  simulation: {
    title: string;
    subtitle: string;
    installments: string;
    installmentsCount: string;
    monthlyPayment: string;
    totalSavings: string;
    total: string;
    downPayment: string;
    noDownPayment: string;
    downPaymentMandatoryHint: string;
    downPaymentRequired: string;
    downPaymentRequiredMessage: string;
    downPaymentMinimum: string;
    downPaymentMaximum: string;
    downPaymentBelowMinimum: string;
    keepForAllInstallments: string;
    keepForAllInstallmentsSubtitle: string;
    sliderMoreDiscount: string;
    sliderMoreTime: string;
    rangeLabel: string;
    rangeDownPayment: string;
    continue: string;
    gotIt: string;
    confirm: string;
    close: string;
    editorApproximateHint: string;
    installmentsSuffix: string;
  };

  dueDate: {
    title: string;
    subtitle: string;
    selectDate: string;
    continue: string;
    heading: string;
    paymentScheduleInfo: string;
    sectionTitle: string;
    otherDates: string;
    downpayment: string;
    installmentsOf: string;
    amountOff: string;
    totalAmount: string;
    calendarTitle: string;
    calendarInfo: string;
    calendarInfoPrefix: string;
    calendarInfoSuffix: string;
    calendarSelectDate: string;
    variants: {
      firstInstallmentDate: {
        title: string;
        subtitle: string;
        heading: string;
        calendarInfo: string;
        calendarInfoPrefix: string;
        calendarInfoSuffix: string;
      };
      downpaymentDate: {
        title: string;
        subtitle: string;
        heading: string;
        calendarInfo: string;
        calendarInfoPrefix: string;
        calendarInfoSuffix: string;
      };
      singlePaymentDate: {
        title: string;
        subtitle: string;
        heading: string;
        calendarInfo: string;
        calendarInfoPrefix: string;
        calendarInfoSuffix: string;
      };
    };
  };

  summary: {
    title: string;
    subtitle: string;
    downPayment: string;
    downPaymentDate: string;
    monthlyPayment: string;
    installments: string;
    firstDueDate: string;
    totalAmount: string;
    totalSavings: string;
    confirm: string;
    yourMonthlyPayment: string;
    totalDiscount: string;
    renegotiationNote: string;
    sectionPaymentPlan: string;
    changeButton: string;
    numberOfInstallments: string;
    installmentAmount: string;
    paymentAmount: string;
    downpaymentDate: string;
    firstInstallmentDate: string;
    monthlyPaymentDate: string;
    everyDay: string;
    sectionBillingDetails: string;
    totalAmountFinanced: string;
    totalInterest: string;
    monthlyInterest: string;
    totalAmountToPay: string;
    confirmNote: string;
    termsLinkText: string;
  };

  terms: {
    title: string;
    subtitle: string;
    accept: string;
    decline: string;
    readAll: string;
    heading: string;
    bodySubtitle: string;
    confirmButton: string;
    paragraphs: Array<{ bold?: boolean; text: string }>;
  };

  pin: {
    title: string;
    subtitle: string;
    confirm: string;
    error: string;
    closeAria: string;
  };

  /**
   * Loading screen — multi-step progress animation.
   *
   * Each variant is an ordered list of steps. The last step is the "Done!"
   * state shown while the progress bar is fully filled. Timing is controlled
   * via `stepDurationMs` on each step (optional; falls back to the screen's
   * default).
   */
  loading: {
    close: string;
    restart: string;
    twoStep: LoadingStepCopy[];
    threeStep: LoadingStepCopy[];
  };

  success: {
    title: string;
    subtitle: string;
    message: string;
    done: string;
  };

  feedback: {
    title: string;
    subtitle: string;
    question: string;
    optionGood: string;
    optionBad: string;
    submit: string;
    headline1: string;
    headline2: string;
    body1: string;
    body2: string;
    makePayment: string;
    doLater: string;
  };

  errors: {
    generic: string;
    network: string;
    invalidAmount: string;
    invalidDate: string;
    required: string;
  };

  currency: {
    symbol: string;
    code: string;
  };

  dates: {
    today: string;
    tomorrow: string;
    yesterday: string;
    monthShort: string[];
    monthLong: string[];
    dayShort: string[];
    dayLong: string[];
    weekdayInitial: string[];
  };

  /** Web emulator UI translations (not prototype content) */
  emulator: {
    panelTitle: string;
    theme: string;
    light: string;
    dark: string;
    countryLanguage: string;
    productLine: string;
    useCase: string;
    buildingBlocks: string;
    stepsEnabled: string;
    flowOptions: string;
    financialParameters: string;
    availableInPhase: string;
    startFlow: string;
    viewIsolated: string;
    prototype: string;
    prototypeReady: string;
    selectUseCase: string;
    phase: string;
  };
};
