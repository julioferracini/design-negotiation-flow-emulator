/**
 * Project Timeline — Mock data layer for the Epic DND-2164.
 *
 * Today: static mock. Future: replace with Jira API call.
 * Data shape mirrors Jira issue fields for easy migration.
 */

export type EntryStatus = 'done' | 'in-progress' | 'backlog' | 'cancelled';
export type EntryType = 'task' | 'release' | 'milestone';

export interface TimelineEntry {
  id: string;
  jiraKey?: string;
  type: EntryType;
  title: string;
  description?: string;
  status: EntryStatus;
  date?: string;
  jiraUrl?: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

export const EPIC = {
  key: 'DND-2164',
  title: '[Design the Platform] Negotiation (Hiring) Flow',
  url: 'https://nubank.atlassian.net/browse/DND-2164',
  status: 'In Progress' as const,
};

export interface StatusReportEntry {
  date: string;
  title: string;
  body: string;
}

export const STATUS_REPORT: StatusReportEntry[] = [
  {
    date: '2026-04-16',
    title: 'Building blocks sprint started — 7 screens in progress',
    body: `Big push this week. Six building block screens moved to In Progress at once (Due Date, Down Payment Value, Down Payment Date, Terms & Conditions, Simulation variants, and Eligibility). The Expo Go Equalization task is now In Review. Figma Design Check (DND-2181) was completed — all hiring flow screens are validated against NuDS.

On the architecture side, the web emulator adopted CSS custom properties across the board (--nf-text, --nf-bg, etc.), replacing hardcoded palette lookups in most components. The Sidebar was refactored to use the new token system and the layout is cleaner. The AI panel, Rules panel, and all page shells now follow the same pattern.

We also brought NuDS closer to the emulator screens. The Offer Hub, Simulation, and Conditions screens now render with NuDS-aligned spacing, typography, and color tokens. This isn't a full NuDS integration yet — it's the web emulator approximating the design system so stakeholders can review flows without needing Expo Go.

Dependencies stayed stable. No major upgrades — still on React 18, Vite 6, Motion 12. The Expo side is on SDK 52 with the usual React Native stack.

Next up: finishing the remaining backlog screens (PIN, Loading, Success, Feedback), then wiring the full sequential flow navigation.`,
  },
  {
    date: '2026-04-14',
    title: 'v1.1 released — Experience Architecture + Amortization system',
    body: `Shipped v1.1 with two major additions. The Experience Architecture section replaced the old Analytics placeholder — it's a data-driven page with a Use Case Map (visual cards grouped by product line) and a Capability Matrix (scrollable table showing which screens each use case uses, formula type, experiments, financial params). All driven by the same productLines.ts data the emulator already uses, so it stays in sync automatically.

The amortization formula system landed too. Each Use Case now carries a formula field (flat_discount, price, or sac), and the Financial Rules panel has a segmented selector to switch between them. Changing the formula affects how installments are calculated in the Simulation screen. Interest controls hide when Flat is selected. The offer engine was updated to accept rule overrides.

The Financial Rules panel itself was consolidated — negotiation values, latency simulation, formula selector, and a new offer discount toggle all live in one slide-out drawer now. Discount toggle zeros out all offer discounts and hides tags in the Offer Hub.

Three Jira tasks closed: DND-2187, DND-2188, DND-2189. The Analytics task (DND-2179) was formally cancelled since Experience Architecture covers that ground.`,
  },
  {
    date: '2026-03-28',
    title: 'v1.0 — Platform launched',
    body: `Initial release of the Negotiation Flow Platform. Web emulator running on Vite + React + Tailwind with a split-screen layout (config panel + iPhone viewport). Five screens functional: Offer Hub, Suggested Conditions, Simulation, Summary, and Installment Value.

Glossary section with searchable terminology. AI Assistant with contextual awareness per section. NuDS theming with light/dark mode. i18n covering 4 locales (pt-BR, en-US, es-MX, es-CO). Password gate for controlled access.

Deployed to GitHub Pages with automated CI on the develop branch. Expo Go mobile companion running in parallel with the same shared config and screen components.`,
  },
];

export const TIMELINE: TimelineEntry[] = [
  // ── Releases ──
  {
    id: 'rel-1.1',
    type: 'release',
    title: 'v1.1 — Experience Architecture + Amortization Tables',
    description: 'Added Experience Architecture section (Use Case Map + Capability Matrix), amortization formula system (Flat/Price/SAC), consolidated Financial Rules drawer, offer discount toggle.',
    status: 'done',
    date: '2026-04-14',
    tags: ['platform', 'emulator'],
  },
  {
    id: 'rel-1.0',
    type: 'release',
    title: 'v1.0 — Initial Platform Launch',
    description: 'Web emulator with 5 screens (Offer Hub, Suggested Conditions, Simulation, Summary, Installment Value), Glossary, AI Assistant, NuDS theming, i18n (4 locales), GitHub Pages deploy.',
    status: 'done',
    date: '2026-03-28',
    tags: ['platform', 'emulator'],
  },

  // ── Done tasks ──
  {
    id: 'dnd-2187',
    jiraKey: 'DND-2187',
    type: 'task',
    title: 'Experience Architecture — Use Case Map + Capability Matrix',
    description: 'Data-driven page with visual map of all use cases and scrollable capability matrix.',
    status: 'done',
    date: '2026-04-14',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2187',
    tags: ['platform'],
    priority: 'high',
  },
  {
    id: 'dnd-2188',
    jiraKey: 'DND-2188',
    type: 'task',
    title: 'Amortization Tables — Flat/Price/SAC formula selector',
    description: 'Formula per Use Case, segmented selector in Rules panel, Use Case drives effectiveRules.',
    status: 'done',
    date: '2026-04-14',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2188',
    tags: ['emulator'],
    priority: 'high',
  },
  {
    id: 'dnd-2189',
    jiraKey: 'DND-2189',
    type: 'task',
    title: 'Financial Rules Panel — consolidated configuration drawer',
    description: 'All config in one drawer: negotiation values, formula, installments, interest, discounts, latency.',
    status: 'done',
    date: '2026-04-14',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2189',
    tags: ['emulator'],
    priority: 'medium',
  },

  // ── Done tasks ── (recently completed)
  {
    id: 'dnd-2181',
    jiraKey: 'DND-2181',
    type: 'task',
    title: 'Figma Design Check — NuDS Hiring Flow Screens',
    description: 'Reviewing all screen designs against NuDS component library standards.',
    status: 'done',
    date: '2026-04-16',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2181',
    tags: ['design'],
    priority: 'medium',
  },

  // ── In Progress ──
  {
    id: 'dnd-2207',
    jiraKey: 'DND-2207',
    type: 'task',
    title: 'Eligibility Screen',
    description: 'Filter step that determines whether the customer qualifies for flexible installment options.',
    status: 'in-progress',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2207',
    tags: ['building-block'],
    priority: 'high',
  },
  {
    id: 'dnd-2166',
    jiraKey: 'DND-2166',
    type: 'task',
    title: 'Due Date Screen',
    description: 'Calendar/date grid for selecting monthly payment due date.',
    status: 'in-progress',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2166',
    tags: ['building-block'],
    priority: 'high',
  },
  {
    id: 'dnd-2167',
    jiraKey: 'DND-2167',
    type: 'task',
    title: 'Down Payment Value Screen',
    description: 'Slider or input for setting downpayment amount with min/max constraints.',
    status: 'in-progress',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2167',
    tags: ['building-block'],
    priority: 'high',
  },
  {
    id: 'dnd-2168',
    jiraKey: 'DND-2168',
    type: 'task',
    title: 'Down Payment Date Screen',
    description: 'Date picker for selecting when the downpayment will be paid.',
    status: 'in-progress',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2168',
    tags: ['building-block'],
    priority: 'medium',
  },
  {
    id: 'dnd-2169',
    jiraKey: 'DND-2169',
    type: 'task',
    title: 'Terms & Conditions Screen',
    description: 'Scrollable legal terms with confirm-after-scroll pattern.',
    status: 'in-progress',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2169',
    tags: ['building-block'],
    priority: 'high',
  },
  {
    id: 'dnd-2182',
    jiraKey: 'DND-2182',
    type: 'task',
    title: 'Simulation Screen + new variants',
    description: 'Extending the Simulation screen with additional content variants and calculation modes.',
    status: 'in-progress',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2182',
    tags: ['emulator'],
    priority: 'medium',
  },

  // ── In Review ──
  {
    id: 'dnd-2191',
    jiraKey: 'DND-2191',
    type: 'task',
    title: 'Expo Go Equalization — simplified mobile companion',
    description: 'Lightweight mobile preview of all screens and flows.',
    status: 'in-progress',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2191',
    tags: ['expo'],
    priority: 'medium',
  },

  // ── Backlog: Building Blocks ──
  {
    id: 'dnd-2170',
    jiraKey: 'DND-2170',
    type: 'task',
    title: 'PIN Screen',
    description: '4-digit PIN overlay with numeric keypad.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2170',
    tags: ['building-block'],
    priority: 'medium',
  },
  {
    id: 'dnd-2171',
    jiraKey: 'DND-2171',
    type: 'task',
    title: 'Loading Screen',
    description: 'Fullscreen loading with 3 sequential auto-advancing steps.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2171',
    tags: ['building-block'],
    priority: 'medium',
  },
  {
    id: 'dnd-2172',
    jiraKey: 'DND-2172',
    type: 'task',
    title: 'Success Screen',
    description: 'Confirmation screen with check animation after loading completes.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2172',
    tags: ['building-block'],
    priority: 'medium',
  },
  {
    id: 'dnd-2173',
    jiraKey: 'DND-2173',
    type: 'task',
    title: 'Feedback Screen',
    description: 'Terminal screen with first-payment encouragement and two CTAs.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2173',
    tags: ['building-block'],
    priority: 'medium',
  },

  // ── Backlog: Integration ──
  {
    id: 'dnd-2174',
    jiraKey: 'DND-2174',
    type: 'task',
    title: 'App.tsx Routing Integration',
    description: 'Import and render all new screens with proper routing and type definitions.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2174',
    tags: ['integration'],
    priority: 'high',
  },
  {
    id: 'dnd-2175',
    jiraKey: 'DND-2175',
    type: 'task',
    title: 'Sequential Flow Navigation',
    description: 'Wire onNext/onContinue across all screens, respecting ScreenVisibility.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2175',
    tags: ['integration'],
    priority: 'high',
  },
  {
    id: 'dnd-2176',
    jiraKey: 'DND-2176',
    type: 'task',
    title: 'Registry & Config Updates',
    description: 'Update screen registry, config, and README for all new screens.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2176',
    tags: ['integration'],
    priority: 'medium',
  },
  {
    id: 'dnd-2177',
    jiraKey: 'DND-2177',
    type: 'task',
    title: 'Per-Screen Transition Presets',
    description: 'Use screen-specific transitions (slideUp, fade, slideLeft) from registry.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2177',
    tags: ['integration'],
    priority: 'low',
  },
  {
    id: 'dnd-2190',
    jiraKey: 'DND-2190',
    type: 'task',
    title: 'Use Case Flows — end-to-end journeys',
    description: 'Connect screens into navigable flows per Use Case with skip logic.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2190',
    tags: ['integration'],
    priority: 'high',
  },

  // ── Backlog: Platform ──
  {
    id: 'dnd-2178',
    jiraKey: 'DND-2178',
    type: 'task',
    title: 'Glossary Mock content in Expo Go',
    description: 'Port glossary data and UI to the Expo Go mobile app.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2178',
    tags: ['expo'],
    priority: 'low',
  },
  {
    id: 'dnd-2180',
    jiraKey: 'DND-2180',
    type: 'task',
    title: 'Product Platform — Management User Interface',
    description: 'Admin tools for managing product versions and experiments.',
    status: 'backlog',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2180',
    tags: ['platform'],
    priority: 'high',
  },
  // ── Cancelled ──
  {
    id: 'dnd-2179',
    jiraKey: 'DND-2179',
    type: 'task',
    title: 'Experience Architecture — Design and Mock New Session',
    description: 'Replaced by Experience Architecture section.',
    status: 'cancelled',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2179',
    tags: ['platform'],
    priority: 'medium',
  },
];
