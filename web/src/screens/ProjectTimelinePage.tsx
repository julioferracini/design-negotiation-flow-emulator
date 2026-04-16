import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Check, Clock, Inbox, CircleX, Tag, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { EPIC, TIMELINE, STATUS_REPORT, type EntryStatus, type TimelineEntry } from '../data/projectTimeline';

type Filter = 'all' | EntryStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'done', label: 'Done' },
  { id: 'in-progress', label: 'Active' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_META: Record<EntryStatus, { label: string; color: string; darkColor: string }> = {
  done: { label: 'Done', color: '#2E7D32', darkColor: '#66BB6A' },
  'in-progress': { label: 'Active', color: '#1565C0', darkColor: '#42A5F5' },
  backlog: { label: 'Backlog', color: '#78909C', darkColor: '#90A4AE' },
  cancelled: { label: 'Cancelled', color: '#C62828', darkColor: '#EF9A9A' },
};

const PRIORITY_COLORS: Record<string, string> = { high: '#E53935', medium: '#FB8C00', low: '#43A047' };

export default function ProjectTimelinePage() {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const [filter, setFilter] = useState<Filter>('all');
  const [reportOpen, setReportOpen] = useState(false);

  const stats = useMemo(() => {
    const tasks = TIMELINE.filter((e) => e.type === 'task');
    return {
      total: tasks.length,
      done: tasks.filter((e) => e.status === 'done').length,
      inProgress: tasks.filter((e) => e.status === 'in-progress').length,
      backlog: tasks.filter((e) => e.status === 'backlog').length,
    };
  }, []);

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === 'all') return TIMELINE;
    return TIMELINE.filter((e) => e.status === filter);
  }, [filter]);

  return (
    <div className="nf-page nf-page--flex-col" data-mode={mode}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          padding: '28px 48px 32px 72px',
        }}
      >
        {/* ── Header row ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: 28, flexShrink: 0, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h1 style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', margin: 0,
              color: 'var(--nf-text)',
            }}>
              Project Timeline
            </h1>
            <p style={{ fontSize: 13, margin: '5px 0 0', lineHeight: 1.5, color: 'var(--nf-text-secondary)' }}>
              Development progress for the Negotiation Flow Platform.
            </p>
          </div>

          {/* Epic link — compact, right-aligned */}
          <a
            href={EPIC.url}
            target="_blank"
            rel="noopener noreferrer"
            className="nf-page__chip"
            style={{
              padding: '8px 14px', borderRadius: 9999,
              border: '1px solid var(--nf-border)',
              background: 'var(--nf-bg-secondary)',
              textDecoration: 'none', fontSize: 11, fontWeight: 600,
              color: 'var(--nf-text-secondary)',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.accent; e.currentTarget.style.color = palette.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--nf-border)'; e.currentTarget.style.color = 'var(--nf-text-secondary)'; }}
          >
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--nf-accent)' }}>{EPIC.key}</span>
            <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{EPIC.title}</span>
            <ExternalLink size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
          </a>
        </div>

        {/* ── Progress strip ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          marginBottom: 24, flexShrink: 0,
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 3, borderRadius: 2, background: 'var(--nf-border)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                style={{ height: '100%', borderRadius: 2, background: 'var(--nf-accent)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--nf-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              <span><strong style={{ color: 'var(--nf-text)', fontWeight: 700 }}>{progress}%</strong> complete</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span><strong style={{ color: '#43A047', fontWeight: 600 }}>{stats.done}</strong> done</span>
              <span><strong style={{ color: '#FB8C00', fontWeight: 600 }}>{stats.inProgress}</strong> active</span>
              <span><strong style={{ color: '#78909C', fontWeight: 600 }}>{stats.backlog}</strong> backlog</span>
            </div>
          </div>
        </div>

        {/* ── Status Report ── */}
        {STATUS_REPORT.length > 0 && (
          <div style={{ marginBottom: 16, flexShrink: 0 }}>
            <button
              onClick={() => setReportOpen(!reportOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--nf-border)',
                background: 'var(--nf-bg-secondary)',
                cursor: 'pointer', transition: 'border-color 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--nf-border)'; }}
            >
              <FileText size={14} style={{ color: 'var(--nf-accent)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nf-text)', lineHeight: 1.3 }}>
                  {STATUS_REPORT[0].title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--nf-text-secondary)', marginTop: 2 }}>
                  Status Report · {STATUS_REPORT[0].date}
                </div>
              </div>
              {reportOpen
                ? <ChevronUp size={14} style={{ color: 'var(--nf-text-secondary)', flexShrink: 0 }} />
                : <ChevronDown size={14} style={{ color: 'var(--nf-text-secondary)', flexShrink: 0 }} />
              }
            </button>

            <AnimatePresence>
              {reportOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    padding: '16px 14px 8px',
                    borderLeft: `2px solid var(--nf-accent)`,
                    marginLeft: 7, marginTop: 8,
                    display: 'flex', flexDirection: 'column', gap: 20,
                  }}>
                    {STATUS_REPORT.map((entry) => (
                      <div key={entry.date}>
                        <div style={{
                          display: 'flex', alignItems: 'baseline', gap: 10,
                          marginBottom: 6,
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: 'var(--nf-accent)',
                            fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums',
                          }}>
                            {entry.date}
                          </span>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: 'var(--nf-text)',
                            lineHeight: 1.3,
                          }}>
                            {entry.title}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 12, color: 'var(--nf-text-secondary)',
                          lineHeight: 1.65, whiteSpace: 'pre-line',
                        }}>
                          {entry.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Filters + count ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: 2, padding: 3, borderRadius: 10,
            background: 'var(--nf-border)', width: 'fit-content',
          }}>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: active ? 700 : 500,
                    background: active ? 'var(--nf-bg-secondary)' : 'transparent',
                    color: active ? 'var(--nf-text)' : 'var(--nf-text-secondary)',
                    boxShadow: active ? 'var(--nf-shadow-sm)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--nf-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {filtered.length} items
          </span>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'var(--nf-border)', marginBottom: 4, flexShrink: 0 }} />

        {/* ── Timeline list ── */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 24 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.012, duration: 0.2 }}
              >
                <Row entry={entry} isLight={isLight} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ entry, isLight }: {
  entry: TimelineEntry; isLight: boolean;
}) {
  const sm = STATUS_META[entry.status];
  const statusColor = isLight ? sm.color : sm.darkColor;
  const isRelease = entry.type === 'release';

  const StatusIcon = entry.status === 'done' ? Check
    : entry.status === 'in-progress' ? Clock
    : entry.status === 'cancelled' ? CircleX
    : Inbox;

  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '14px 16px',
        borderBottom: '1px solid var(--nf-border)',
        alignItems: 'flex-start',
        borderRadius: 8, marginBottom: 4,
        background: 'var(--nf-bg-secondary)',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.018)' : 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--nf-bg-secondary)'; }}
    >
      {/* Status icon */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        flexShrink: 0, paddingTop: 3,
      }}>
        <StatusIcon size={14} strokeWidth={2.2} color={statusColor} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Jira key */}
        {entry.jiraKey && (
          <a
            href={entry.jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 10, fontWeight: 700, color: 'var(--nf-accent)',
              fontFamily: 'monospace', letterSpacing: '0.3px',
              textDecoration: 'none', display: 'inline-block', marginBottom: 2,
            }}
          >
            {entry.jiraKey}
          </a>
        )}
        {/* Title + date */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{
            flex: 1, minWidth: 0,
            fontSize: 13, fontWeight: isRelease ? 700 : 600,
            color: 'var(--nf-text)', lineHeight: 1.4,
            letterSpacing: '-0.1px', wordBreak: 'break-word',
          }}>
            {entry.title}
          </span>
          {entry.date && (
            <span style={{
              fontSize: 10, color: 'var(--nf-text-secondary)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2,
            }}>
              {entry.date}
            </span>
          )}
        </div>

        {entry.description && (
          <p style={{
            fontSize: 12, color: 'var(--nf-text-secondary)',
            margin: '4px 0 0', lineHeight: 1.5,
          }}>
            {entry.description}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            className="nf-page__badge"
            style={{ gap: 4, color: statusColor }}
          >
            <StatusIcon size={10} strokeWidth={2.2} />
            {sm.label}
          </span>

          {entry.priority && (
            <>
              <span style={{ color: 'var(--nf-border)', fontSize: 10 }}>·</span>
              <span
                className="nf-page__chip"
                style={{ color: 'var(--nf-text-secondary)' }}
              >
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: PRIORITY_COLORS[entry.priority] ?? 'var(--nf-text-secondary)',
                }} />
                {entry.priority}
              </span>
            </>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <>
              <span style={{ color: 'var(--nf-border)', fontSize: 10 }}>·</span>
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="nf-page__chip"
                  style={{ color: 'var(--nf-text-secondary)', opacity: 0.75 }}
                >
                  <Tag size={8} />
                  {tag}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
