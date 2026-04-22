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
    date: '2026-04-22',
    title: '18 of 22 tasks done — Jira board cleaned, 4 tasks confirmed closed',
    body: `Four more tasks moved to Done in Jira: App.tsx Routing Integration (DND-2174), Registry & Config Updates (DND-2176), Glossary Mock in Expo Go (DND-2178), and Expo Go Equalization (DND-2191). All confirmed closed on the board with Planning Cycle filled.

That brings the epic to 18 of 22 tasks done — 82% complete. Only 3 tasks remain in backlog (DND-2175 Sequential Navigation, DND-2177 Transition Presets, DND-2190 Use Case Flows) plus the Management UI (DND-2180) and the cancelled Analytics (DND-2179).

The Expo Go companion is now fully validated — all screens render, latency simulation works, Glossary is ported. The web platform has all routing wired and registry fully aligned.

The remaining 3 integration tasks (DND-2175, DND-2177, DND-2190) are scoped for the new Use Case content epic. DND-2180 (Management UI) will become its own epic with revised scope.

The DND-2164 architecture epic is effectively closed from a delivery standpoint.`,
  },
  {
    date: '2026-04-22',
    title: 'Epic architecture closing — registry aligned, routing verified, flow engine scoped',
    body: `Registry & Config Updates (DND-2176) completed: screens.registry.ts now marks all 13 building blocks as done, eligibility added to the registry, stale "success" entry removed (merged into feedback/loading flow), descriptions updated. README and screenVariants.ts were already current from earlier sprints.

Routing Integration (DND-2174) verified: the Expo App.tsx already has all 13 screens wired in renderScreen() with correct navigation callbacks, variant support, and data passing (simulation → summary). The web PrototypeViewport handles routing via URL slugs. No changes needed — task was effectively done.

Per-Screen Transition Presets (DND-2177) analyzed: the presets exist in transitions/presets.ts (none, fade, slideLeft, slideUp, pushIn) and the registry maps each screen to its intended preset. However, applying them requires changes to the Expo navigation engine — currently using a generic forward/back slide. This is tightly coupled to Sequential Flow Navigation (DND-2175), so both are bundled for the next phase.

DND-2175 (Sequential Navigation) and DND-2190 (Use Case Flows) deferred to the new epic. The engine that reads ScreenVisibility and chains screens is the natural entry point for the Use Case content epic — building the engine without the Use Cases to test it doesn't add value.

A new epic is being planned for Use Case content management — controlling which Use Cases enter the platform, their screen configurations, and flow validation. DND-2180 (Management UI) will also move there.

The DND-2164 epic is architecturally complete: 13/13 building blocks, NuDS foundation at 100%, self-hosted fonts, responsive breakpoints, i18n consolidated, Expo Go companion functional. Remaining backlog (5 tasks) is either deferred to the new epic or in progress (Glossary Expo, Expo Go review).`,
  },
  {
    date: '2026-04-22',
    title: 'All 13 building blocks complete — NuDS foundation sprint, self-hosted fonts',
    body: `The three remaining end-of-flow screens are done: Loading (DND-2171), Success (DND-2172), and Feedback (DND-2173). That closes the entire building block backlog — all 13 screens are now implemented and functional across web and Expo Go. 14 of 22 tasks done, progress at 64%.

A major NuDS foundation sprint ran across all 11 emulator screens, bringing them to 100% compliance with the design system. Every screen was audited for spacing, typography, color tokens, and component structure. The sprint covered Offer Hub, Suggested Conditions, Simulation, Summary, Installment Value, Due Date, Down Payment Value, Down Payment Date, Terms & Conditions, PIN, Eligibility, Loading, Success, and Feedback.

Fonts were migrated to self-hosted Nu Sans via the Vite asset pipeline — no more external font CDN calls. This improves load performance and removes a third-party dependency. Visual adjustments followed: hero section polish, font rendering fixes, and general UI tightening.

The Glossary Mock content for Expo Go (DND-2178) moved to In Progress — porting the web glossary data and searchable UI to the mobile companion. Expo Go Equalization (DND-2191) remains In Review.

The i18n system was cleaned up — locale files consolidated, unused keys removed, type exports streamlined. The flow config (config/flows.ts) and screen registry stay in sync with the new screens.

Remaining backlog is now purely integration and platform work: App.tsx Routing (DND-2174), Sequential Flow Navigation (DND-2175), Use Case Flows (DND-2190), Registry updates (DND-2176), Transition Presets (DND-2177), and the Management UI (DND-2180). The path to a fully navigable end-to-end demo is clear.

Stack: React 18, Vite 6, Motion 12, Expo SDK 52. Nu Sans self-hosted. No other dependency changes.`,
  },
  {
    date: '2026-04-20',
    title: 'PIN done, Loading/Success/Feedback started',
    body: `PIN Screen (DND-2170) completed — 4-digit BottomSheet built with NuDS PinCode, dual-platform, default 1234. Loading (DND-2171), Success (DND-2172), and Feedback (DND-2173) all entered In Progress. HomePage redesigned, responsive breakpoints with "nebule" layer added, documentation updated. 11 done, 50% of epic.`,
  },
  {
    date: '2026-04-16',
    title: '6 building blocks completed — Expo Go interface redesigned',
    body: `Major sprint closed today. Six screens moved from In Progress to Done in one push: Due Date (DND-2166), Down Payment Value (DND-2167), Down Payment Date (DND-2168), Terms & Conditions (DND-2169), Simulation variants (DND-2182), and Eligibility (DND-2207). That brings the epic from 4 to 10 completed tasks — almost half the backlog cleared.

The Expo Go companion app got a significant interface refresh. The HomeScreen was redesigned with a cleaner layout, the ConfigScreen now mirrors the web emulator's parameter panel more closely, and latency simulation was added to the mobile flow — you can now test loading states and delayed responses directly on the phone. The Expo Go Equalization task (DND-2191) is currently In Review.

On the web platform side, the Project Timeline page was overhauled: new Status Report hero card with editorial design (dark gradient, date block, shimmer), segmented progress bar showing done vs active with animated shimmer on the active segment, sliding tab filters, search field, and clickable Jira cards. The Sidebar was restructured — Project Timeline now sits at the base of the menu, separated from the main nav items.

NuDS compliance reached 100% across all existing screens. The Offer Hub, Suggested Conditions, Simulation, Summary, and Installment Value screens were all audited and corrected to match NuDS component library standards (spacing, typography, color tokens, component structure). This was validated via the Figma Design Check (DND-2181, completed earlier).

Dependencies were updated — cleaned up unused packages and aligned versions. Architecture stayed stable: React 18, Vite 6, Motion 12 on web; Expo SDK 52 on mobile. CSS custom properties (--nf-text, --nf-bg, --nf-accent, etc.) now power all web components consistently.

Next up: PIN, Loading, Success, and Feedback screens to complete the building blocks, then wiring the sequential flow navigation and end-to-end Use Case journeys.`,
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

  // ── Done tasks ── (completed 2026-04-16)
  {
    id: 'dnd-2181',
    jiraKey: 'DND-2181',
    type: 'task',
    title: 'Figma Design Check — NuDS Hiring Flow Screens',
    description: 'Reviewed all screen designs against NuDS component library standards. 100% compliance.',
    status: 'done',
    date: '2026-04-16',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2181',
    tags: ['design'],
    priority: 'medium',
  },
  {
    id: 'dnd-2166',
    jiraKey: 'DND-2166',
    type: 'task',
    title: 'Due Date Screen',
    description: 'Calendar/date grid for selecting monthly payment due date.',
    status: 'done',
    date: '2026-04-16',
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
    status: 'done',
    date: '2026-04-16',
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
    status: 'done',
    date: '2026-04-16',
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
    status: 'done',
    date: '2026-04-16',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2169',
    tags: ['building-block'],
    priority: 'high',
  },
  {
    id: 'dnd-2182',
    jiraKey: 'DND-2182',
    type: 'task',
    title: 'Simulation Screen + new variants',
    description: 'Extended with additional content variants and calculation modes.',
    status: 'done',
    date: '2026-04-16',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2182',
    tags: ['emulator'],
    priority: 'medium',
  },
  {
    id: 'dnd-2207',
    jiraKey: 'DND-2207',
    type: 'task',
    title: 'Eligibility Screen',
    description: 'Filter step that determines whether the customer qualifies for flexible installment options.',
    status: 'done',
    date: '2026-04-16',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2207',
    tags: ['building-block'],
    priority: 'high',
  },

  // ── Done tasks ── (completed 2026-04-22, batch 2)
  {
    id: 'dnd-2191',
    jiraKey: 'DND-2191',
    type: 'task',
    title: 'Expo Go Equalization — simplified mobile companion',
    description: 'Interface redesigned, latency simulation added, all screens validated on device.',
    status: 'done',
    date: '2026-04-22',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2191',
    tags: ['expo'],
    priority: 'medium',
  },

  // ── Done tasks ── (completed 2026-04-20)
  {
    id: 'dnd-2170',
    jiraKey: 'DND-2170',
    type: 'task',
    title: 'PIN Screen',
    description: '4-digit PIN BottomSheet using NuDS PinCode, dual-platform. Default 1234.',
    status: 'done',
    date: '2026-04-20',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2170',
    tags: ['building-block'],
    priority: 'medium',
  },

  // ── Done tasks ── (completed 2026-04-22)
  {
    id: 'dnd-2171',
    jiraKey: 'DND-2171',
    type: 'task',
    title: 'Loading Screen',
    description: 'Fullscreen loading with 3 sequential auto-advancing steps.',
    status: 'done',
    date: '2026-04-22',
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
    status: 'done',
    date: '2026-04-22',
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
    status: 'done',
    date: '2026-04-22',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2173',
    tags: ['building-block'],
    priority: 'medium',
  },

  {
    id: 'dnd-2174',
    jiraKey: 'DND-2174',
    type: 'task',
    title: 'App.tsx Routing Integration',
    description: 'All 13 screens imported and rendered with proper routing, variants, and type definitions.',
    status: 'done',
    date: '2026-04-22',
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
    description: 'Screen registry, config, README, and screenVariants all aligned with 13 done screens.',
    status: 'done',
    date: '2026-04-22',
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

  {
    id: 'dnd-2178',
    jiraKey: 'DND-2178',
    type: 'task',
    title: 'Glossary Mock content in Expo Go',
    description: 'Glossary data and searchable UI ported to Expo Go mobile app.',
    status: 'done',
    date: '2026-04-22',
    jiraUrl: 'https://nubank.atlassian.net/browse/DND-2178',
    tags: ['expo'],
    priority: 'low',
  },

  // ── Backlog: Integration ──
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
