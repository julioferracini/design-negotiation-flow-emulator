import type { Locale } from '../../../../i18n/types';
import type { ScreenKey, FlowOptionKey } from '../../context/EmulatorConfigContext';
import type { NuDSSegment } from '../../context/ThemeContext';

export type ConfigAction =
  | { type: 'setLocale'; value: Locale }
  | { type: 'setProductLine'; value: string }
  | { type: 'setUseCase'; value: string }
  | { type: 'toggleScreen'; screen: ScreenKey; enabled: boolean }
  | { type: 'setFlowOption'; key: FlowOptionKey; value: boolean }
  | { type: 'startFlow' }
  | { type: 'setThemeMode'; value: 'light' | 'dark' }
  | { type: 'setSegment'; value: NuDSSegment }
  | { type: 'navigate'; path: string };

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  actions?: ConfigAction[];
  quickReplies?: QuickReply[];
}

export interface QuickReply {
  label: string;
  message: string;
}

export interface AssistantResponse {
  text: string;
  actions: ConfigAction[];
  quickReplies?: QuickReply[];
}

const GREETING: AssistantResponse = {
  text: "Hi! I'm your AI assistant for the Negotiation Flow Emulator. I can help you set up simulations, switch countries, toggle screens, and more. What would you like to do?",
  actions: [],
  quickReplies: [
    { label: 'Simulate MDR in Brazil', message: 'Simulate MDR in Brazil' },
    { label: 'Switch to Mexico', message: 'Switch to Mexico' },
    { label: 'Enable all screens', message: 'Enable all screens' },
    { label: 'Start a wizard', message: 'Start a wizard' },
  ],
};

export function getGreeting(): AssistantResponse {
  return GREETING;
}

type WizardStep = 'idle' | 'country' | 'productLine' | 'useCase' | 'confirm';

interface WizardState {
  step: WizardStep;
  locale?: Locale;
  productLine?: string;
}

let wizardState: WizardState = { step: 'idle' };

export function resetWizard() {
  wizardState = { step: 'idle' };
}

const LOCALE_MAP: Record<string, Locale> = {
  brazil: 'pt-BR', brasil: 'pt-BR', 'pt-br': 'pt-BR', portuguese: 'pt-BR',
  mexico: 'es-MX', méxico: 'es-MX', 'es-mx': 'es-MX',
  colombia: 'es-CO', 'es-co': 'es-CO',
  us: 'en-US', usa: 'en-US', 'en-us': 'en-US', english: 'en-US', 'united states': 'en-US',
};

const PRODUCT_LINE_MAP: Record<string, string> = {
  'debt resolution': 'debt-resolution', debt: 'debt-resolution', 'debt-resolution': 'debt-resolution',
  lending: 'lending', loan: 'lending', loans: 'lending',
  'credit card': 'credit-card', 'credit-card': 'credit-card', credit: 'credit-card', card: 'credit-card',
};

const USE_CASE_MAP: Record<string, string> = {
  mdr: 'mdr', 'monthly debt': 'mdr',
  pdr: 'pdr', 'partial debt': 'pdr',
  fdr: 'fdr', 'full debt': 'fdr',
};

const SCREEN_MAP: Record<string, ScreenKey> = {
  'offer hub': 'offerHub', offerhub: 'offerHub', offers: 'offerHub',
  installment: 'installmentValue', 'installment value': 'installmentValue',
  simulation: 'simulation', simulator: 'simulation',
  suggested: 'suggested', 'suggested conditions': 'suggested',
  downpayment: 'downpaymentValue', 'downpayment value': 'downpaymentValue',
  'downpayment date': 'downpaymentDueDate', 'downpayment due date': 'downpaymentDueDate',
  'due date': 'dueDate', duedate: 'dueDate',
  summary: 'summary', review: 'summary',
  terms: 'terms', 'terms and conditions': 'terms',
  pin: 'pin', confirmation: 'pin',
  loading: 'loading',
  feedback: 'feedback', success: 'feedback',
  'end path': 'endPath', endpath: 'endPath', finish: 'endPath',
};

const ALL_SCREENS: ScreenKey[] = [
  'offerHub', 'installmentValue', 'simulation', 'suggested',
  'downpaymentValue', 'downpaymentDueDate', 'dueDate', 'summary',
  'terms', 'pin', 'loading', 'feedback', 'endPath',
];

export function processMessage(userMessage: string): AssistantResponse {
  const msg = userMessage.toLowerCase().trim();

  if (wizardState.step !== 'idle') {
    return handleWizardStep(msg);
  }

  if (msg.includes('wizard') || msg.includes('guide me') || msg.includes('help me set up')) {
    wizardState = { step: 'country' };
    return {
      text: "Let's set up a simulation step by step. First, which country would you like to simulate?",
      actions: [],
      quickReplies: [
        { label: 'Brazil', message: 'Brazil' },
        { label: 'Mexico', message: 'Mexico' },
        { label: 'Colombia', message: 'Colombia' },
        { label: 'US', message: 'US' },
      ],
    };
  }

  if (msg.includes('simulate') && msg.includes('mdr')) {
    const locale = extractLocale(msg) ?? 'pt-BR';
    return {
      text: `Setting up MDR simulation for ${localeLabel(locale)}. I've switched the country, selected Debt Resolution, and picked the MDR use case.`,
      actions: [
        { type: 'setLocale', value: locale },
        { type: 'setProductLine', value: 'debt-resolution' },
        { type: 'setUseCase', value: findUseCaseForLocale('mdr', locale) },
      ],
      quickReplies: [
        { label: 'Start the flow', message: 'Start the flow' },
        { label: 'Enable all screens', message: 'Enable all screens' },
        { label: 'Switch to dark mode', message: 'Switch to dark mode' },
      ],
    };
  }

  const localeMatch = extractLocale(msg);
  if (localeMatch && (msg.includes('switch') || msg.includes('change') || msg.includes('go to') || msg.includes('set'))) {
    return {
      text: `Switched to ${localeLabel(localeMatch)}. The product line and use case have been updated to match this market.`,
      actions: [{ type: 'setLocale', value: localeMatch }],
      quickReplies: [
        { label: 'Show available use cases', message: 'Show available use cases' },
        { label: 'Start the flow', message: 'Start the flow' },
      ],
    };
  }

  if (msg.includes('enable all screens') || msg.includes('turn on all')) {
    const actions: ConfigAction[] = ALL_SCREENS.map((s) => ({ type: 'toggleScreen' as const, screen: s, enabled: true }));
    return {
      text: 'Done! All screens have been enabled in the flow parameters.',
      actions,
      quickReplies: [
        { label: 'Start the flow', message: 'Start the flow' },
        { label: 'Disable PIN', message: 'Disable PIN screen' },
      ],
    };
  }

  if (msg.includes('disable all screens') || msg.includes('turn off all')) {
    const actions: ConfigAction[] = ALL_SCREENS.map((s) => ({ type: 'toggleScreen' as const, screen: s, enabled: false }));
    return { text: 'All screens have been disabled.', actions };
  }

  const enableMatch = msg.match(/(?:enable|turn on|activate)\s+(.+?)(?:\s+screen)?$/);
  if (enableMatch) {
    const screenKey = findScreen(enableMatch[1]);
    if (screenKey) {
      return {
        text: `Enabled the ${enableMatch[1]} screen.`,
        actions: [{ type: 'toggleScreen', screen: screenKey, enabled: true }],
      };
    }
  }

  const disableMatch = msg.match(/(?:disable|turn off|deactivate)\s+(.+?)(?:\s+screen)?$/);
  if (disableMatch) {
    const screenKey = findScreen(disableMatch[1]);
    if (screenKey) {
      return {
        text: `Disabled the ${disableMatch[1]} screen.`,
        actions: [{ type: 'toggleScreen', screen: screenKey, enabled: false }],
      };
    }
  }

  if (msg.includes('enable pin')) {
    return { text: 'PIN confirmation has been enabled.', actions: [{ type: 'setFlowOption', key: 'pin', value: true }] };
  }
  if (msg.includes('disable pin')) {
    return { text: 'PIN confirmation has been disabled.', actions: [{ type: 'setFlowOption', key: 'pin', value: false }] };
  }
  if (msg.includes('enable downpayment')) {
    return {
      text: 'Downpayment steps have been enabled.',
      actions: [
        { type: 'setFlowOption', key: 'downpaymentValue', value: true },
        { type: 'setFlowOption', key: 'downpaymentDueDate', value: true },
      ],
    };
  }
  if (msg.includes('disable downpayment')) {
    return {
      text: 'Downpayment steps have been disabled.',
      actions: [
        { type: 'setFlowOption', key: 'downpaymentValue', value: false },
        { type: 'setFlowOption', key: 'downpaymentDueDate', value: false },
      ],
    };
  }

  if (msg.includes('start') && (msg.includes('flow') || msg.includes('run') || msg.includes('simulation'))) {
    return { text: 'Starting the flow now!', actions: [{ type: 'startFlow' }] };
  }

  if (msg.includes('dark mode') || msg.includes('dark theme')) {
    return { text: 'Switched to dark mode.', actions: [{ type: 'setThemeMode', value: 'dark' }] };
  }
  if (msg.includes('light mode') || msg.includes('light theme')) {
    return { text: 'Switched to light mode.', actions: [{ type: 'setThemeMode', value: 'light' }] };
  }

  if (msg.includes('ultravioleta') || msg.includes(' uv')) {
    return { text: 'Switched to Ultravioleta segment.', actions: [{ type: 'setSegment', value: 'uv' }] };
  }
  if (msg.includes(' pj') || msg.includes('pessoa juridica')) {
    return { text: 'Switched to PJ segment.', actions: [{ type: 'setSegment', value: 'pj' }] };
  }
  if (msg.includes('standard segment')) {
    return { text: 'Switched to Standard segment.', actions: [{ type: 'setSegment', value: 'standard' }] };
  }

  return {
    text: "I'm not sure what you'd like to do. Here are some things I can help with:",
    actions: [],
    quickReplies: [
      { label: 'Start a wizard', message: 'Start a wizard' },
      { label: 'Simulate MDR in Brazil', message: 'Simulate MDR in Brazil' },
      { label: 'Enable all screens', message: 'Enable all screens' },
      { label: 'Switch to dark mode', message: 'Switch to dark mode' },
    ],
  };
}

function handleWizardStep(msg: string): AssistantResponse {
  if (wizardState.step === 'country') {
    const locale = extractLocale(msg);
    if (locale) {
      wizardState = { step: 'productLine', locale };
      return {
        text: `Great, ${localeLabel(locale)}! Now, which product line?`,
        actions: [{ type: 'setLocale', value: locale }],
        quickReplies: [
          { label: 'Debt Resolution', message: 'Debt Resolution' },
          { label: 'Lending', message: 'Lending' },
          { label: 'Credit Card', message: 'Credit Card' },
        ],
      };
    }
    return {
      text: "I didn't recognize that country. Please pick one:",
      actions: [],
      quickReplies: [
        { label: 'Brazil', message: 'Brazil' },
        { label: 'Mexico', message: 'Mexico' },
        { label: 'Colombia', message: 'Colombia' },
        { label: 'US', message: 'US' },
      ],
    };
  }

  if (wizardState.step === 'productLine') {
    const pl = extractProductLine(msg);
    if (pl) {
      wizardState = { ...wizardState, step: 'useCase', productLine: pl };
      return {
        text: `Selected ${pl}. Which use case would you like?`,
        actions: [{ type: 'setProductLine', value: pl }],
        quickReplies: [
          { label: 'MDR', message: 'MDR' },
          { label: 'PDR', message: 'PDR' },
          { label: 'FDR', message: 'FDR' },
        ],
      };
    }
    return {
      text: "I didn't recognize that product line. Please choose:",
      actions: [],
      quickReplies: [
        { label: 'Debt Resolution', message: 'Debt Resolution' },
        { label: 'Lending', message: 'Lending' },
        { label: 'Credit Card', message: 'Credit Card' },
      ],
    };
  }

  if (wizardState.step === 'useCase') {
    const ucSlug = extractUseCase(msg);
    const locale = wizardState.locale ?? 'pt-BR';
    const ucId = ucSlug ? findUseCaseForLocale(ucSlug, locale) : '';
    wizardState = { step: 'idle' };

    if (ucId) {
      return {
        text: `All set! I've configured the emulator with your selections. Ready to start the flow?`,
        actions: [{ type: 'setUseCase', value: ucId }],
        quickReplies: [
          { label: 'Start the flow', message: 'Start the flow' },
          { label: 'Enable all screens', message: 'Enable all screens' },
          { label: 'Tweak parameters', message: 'Start a wizard' },
        ],
      };
    }

    return {
      text: "I couldn't find that use case, but the wizard is complete. You can adjust parameters manually or ask me to try again.",
      actions: [],
      quickReplies: [
        { label: 'Start a wizard', message: 'Start a wizard' },
        { label: 'Start the flow', message: 'Start the flow' },
      ],
    };
  }

  wizardState = { step: 'idle' };
  return { text: 'The wizard has been reset. How can I help?', actions: [] };
}

function extractLocale(msg: string): Locale | undefined {
  for (const [keyword, locale] of Object.entries(LOCALE_MAP)) {
    if (msg.includes(keyword)) return locale;
  }
  return undefined;
}

function extractProductLine(msg: string): string | undefined {
  for (const [keyword, id] of Object.entries(PRODUCT_LINE_MAP)) {
    if (msg.includes(keyword)) return id;
  }
  return undefined;
}

function extractUseCase(msg: string): string | undefined {
  for (const [keyword, slug] of Object.entries(USE_CASE_MAP)) {
    if (msg.includes(keyword)) return slug;
  }
  return undefined;
}

function findScreen(text: string): ScreenKey | undefined {
  const normalized = text.toLowerCase().trim();
  return SCREEN_MAP[normalized];
}

function findUseCaseForLocale(slug: string, locale: Locale): string {
  const localeSuffix: Record<Locale, string> = {
    'pt-BR': 'br', 'es-MX': 'mx', 'es-CO': 'co', 'en-US': 'us',
  };
  return `dr-${slug}-${localeSuffix[locale]}`;
}

function localeLabel(locale: Locale): string {
  const labels: Record<Locale, string> = {
    'pt-BR': 'Brazil (pt-BR)',
    'es-MX': 'Mexico (es-MX)',
    'es-CO': 'Colombia (es-CO)',
    'en-US': 'US (en-US)',
  };
  return labels[locale];
}

let messageIdCounter = 0;
export function nextMessageId(): string {
  return `msg-${++messageIdCounter}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Contextual greetings & responses for non-emulator sections               */
/* ═══════════════════════════════════════════════════════════════════════════ */

type SectionId = 'home' | 'emulator' | 'experience-architecture' | 'flow-management' | 'project-timeline' | 'glossary';

const CONTEXTUAL_GREETINGS: Record<SectionId, AssistantResponse> = {
  home: {
    text: "Welcome to the Negotiation Flow Platform! I can guide you to any section. Where would you like to go?",
    actions: [],
    quickReplies: [
      { label: 'Open Emulator', message: 'Go to emulator' },
      { label: 'What is this platform?', message: 'What is this platform?' },
      { label: 'Show Glossary', message: 'Go to glossary' },
    ],
  },
  emulator: getGreeting(),
  'experience-architecture': {
    text: "Welcome to Experience Architecture! Here you can see a visual map of all use cases and a capability matrix showing how each one leverages the framework.\n\nClick any use case card to jump to the Emulator with it pre-selected.",
    actions: [],
    quickReplies: [
      { label: 'Go to Emulator', message: 'Go to emulator' },
      { label: 'What is a use case?', message: 'What is a use case?' },
      { label: 'Open Glossary', message: 'Go to glossary' },
    ],
  },
  'flow-management': {
    text: "Welcome to Flow Management! This section will let you manage product versions, run A/B experiments, and control flow configurations. It's coming soon.\n\nI can help you navigate to other areas in the meantime.",
    actions: [],
    quickReplies: [
      { label: 'Go to Emulator', message: 'Go to emulator' },
      { label: 'Open Timeline', message: 'Go to timeline' },
      { label: 'Open Glossary', message: 'Go to glossary' },
    ],
  },
  'project-timeline': {
    text: "Welcome to the Project Timeline! Here you can track the development progress of the Negotiation Flow Platform — tasks from Jira, releases, and what's coming next.\n\nEach item links directly to Jira for full details.",
    actions: [],
    quickReplies: [
      { label: 'Go to Emulator', message: 'Go to emulator' },
      { label: 'What screens are missing?', message: 'What screens are still in backlog?' },
      { label: 'Open Glossary', message: 'Go to glossary' },
    ],
  },
  glossary: {
    text: "Welcome to the Glossary! Here you'll find definitions for business terms and regulatory concepts. This section is being built, but I can already help you understand key terms.\n\nAsk me about any concept!",
    actions: [],
    quickReplies: [
      { label: 'What is MDR?', message: 'What is MDR?' },
      { label: 'Explain Downpayment', message: 'What does downpayment mean?' },
      { label: 'What is Flow Type A vs B?', message: 'What is flow type A vs B?' },
      { label: 'Go to Emulator', message: 'Go to emulator' },
    ],
  },
};

export function getContextualGreeting(section: SectionId): AssistantResponse {
  return CONTEXTUAL_GREETINGS[section] ?? CONTEXTUAL_GREETINGS.home;
}

const GLOSSARY_TERMS: Record<string, string> = {
  mdr: "MDR (Multi-debt Renegotiation) is a negotiation flow that consolidates multiple overdue debts — credit cards, loans, and bills — into a single renegotiation offer. It's the most common debt resolution product.",
  downpayment: "A downpayment is an upfront partial payment made before the installment plan begins. Some renegotiation flows require it to reduce the total outstanding balance before splitting into installments.",
  'flow type': "Flow Type A uses a simulation slider where the user adjusts installment values interactively. Flow Type B presents pre-calculated suggested conditions as fixed cards. Some use cases support both.",
  'flow version': "A flow version is a snapshot of a specific configuration — screen sequence, parameters, and business rules. Flow Management lets you create, compare, and activate different versions for A/B testing.",
  installment: "An installment is a fixed periodic payment (usually monthly) that divides the total debt into smaller amounts over time. The installment range defines the minimum and maximum number of payments allowed.",
  'offer hub': "The Offer Hub is the first screen users see in a negotiation flow. It presents up to three renegotiation offers — typically varying by installment count, interest rate, and discount percentage.",
  simulation: "The Simulation screen (Flow Type A) lets users drag a slider to explore different installment configurations in real time, seeing how monthly payments, interest, and total cost change dynamically.",
  'suggested conditions': "Suggested Conditions (Flow Type B) presents a single best-match offer card calculated by the system based on the user's debt profile, without interactive adjustment.",
  pin: "PIN is a 4-digit confirmation step that some flows require before finalizing the renegotiation agreement. It adds an extra layer of security for high-value transactions.",
  summary: "The Summary screen shows a complete review of the negotiation agreement before confirmation — including installment amount, due dates, total cost, interest rate, and any downpayment.",
  lending: "Lending flows handle loan origination — including INSS consigned credit, private payroll lending, SIAPE, military personnel loans, and unsecured personal loans.",
  'credit card': "Credit Card flows handle bill installment plans (available in Mexico) and debt refinancing (available in Colombia) for overdue credit card balances.",
  inss: "INSS (Instituto Nacional do Seguro Social) is Brazil's social security system. INSS consigned credit allows beneficiaries to take loans with payments deducted directly from their benefits.",
  siape: "SIAPE is the federal payroll system for Brazilian public servants. SIAPE consigned credit offers favorable interest rates with automatic payroll deduction.",
  'experience-architecture': "The Experience Architecture section shows a visual map of all use cases organized by product line, plus a capability matrix that compares screen configurations, amortization formulas, and financial parameters across the framework.",
};

export function processContextualMessage(userMessage: string, section: SectionId): AssistantResponse {
  const msg = userMessage.toLowerCase().trim();

  if (msg.includes('go to emulator') || msg.includes('open emulator') || msg.includes('emulator')) {
    return {
      text: "Taking you to the Emulator — that's where you can configure and run use case simulations.",
      actions: [{ type: 'navigate', path: '/emulator' }],
    };
  }
  if (msg.includes('go to architecture') || msg.includes('open architecture') || msg.includes('experience architecture')) {
    return {
      text: "Opening Experience Architecture — the visual map and capability matrix for all use cases.",
      actions: [{ type: 'navigate', path: '/experience-architecture' }],
    };
  }
  if (msg.includes('go to flow') || msg.includes('open flow') || msg.includes('flow management')) {
    return {
      text: "Opening Flow Management. This section is coming soon!",
      actions: [{ type: 'navigate', path: '/flow-management' }],
    };
  }
  if (msg.includes('go to timeline') || msg.includes('open timeline') || msg.includes('project timeline') || msg.includes('project status')) {
    return {
      text: "Opening the Project Timeline — you can see all tasks, progress, and Jira links there.",
      actions: [{ type: 'navigate', path: '/project-timeline' }],
    };
  }
  if (msg.includes('go to glossary') || msg.includes('open glossary') || msg.includes('glossary')) {
    return {
      text: "Taking you to the Glossary — I can explain business terms and concepts there.",
      actions: [{ type: 'navigate', path: '/glossary' }],
    };
  }
  if (msg.includes('go home') || msg.includes('go to home') || msg.includes('open home')) {
    return {
      text: "Heading back to the home page.",
      actions: [{ type: 'navigate', path: '/' }],
    };
  }

  if (msg.includes('what is this platform') || msg.includes('what does this do')) {
    return {
      text: "The Negotiation Flow Platform is a design and simulation tool for debt renegotiation products. It lets you prototype user flows, test different configurations across countries and product lines, and visualize the complete negotiation experience — from offer presentation to payment confirmation.",
      actions: [],
      quickReplies: [
        { label: 'Open Emulator', message: 'Go to emulator' },
        { label: 'Show Glossary', message: 'Go to glossary' },
      ],
    };
  }

  if (msg.includes('capability matrix') || msg.includes('use case map')) {
    return {
      text: "The Experience Architecture section has both! The Use Case Map shows all use cases organized by product line, and the Capability Matrix compares their screen configurations side by side.",
      actions: [{ type: 'navigate', path: '/experience-architecture' }],
      quickReplies: [
        { label: 'Go to Emulator', message: 'Go to emulator' },
        { label: 'What is MDR?', message: 'What is MDR?' },
      ],
    };
  }

  for (const [term, definition] of Object.entries(GLOSSARY_TERMS)) {
    if (msg.includes(term)) {
      const otherTerms = Object.keys(GLOSSARY_TERMS).filter((t) => t !== term).slice(0, 3);
      return {
        text: definition,
        actions: [],
        quickReplies: [
          ...otherTerms.map((t) => ({ label: `What is ${t}?`, message: `What is ${t}?` })),
          ...(section !== 'glossary' ? [{ label: 'Open Glossary', message: 'Go to glossary' }] : []),
        ],
      };
    }
  }

  if (section === 'glossary') {
    return {
      text: "I don't have a definition for that term yet. The full glossary is being built. Try asking about MDR, downpayment, flow types, or any screen name — I might know it!",
      actions: [],
      quickReplies: [
        { label: 'What is MDR?', message: 'What is MDR?' },
        { label: 'Explain Simulation', message: 'What is simulation?' },
        { label: 'What is INSS?', message: 'What is INSS?' },
      ],
    };
  }

  return {
    text: "This section is still being built, so my capabilities here are limited. I can explain business terms or help you navigate to another section.",
    actions: [],
    quickReplies: [
      { label: 'Go to Emulator', message: 'Go to emulator' },
      { label: 'What is MDR?', message: 'What is MDR?' },
      { label: 'Open Glossary', message: 'Go to glossary' },
    ],
  };
}
