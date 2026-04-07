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
  | { type: 'setSegment'; value: NuDSSegment };

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
