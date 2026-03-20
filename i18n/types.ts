/**
 * i18n Types — Translation structure for all supported locales.
 *
 * Locales: pt-BR, es-MX, es-CO, en-US
 * All text content in the project should use these translation keys.
 */

export type Locale = 'pt-BR' | 'es-MX' | 'es-CO' | 'en-US';

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

  installmentValue: {
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
    calendarSelectDate: string;
  };

  downPaymentValue: {
    title: string;
    subtitle: string;
    amount: string;
    percentage: string;
    minimum: string;
    maximum: string;
    continue: string;
  };

  downPaymentDate: {
    title: string;
    subtitle: string;
    selectDate: string;
    continue: string;
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
    downpaymentDueDate: string;
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
  };

  loading: {
    title: string;
    subtitle: string;
    processing: string;
    step1: string;
    step2: string;
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
