/**
 * Project Timeline — Multi-epic data layer.
 *
 * Static mock mirroring Jira. Each epic has its own task list.
 * Future: replace with Jira API calls.
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

export interface EpicDefinition {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  url: string;
  status: 'done' | 'in-progress' | 'backlog';
  tasks: TimelineEntry[];
}

export interface StatusReportEntry {
  date: string;
  title: string;
  body: string;
}

// ─────────────────────────────────────────────
// Status Report — changelog narrativo
// ─────────────────────────────────────────────

export const STATUS_REPORT: StatusReportEntry[] = [
  {
    date: '2026-04-22',
    title: 'Architecture epic closed — 4 new epics created',
    body: `DND-2164 fechado como Done. Todas as 13 building blocks entregues, NuDS 100%, Expo Go validado, fonts self-hosted, registry alinhado. 18 de 22 tasks concluidas, 1 cancelada, 3 migradas.

Quatro novos epics criados para a proxima fase:
• DND-2260 — Use Case Content: flow engine + 6 Use Cases de Debt Resolution (Lending e CC adiados)
• DND-2240 — Flow Management: wizard de cadastro de UCs com 4 steps
• DND-2261 — Management UI: integracao com Dr Strange, source of truth
• DND-2262 — Screen Compare: diff visual Figma vs telas live

Tasks de infra (Sequential Navigation, Transition Presets, UC Flows) migradas para o DND-2260. Transition Presets ja marcada como Done no Jira.`,
  },
  {
    date: '2026-04-22',
    title: 'Building blocks finalizados, plataforma estavel',
    body: `Loading, Success e Feedback concluidos. PIN entregue antes. NuDS foundation sprint cobriu todas as telas. Nu Sans self-hosted via Vite. HomePage redesenhada, breakpoints responsivos adicionados. Registry e routing verificados e alinhados. Expo Go equalizado com latencia funcionando.`,
  },
  {
    date: '2026-04-16',
    title: '6 telas de uma vez — NuDS compliance 100%',
    body: `Due Date, Down Payment Value/Date, Terms & Conditions, Simulation variants e Eligibility concluidas. Expo Go redesenhado com latencia. Project Timeline ganhou report editorial, progress bar segmentada, filtros deslizantes e busca. Sidebar reestruturada.`,
  },
  {
    date: '2026-04-14',
    title: 'v1.1 — Experience Architecture + Amortization',
    body: `Experience Architecture substituiu Analytics. Use Case Map e Capability Matrix data-driven. Sistema de amortizacao (Flat/Price/SAC) com seletor no Rules panel. Financial Rules consolidado em drawer unico. Tres tasks fechadas.`,
  },
  {
    date: '2026-03-28',
    title: 'v1.0 — Lancamento da plataforma',
    body: `Web emulator com 5 telas, Glossary, AI Assistant, NuDS theming, i18n (4 locales), password gate. Deploy automatico no GitHub Pages. Expo Go mobile companion em paralelo.`,
  },
];

// ─────────────────────────────────────────────
// Epics
// ─────────────────────────────────────────────

export const EPICS: EpicDefinition[] = [
  {
    key: 'DND-2260',
    title: 'Use Case Content & Flow Navigation',
    shortTitle: 'Use Cases',
    description: 'Flow engine, navegacao sequencial e ativacao dos Use Cases de Debt Resolution como flows end-to-end.',
    url: 'https://nubank.atlassian.net/browse/DND-2260',
    status: 'backlog',
    tasks: [
      { id: 'dnd-2175', jiraKey: 'DND-2175', type: 'task', title: 'Sequential Flow Navigation', description: 'Engine que le ScreenVisibility e encadeia telas com skip logic.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2175', tags: ['infra'], priority: 'high' },
      { id: 'dnd-2177', jiraKey: 'DND-2177', type: 'task', title: 'Per-Screen Transition Presets', description: 'Aplicar presets do registry (slideUp, fade, slideLeft) na navegacao.', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2177', tags: ['infra'], priority: 'low' },
      { id: 'dnd-2190', jiraKey: 'DND-2190', type: 'task', title: 'Use Case Flows — end-to-end', description: 'State machine idle → running → done, data passing, back navigation.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2190', tags: ['infra'], priority: 'high' },
      { id: 'dnd-2250', jiraKey: 'DND-2250', type: 'task', title: 'UseCaseRegistryContext', description: 'Mock store mutavel para Use Cases, inicializa do estatico.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2250', tags: ['infra'], priority: 'medium' },
      { id: 'dnd-2254', jiraKey: 'DND-2254', type: 'task', title: 'FlowManagementPage', description: 'Lista de Use Cases com status e acoes de gerenciamento.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2254', tags: ['platform'], priority: 'medium' },
      { id: 'dnd-2243', jiraKey: 'DND-2243', type: 'task', title: 'MDR — Multi-debt Renegotiation', description: 'All screens ON, flat_discount, 4 locales. Piloto do flow engine.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2243', tags: ['debt-resolution'], priority: 'high' },
      { id: 'dnd-2244', jiraKey: 'DND-2244', type: 'task', title: 'Late Lending — Short', description: 'Flow A, sem downpayment, ate 24 parcelas.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2244', tags: ['debt-resolution'], priority: 'medium' },
      { id: 'dnd-2245', jiraKey: 'DND-2245', type: 'task', title: 'Late Lending — Long', description: 'Flow A+B, downpayment enabled, ate 72 parcelas.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2245', tags: ['debt-resolution'], priority: 'medium' },
      { id: 'dnd-2246', jiraKey: 'DND-2246', type: 'task', title: 'CC Long — Agreements', description: 'Simulation e inputValue OFF, testa skip logic.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2246', tags: ['debt-resolution'], priority: 'high' },
      { id: 'dnd-2247', jiraKey: 'DND-2247', type: 'task', title: 'FP — Fatura Parcelada', description: 'Suggested OFF, formula Price, BR only.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2247', tags: ['debt-resolution'], priority: 'medium' },
      { id: 'dnd-2248', jiraKey: 'DND-2248', type: 'task', title: 'RDP — Renegociacao de Pendencias', description: 'Flow A, flat_discount, BR only.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2248', tags: ['debt-resolution'], priority: 'medium' },
      { id: 'dnd-2251', jiraKey: 'DND-2251', type: 'task', title: 'Private Payroll', description: 'Formula Price, pinEnabled, 4 locales.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2251', tags: ['lending'], priority: 'medium' },
    ],
  },
  {
    key: 'DND-2240',
    title: 'UC Registration Wizard',
    shortTitle: 'UC Wizard',
    description: 'Criar Use Cases sem editar codigo. Wizard em 4 steps com export TypeScript e launch direto no emulator.',
    url: 'https://nubank.atlassian.net/browse/DND-2240',
    status: 'backlog',
    tasks: [
      { id: 'dnd-2258', jiraKey: 'DND-2258', type: 'task', title: 'UseCaseWizardPage', description: 'Wizard multi-step de registro de Use Cases (Steps 1-4).', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2258', tags: ['wizard'], priority: 'high' },
      { id: 'dnd-2259', jiraKey: 'DND-2259', type: 'task', title: 'Routes & Emulator Integration', description: 'Rotas /flow-management e /flow-management/new + integracao com emulator.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2259', tags: ['integration'], priority: 'medium' },
    ],
  },
  {
    key: 'DND-2261',
    title: 'Platform Integration — Dr Strange',
    shortTitle: 'Dr Strange',
    description: 'Conectar o emulator ao Dr Strange como source of truth. Handover estruturado, export de artefatos, versionamento.',
    url: 'https://nubank.atlassian.net/browse/DND-2261',
    status: 'backlog',
    tasks: [
      { id: 'dnd-2180', jiraKey: 'DND-2180', type: 'task', title: 'Management User Interface', description: 'Admin tools para gerenciar versoes de produto e experiments.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2180', tags: ['platform'], priority: 'high' },
      { id: 'dnd-2263', jiraKey: 'DND-2263', type: 'task', title: 'Report Prototype — NuDS Check for BDC overview', description: 'Prototipo de report no emulator com visao consolidada do BDC.', status: 'backlog', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2263', tags: ['report'], priority: 'medium' },
    ],
  },
  {
    key: 'DND-2262',
    title: 'Screen Compare — Figma vs Live',
    shortTitle: 'Compare',
    description: 'Comparacao visual side-by-side entre Figma e telas live do emulator. Diff viewer, overlay, AI analysis.',
    url: 'https://nubank.atlassian.net/browse/DND-2262',
    status: 'backlog',
    tasks: [],
  },
  {
    key: 'DND-2164',
    title: 'Architecture — Negotiation Flow Platform',
    shortTitle: 'Architecture',
    description: '13 building blocks, NuDS foundation, Expo Go, i18n, web emulator. Fechado.',
    url: 'https://nubank.atlassian.net/browse/DND-2164',
    status: 'done',
    tasks: [
      { id: 'rel-1.1', type: 'release', title: 'v1.1 — Experience Architecture + Amortization', status: 'done', date: '2026-04-14', tags: ['release'] },
      { id: 'rel-1.0', type: 'release', title: 'v1.0 — Platform Launch', status: 'done', date: '2026-03-28', tags: ['release'] },
      { id: 'dnd-2187', jiraKey: 'DND-2187', type: 'task', title: 'Experience Architecture', status: 'done', date: '2026-04-14', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2187', tags: ['platform'], priority: 'high' },
      { id: 'dnd-2188', jiraKey: 'DND-2188', type: 'task', title: 'Amortization Tables', status: 'done', date: '2026-04-14', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2188', tags: ['emulator'], priority: 'high' },
      { id: 'dnd-2189', jiraKey: 'DND-2189', type: 'task', title: 'Financial Rules Panel', status: 'done', date: '2026-04-14', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2189', tags: ['emulator'], priority: 'medium' },
      { id: 'dnd-2181', jiraKey: 'DND-2181', type: 'task', title: 'Figma Design Check — NuDS', status: 'done', date: '2026-04-16', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2181', tags: ['design'], priority: 'medium' },
      { id: 'dnd-2166', jiraKey: 'DND-2166', type: 'task', title: 'Due Date Screen', status: 'done', date: '2026-04-16', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2166', tags: ['building-block'], priority: 'high' },
      { id: 'dnd-2167', jiraKey: 'DND-2167', type: 'task', title: 'Down Payment Value', status: 'done', date: '2026-04-16', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2167', tags: ['building-block'], priority: 'high' },
      { id: 'dnd-2168', jiraKey: 'DND-2168', type: 'task', title: 'Down Payment Date', status: 'done', date: '2026-04-16', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2168', tags: ['building-block'], priority: 'medium' },
      { id: 'dnd-2169', jiraKey: 'DND-2169', type: 'task', title: 'Terms & Conditions', status: 'done', date: '2026-04-16', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2169', tags: ['building-block'], priority: 'high' },
      { id: 'dnd-2182', jiraKey: 'DND-2182', type: 'task', title: 'Simulation + variants', status: 'done', date: '2026-04-16', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2182', tags: ['emulator'], priority: 'medium' },
      { id: 'dnd-2207', jiraKey: 'DND-2207', type: 'task', title: 'Eligibility Screen', status: 'done', date: '2026-04-16', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2207', tags: ['building-block'], priority: 'high' },
      { id: 'dnd-2170', jiraKey: 'DND-2170', type: 'task', title: 'PIN Screen', status: 'done', date: '2026-04-20', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2170', tags: ['building-block'], priority: 'medium' },
      { id: 'dnd-2171', jiraKey: 'DND-2171', type: 'task', title: 'Loading Screen', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2171', tags: ['building-block'], priority: 'medium' },
      { id: 'dnd-2172', jiraKey: 'DND-2172', type: 'task', title: 'Success Screen', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2172', tags: ['building-block'], priority: 'medium' },
      { id: 'dnd-2173', jiraKey: 'DND-2173', type: 'task', title: 'Feedback Screen', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2173', tags: ['building-block'], priority: 'medium' },
      { id: 'dnd-2174', jiraKey: 'DND-2174', type: 'task', title: 'App.tsx Routing', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2174', tags: ['integration'], priority: 'high' },
      { id: 'dnd-2176', jiraKey: 'DND-2176', type: 'task', title: 'Registry & Config Updates', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2176', tags: ['integration'], priority: 'medium' },
      { id: 'dnd-2178', jiraKey: 'DND-2178', type: 'task', title: 'Glossary Expo Go', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2178', tags: ['expo'], priority: 'low' },
      { id: 'dnd-2191', jiraKey: 'DND-2191', type: 'task', title: 'Expo Go Equalization', status: 'done', date: '2026-04-22', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2191', tags: ['expo'], priority: 'medium' },
      { id: 'dnd-2179', jiraKey: 'DND-2179', type: 'task', title: 'Analytics (cancelled)', status: 'cancelled', jiraUrl: 'https://nubank.atlassian.net/browse/DND-2179', tags: ['platform'], priority: 'medium' },
    ],
  },
];

/** Flat list of all tasks across all epics — for backward compat */
export const TIMELINE: TimelineEntry[] = EPICS.flatMap((e) => e.tasks);

/** Legacy single-epic reference — points to the first active epic */
export const EPIC = {
  key: EPICS[0].key,
  title: EPICS[0].title,
  url: EPICS[0].url,
  status: EPICS[0].status,
};
