#!/usr/bin/env tsx
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Flow Orbit 🛰️                                                  ║
 * ║  nf-product-manager — Negotiation Flow Platform Agent           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   pnpm orbit                          → sync Jira → update projectTimeline.ts
 *   pnpm orbit --notify                 → sync + Slack DM
 *   pnpm orbit --report                 → sync + Slack + weekly email report
 *   pnpm orbit --email=fulano@nu.com    → sync + send report to that email
 *
 * Required secrets (web/.env or GitHub Secrets):
 *   JIRA_EMAIL          your nubank email
 *   JIRA_API_TOKEN      https://id.atlassian.com/manage-profile/security/api-tokens
 *
 * Optional secrets (needed for --notify / --report):
 *   SLACK_WEBHOOK_URL   https://api.slack.com/messaging/webhooks
 *   RESEND_API_KEY      https://resend.com → free tier, no domain needed
 *   REPORT_EMAIL        your email for weekly reports
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env ────────────────────────────────────────────────────────────────
const envFile = resolve(__dirname, '../.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

// ─── CLI flags ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flags = {
  notify: argv.includes('--notify'),
  report: argv.includes('--report'),
  email: argv.find(a => a.startsWith('--email='))?.split('=')[1],
};

// ─── Credentials ──────────────────────────────────────────────────────────────
const jiraEmail = process.env.JIRA_EMAIL;
const jiraToken = process.env.JIRA_API_TOKEN;

if (!jiraEmail || !jiraToken) {
  console.error('\n❌  Missing JIRA_EMAIL or JIRA_API_TOKEN\n');
  console.error('    Add them to web/.env — see .env.example for instructions.\n');
  process.exit(1);
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const JIRA_BASE = 'https://nubank.atlassian.net/rest/api/3';
const OUTPUT    = resolve(__dirname, '../src/data/projectTimeline.ts');
const SNAPSHOT  = resolve(__dirname, '../src/data/jira-snapshot.json');
const PLATFORM_URL = 'https://nubank.github.io/negotiation-flow-ui-beta/';

const EPIC_KEYS = ['DND-2260', 'DND-2240', 'DND-2261', 'DND-2262', 'DND-2164'] as const;
const authHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`;

// ─── Static config (narrative text, not from Jira) ────────────────────────────
const EPIC_CONFIG: Record<string, { shortTitle: string; description: string }> = {
  'DND-2260': {
    shortTitle: 'Use Cases',
    description: 'Flow engine, sequential navigation and activation of Use Cases across all Product Lines as end-to-end flows.',
  },
  'DND-2240': {
    shortTitle: 'UC Wizard',
    description: 'Create and configure Use Cases without touching code. 4-step wizard with TypeScript export and direct launch in the emulator.',
  },
  'DND-2261': {
    shortTitle: 'Dr Strange',
    description: 'Integrate the emulator with the Dr Strange initiative as source of truth. Structured handover, export artifacts, versioning.',
  },
  'DND-2262': {
    shortTitle: 'Compare',
    description: 'Side-by-side visual comparison between Figma designs and live emulator screens. Diff viewer, overlay mode, AI-assisted analysis.',
  },
  'DND-2164': {
    shortTitle: 'Architecture',
    description: '13 building blocks, NuDS foundation, Expo Go, i18n, web emulator. Closed.',
  },
};

const PINNED_ENTRIES: Record<string, object[]> = {
  'DND-2164': [
    { id: 'rel-1.1', type: 'release', title: 'v1.1 — Experience Architecture + Amortization', status: 'done', date: '2026-04-14', tags: ['release'] },
    { id: 'rel-1.0', type: 'release', title: 'v1.0 — Platform Launch', status: 'done', date: '2026-03-28', tags: ['release'] },
  ],
};

// ─── Status report (edit here to add new entries) ─────────────────────────────
const STATUS_REPORT = [
  {
    date: '2026-04-22',
    title: 'Architecture epic closed — 4 new epics created',
    body: `DND-2164 closed as Done. All 13 building blocks delivered, NuDS 100%, Expo Go validated, fonts self-hosted, registry aligned. 18 of 22 tasks completed, 1 cancelled, 3 migrated.\n\nFour new epics created for the next phase:\n• DND-2260 — Use Case Content: flow engine + Use Cases across all Product Lines\n• DND-2240 — Flow Management: 4-step Use Case registration wizard\n• DND-2261 — Management UI: Dr Strange integration, source of truth\n• DND-2262 — Screen Compare: visual diff Figma vs live screens`,
  },
  {
    date: '2026-04-22',
    title: 'Building blocks complete, platform stable',
    body: `Loading, Success and Feedback completed. PIN delivered ahead of schedule. NuDS foundation sprint covered all screens. Nu Sans self-hosted via Vite. HomePage redesigned, responsive breakpoints added.`,
  },
  {
    date: '2026-04-16',
    title: '6 screens shipped — NuDS compliance 100%',
    body: `Due Date, Down Payment Value/Date, Terms & Conditions, Simulation variants and Eligibility completed. Project Timeline gained editorial report, segmented progress bar, filters and search.`,
  },
  {
    date: '2026-04-14',
    title: 'v1.1 — Experience Architecture + Amortization',
    body: `Experience Architecture replaced Analytics. Use Case Map and Capability Matrix now data-driven. Amortization system (Flat/Price/SAC) with selector in Rules panel.`,
  },
  {
    date: '2026-03-28',
    title: 'v1.0 — Platform launch',
    body: `Web emulator with 5 screens, Glossary, AI Assistant, NuDS theming, i18n (4 locales), password gate. Automated deploy on GitHub Pages.`,
  },
];

// ─── Jira API ─────────────────────────────────────────────────────────────────
type EntryStatus = 'done' | 'in-progress' | 'backlog' | 'cancelled';
type JiraIssue = {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    priority?: { name: string };
    labels?: string[];
    resolutiondate?: string | null;
  };
};

async function jiraGet<T>(path: string): Promise<T> {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    headers: { Authorization: authHeader, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Jira ${res.status} ${path}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

function mapStatus(s: string): EntryStatus {
  const l = s.toLowerCase();
  if (['done', 'closed', 'resolved', 'complete', 'released'].some(w => l.includes(w))) return 'done';
  if (['progress', 'review', 'dev', 'testing', 'active'].some(w => l.includes(w))) return 'in-progress';
  if (["cancel", "won't do", 'rejected'].some(w => l.includes(w))) return 'cancelled';
  return 'backlog';
}

function mapPriority(n?: string): 'high' | 'medium' | 'low' | undefined {
  if (!n) return undefined;
  const p = n.toLowerCase();
  if (['highest', 'critical', 'high'].includes(p)) return 'high';
  if (['low', 'lowest'].includes(p)) return 'low';
  return 'medium';
}

// ─── Change detection ─────────────────────────────────────────────────────────
type Snapshot = { syncedAt: string; tasks: Record<string, { status: string; title: string }> };

type Change = { key: string; title: string; from: string; to: string };

function loadSnapshot(): Snapshot {
  if (!existsSync(SNAPSHOT)) return { syncedAt: '', tasks: {} };
  return JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
}

function detectChanges(oldSnap: Snapshot, newTasks: { jiraKey: string; title: string; status: string }[]): Change[] {
  const changes: Change[] = [];
  for (const t of newTasks) {
    const old = oldSnap.tasks[t.jiraKey];
    if (old && old.status !== t.status) {
      changes.push({ key: t.jiraKey, title: t.title, from: old.status, to: t.status });
    }
  }
  return changes;
}

// ─── Slack notification ───────────────────────────────────────────────────────
// Workflow Builder webhooks expect { message: "plain text" }
async function slackNotify(text: string) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) { console.log('  ⚠️  SLACK_WEBHOOK_URL not set — skipping Slack'); return; }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) console.warn(`  ⚠️  Slack responded ${res.status}: ${await res.text()}`);
}

function buildSyncMessage(changes: Change[], stats: { total: number; done: number; active: number }): string {
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });

  const header = `🤖 *Flow Orbit* | ${timeStr} BRT — ${dateStr}`;

  if (changes.length === 0) {
    return `${header}\nNenhuma atualização desde a última sincronização. Jira está igual. 👌\n_${stats.total} tasks · ${pct}% done · ${PLATFORM_URL}_`;
  }

  const doneNow = changes.filter(c => c.to === 'done');
  const startedNow = changes.filter(c => c.to === 'in-progress');
  const lines: string[] = [`${header}\n*${changes.length} atualização${changes.length > 1 ? 'ões' : ''} detectada${changes.length > 1 ? 's' : ''}*`];

  if (doneNow.length > 0) {
    lines.push(`\n✅ *${doneNow.length} task${doneNow.length > 1 ? 's' : ''} concluída${doneNow.length > 1 ? 's' : ''}*`);
    lines.push(...doneNow.map(c => `• ${c.key} — ${c.title}`));
  }

  if (startedNow.length > 0) {
    lines.push(`\n🔵 *${startedNow.length} task${startedNow.length > 1 ? 's' : ''} em progresso*`);
    lines.push(...startedNow.map(c => `• ${c.key} — ${c.title}`));
  }

  lines.push(`\n_${stats.total} tasks · ${stats.done} done · ${pct}% · ${PLATFORM_URL}_`);
  return lines.join('\n');
}

// ─── Weekly report ────────────────────────────────────────────────────────────
function buildWeeklyReport(epics: any[]) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });

  const activeEpics = epics.filter(e => e.status !== 'done');
  const lines: string[] = [`📊 *Briefing semanal — ${dateStr}*\n`];

  for (const epic of activeEpics) {
    const tasks = epic.tasks.filter((t: any) => t.type === 'task');
    const done = tasks.filter((t: any) => t.status === 'done').length;
    const total = tasks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
    lines.push(`*${epic.key}* — ${epic.shortTitle}`);
    lines.push(`${bar} ${pct}% (${done}/${total})`);

    const highPrio = tasks.filter((t: any) => t.status !== 'done' && t.status !== 'cancelled' && t.priority === 'high');
    if (highPrio.length > 0) {
      lines.push(`↳ Próximas: ${highPrio.slice(0, 3).map((t: any) => t.jiraKey).join(', ')}`);
    }
    lines.push('');
  }

  lines.push(`${PLATFORM_URL}`);

  return {
    slack: lines.join('\n'),
    html: buildReportHtml(epics, dateStr),
    subject: `Flow Orbit — Briefing semanal ${dateStr}`,
  };
}

function buildReportHtml(epics: any[], dateStr: string): string {
  const activeEpics = epics.filter(e => e.status !== 'done');
  const rows = activeEpics.map(epic => {
    const tasks = epic.tasks.filter((t: any) => t.type === 'task');
    const done = tasks.filter((t: any) => t.status === 'done').length;
    const active = tasks.filter((t: any) => t.status === 'in-progress').length;
    const total = tasks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const highNext = tasks.filter((t: any) => t.status !== 'done' && t.status !== 'cancelled' && t.priority === 'high').slice(0, 3);
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #eee">
          <a href="https://nubank.atlassian.net/browse/${epic.key}" style="color:#820ad1;font-weight:700;text-decoration:none">${epic.key}</a>
          <div style="font-size:12px;color:#666;margin-top:2px">${epic.shortTitle}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center">
          <span style="font-size:20px;font-weight:800;color:${pct === 100 ? '#22c55e' : '#1a1a1a'}">${pct}%</span>
          <div style="font-size:11px;color:#999">${done}/${total}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee">
          <div style="background:#f0f0f0;border-radius:4px;height:8px;width:120px">
            <div style="background:#820ad1;border-radius:4px;height:8px;width:${pct * 1.2}px"></div>
          </div>
          <div style="font-size:11px;color:#999;margin-top:4px">${active} em progresso</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:12px;color:#555">
          ${highNext.map((t: any) => `<a href="${t.jiraUrl}" style="color:#820ad1;text-decoration:none">${t.jiraKey}</a>`).join(', ') || '—'}
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f8f8;margin:0;padding:32px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#820ad1;padding:24px 32px">
      <div style="color:#fff;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;opacity:0.7">Negotiation Flow Platform</div>
      <div style="color:#fff;font-size:22px;font-weight:800;margin-top:4px">Briefing semanal</div>
      <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px">${dateStr}</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f9f9f9">
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#999;font-weight:600;text-transform:uppercase">Epic</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:#999;font-weight:600;text-transform:uppercase">%</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#999;font-weight:600;text-transform:uppercase">Progresso</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#999;font-weight:600;text-transform:uppercase">Próximas</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="padding:24px 32px;text-align:center">
      <a href="${PLATFORM_URL}" style="background:#820ad1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Abrir plataforma →</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center">
      Flow Orbit · Negotiation Flow Platform · Este é um envio automático
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.log('  ⚠️  RESEND_API_KEY not set — skipping email'); return; }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Flow Orbit <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });

  if (res.ok) {
    console.log(`  📧  Email enviado para ${to}`);
  } else {
    const err = await res.text();
    console.warn(`  ⚠️  Email falhou (${res.status}): ${err}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🛰️   Flow Orbit — iniciando sync...\n');

  const oldSnapshot = loadSnapshot();
  const epics: any[] = [];
  const allNewTasks: { jiraKey: string; title: string; status: string }[] = [];

  for (const key of EPIC_KEYS) {
    process.stdout.write(`  ⟳  ${key}...`);

    const epic = await jiraGet<JiraIssue>(`/issue/${key}?fields=summary,status`);
    const jql = encodeURIComponent(`"Epic Link" = ${key} ORDER BY created ASC`);
    const { issues } = await jiraGet<{ issues: JiraIssue[] }>(
      `/search/jql?jql=${jql}&fields=summary,status,priority,labels,resolutiondate&maxResults=100`
    );

    const epicStatus = mapStatus(epic.fields.status.name);
    const cfg = EPIC_CONFIG[key] ?? { shortTitle: key, description: '' };
    const pinned = PINNED_ENTRIES[key] ?? [];

    const tasks = [
      ...pinned,
      ...issues.map(issue => {
        const status = mapStatus(issue.fields.status.name);
        const priority = mapPriority(issue.fields.priority?.name);
        const tags = (issue.fields.labels ?? []).length > 0 ? issue.fields.labels : undefined;
        const date = issue.fields.resolutiondate?.slice(0, 10);
        allNewTasks.push({ jiraKey: issue.key, title: issue.fields.summary, status });
        return {
          id: issue.key.toLowerCase(),
          jiraKey: issue.key,
          type: 'task',
          title: issue.fields.summary,
          status,
          ...(date ? { date } : {}),
          jiraUrl: `https://nubank.atlassian.net/browse/${issue.key}`,
          ...(tags ? { tags } : {}),
          ...(priority ? { priority } : {}),
        };
      }),
    ];

    const done = tasks.filter((t: any) => t.status === 'done').length;
    console.log(` ✓  (${issues.length} tasks, ${done} done)`);

    epics.push({
      key,
      title: epic.fields.summary,
      shortTitle: cfg.shortTitle,
      description: cfg.description,
      url: `https://nubank.atlassian.net/browse/${key}`,
      status: epicStatus,
      tasks,
    });
  }

  // Detect changes
  const changes = detectChanges(oldSnapshot, allNewTasks);

  // Write projectTimeline.ts
  const syncDate = new Date().toISOString();
  writeFileSync(OUTPUT, `/**
 * Project Timeline — Multi-epic data layer.
 *
 * ⚠️  AUTO-GENERATED by Flow Orbit (scripts/nf-product-manager.ts)
 *     Run \`pnpm pm\` to refresh. Do not edit manually.
 *     Last sync: ${syncDate}
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

export const STATUS_REPORT: StatusReportEntry[] = ${JSON.stringify(STATUS_REPORT, null, 2)};

export const EPICS: EpicDefinition[] = ${JSON.stringify(epics, null, 2)};

export const TIMELINE: TimelineEntry[] = EPICS.flatMap((e) => e.tasks);

export const EPIC = {
  key: EPICS[0].key,
  title: EPICS[0].title,
  url: EPICS[0].url,
  status: EPICS[0].status,
};
`, 'utf8');

  // Save snapshot for next run
  const newSnapshot: Snapshot = {
    syncedAt: syncDate,
    tasks: Object.fromEntries(allNewTasks.map(t => [t.jiraKey, { status: t.status, title: t.title }])),
  };
  writeFileSync(SNAPSHOT, JSON.stringify(newSnapshot, null, 2), 'utf8');

  // Global stats
  const allTasks = allNewTasks;
  const stats = {
    total: allTasks.length,
    done: allTasks.filter(t => t.status === 'done').length,
    active: allTasks.filter(t => t.status === 'in-progress').length,
  };

  // Print summary
  console.log('\n──────────────────────────────────────────────');
  console.log('✅  projectTimeline.ts atualizado');
  if (changes.length > 0) {
    console.log(`\n📋  ${changes.length} mudança(s) detectada(s):`);
    for (const c of changes) console.log(`    ${c.key} ${c.from} → ${c.to}`);
  } else {
    console.log('    Sem mudanças desde o último sync.');
  }
  console.log(`\n    ${stats.total} tasks · ${stats.done} done · ${Math.round((stats.done / Math.max(stats.total, 1)) * 100)}%`);
  console.log('──────────────────────────────────────────────\n');

  // Slack notification
  if (flags.notify || flags.report) {
    process.stdout.write('  📣  Enviando para Slack...');
    await slackNotify(buildSyncMessage(changes, stats));
    console.log(' ✓');
  }

  // Weekly report
  if (flags.report || flags.email) {
    const report = buildWeeklyReport(epics);

    if (flags.report) {
      process.stdout.write('  📊  Enviando weekly report para Slack...');
      await slackNotify(report.slack as string);
      console.log(' ✓');
    }

    const emailTarget = flags.email ?? process.env.REPORT_EMAIL;
    if (emailTarget) {
      process.stdout.write(`  📧  Enviando email para ${emailTarget}...`);
      await sendEmail(emailTarget, report.subject, report.html);
    }
  }

  console.log('');
}

run().catch(err => {
  console.error('\n❌  Julião falhou:\n', err.message);
  process.exit(1);
});
