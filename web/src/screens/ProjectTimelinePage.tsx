import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Check, Clock, Inbox, CircleX, Tag, FileText, ChevronDown, Search, X } from 'lucide-react';
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
  const [search, setSearch] = useState('');
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
    const q = search.trim().toLowerCase();
    return TIMELINE.filter((e) => {
      if (filter !== 'all' && e.status !== filter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q)
        || (e.description?.toLowerCase().includes(q) ?? false)
        || (e.jiraKey?.toLowerCase().includes(q) ?? false)
        || (e.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [filter, search]);

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
          <div style={{ marginBottom: 20, flexShrink: 0 }}>
            {/* Hero card — always visible */}
            <button
              onClick={() => setReportOpen(!reportOpen)}
              style={{
                display: 'flex', alignItems: 'stretch', width: '100%',
                padding: 0, borderRadius: 14, overflow: 'hidden',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isLight
                  ? `linear-gradient(135deg, ${palette.accent}0D 0%, ${palette.accent}05 100%)`
                  : `linear-gradient(135deg, ${palette.accent}18 0%, ${palette.accent}08 100%)`,
                boxShadow: isLight
                  ? `0 1px 3px rgba(0,0,0,0.06), inset 0 0 0 1px ${palette.accent}20`
                  : `0 1px 4px rgba(0,0,0,0.2), inset 0 0 0 1px ${palette.accent}25`,
                transition: 'box-shadow 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isLight
                  ? `0 3px 12px ${palette.accent}18, inset 0 0 0 1px ${palette.accent}35`
                  : `0 3px 16px ${palette.accent}20, inset 0 0 0 1px ${palette.accent}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = isLight
                  ? `0 1px 3px rgba(0,0,0,0.06), inset 0 0 0 1px ${palette.accent}20`
                  : `0 1px 4px rgba(0,0,0,0.2), inset 0 0 0 1px ${palette.accent}25`;
              }}
            >
              {/* Accent bar */}
              <div style={{
                width: 4, flexShrink: 0, borderRadius: '14px 0 0 14px',
                background: palette.accent,
              }} />

              <div style={{
                flex: 1, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                {/* Icon badge */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: isLight ? `${palette.accent}15` : `${palette.accent}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={18} style={{ color: palette.accent }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: 1, color: palette.accent, marginBottom: 4,
                  }}>
                    Status Report · {STATUS_REPORT[0].date}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: 'var(--nf-text)',
                    lineHeight: 1.35, letterSpacing: '-0.2px',
                  }}>
                    {STATUS_REPORT[0].title}
                  </div>
                  <AnimatePresence mode="wait">
                    {!reportOpen && (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          fontSize: 12, color: 'var(--nf-text-secondary)',
                          marginTop: 4, lineHeight: 1.5,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                        }}>
                          {STATUS_REPORT[0].body.split('\n')[0]}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Chevron */}
                <motion.div
                  animate={{ rotate: reportOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ChevronDown size={14} style={{ color: 'var(--nf-text-secondary)' }} />
                </motion.div>
              </div>
            </button>

            {/* Expanded report entries */}
            <AnimatePresence>
              {reportOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.25, delay: 0.1, ease: 'easeOut' },
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    marginTop: 12,
                    borderRadius: 12,
                    border: '1px solid var(--nf-border)',
                    background: 'var(--nf-bg-secondary)',
                    overflow: 'hidden',
                  }}>
                    {STATUS_REPORT.map((entry, idx) => (
                      <motion.div
                        key={entry.date}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.15 + idx * 0.08,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        style={{
                          padding: '20px 24px',
                          borderTop: idx > 0 ? '1px solid var(--nf-border)' : undefined,
                        }}
                      >
                        {/* Entry header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: idx === 0 ? palette.accent : 'var(--nf-text-secondary)',
                            opacity: idx === 0 ? 1 : 0.35,
                          }} />
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: palette.accent,
                            fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums',
                          }}>
                            {entry.date}
                          </span>
                          <span style={{
                            fontSize: 13, fontWeight: 700, color: 'var(--nf-text)',
                            lineHeight: 1.35,
                          }}>
                            {entry.title}
                          </span>
                        </div>

                        {/* Entry body */}
                        <div style={{
                          fontSize: 12.5, color: 'var(--nf-text-secondary)',
                          lineHeight: 1.7, whiteSpace: 'pre-line',
                          paddingLeft: 20,
                        }}>
                          {entry.body}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Filters + search ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16, flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: 2, padding: 4, borderRadius: 12,
            background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            width: 'fit-content', flexShrink: 0,
            position: 'relative',
          }}>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    background: 'transparent',
                    color: active ? 'var(--nf-text)' : 'var(--nf-text-secondary)',
                    position: 'relative', zIndex: 1,
                    transition: 'color 0.2s',
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="timeline-filter-pill"
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 9,
                        background: 'var(--nf-bg-secondary)',
                        boxShadow: isLight
                          ? '0 1px 3px rgba(0,0,0,0.1)'
                          : '0 1px 4px rgba(0,0,0,0.3)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{f.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8,
            border: '1px solid var(--nf-border)',
            background: 'var(--nf-bg-secondary)',
            maxWidth: 220, width: '100%',
            transition: 'border-color 0.15s',
          }}
            onFocus={(e) => { e.currentTarget.style.borderColor = palette.accent; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--nf-border)'; }}
          >
            <Search size={12} style={{ color: 'var(--nf-text-secondary)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 11, color: 'var(--nf-text)',
                fontFamily: 'inherit',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: 4,
                  border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                  background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                }}
              >
                <X size={10} style={{ color: 'var(--nf-text-secondary)' }} />
              </button>
            )}
          </div>

          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--nf-text-secondary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
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

  const rowStyle: React.CSSProperties = {
    display: 'flex', gap: 14, padding: '14px 16px',
    borderBottom: '1px solid var(--nf-border)',
    alignItems: 'flex-start',
    borderRadius: 8, marginBottom: 4,
    background: 'var(--nf-bg-secondary)',
    transition: 'background 0.12s ease',
    textDecoration: 'none', color: 'inherit',
    cursor: entry.jiraUrl ? 'pointer' : 'default',
  };
  const hoverIn = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.06)'; };
  const hoverOut = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = 'var(--nf-bg-secondary)'; };

  if (!entry.jiraUrl) {
    return (
      <div style={rowStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
        <RowContent entry={entry} isLight={isLight} statusColor={statusColor} StatusIcon={StatusIcon} sm={sm} isRelease={isRelease} />
      </div>
    );
  }

  return (
    <a
      href={entry.jiraUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={rowStyle}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      <RowContent entry={entry} isLight={isLight} statusColor={statusColor} StatusIcon={StatusIcon} sm={sm} isRelease={isRelease} />
    </a>
  );
}

function RowContent({ entry, statusColor, StatusIcon, sm, isRelease }: {
  entry: TimelineEntry; isLight: boolean; statusColor: string;
  StatusIcon: typeof Check; sm: { label: string }; isRelease: boolean;
}) {
  return (
    <>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        flexShrink: 0, paddingTop: 3,
      }}>
        <StatusIcon size={14} strokeWidth={2.2} color={statusColor} />
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {entry.jiraKey && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--nf-accent)',
            fontFamily: 'monospace', letterSpacing: '0.3px',
            display: 'inline-block', marginBottom: 2,
          }}>
            {entry.jiraKey}
          </span>
        )}
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

        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="nf-page__badge" style={{ gap: 4, color: statusColor }}>
            <StatusIcon size={10} strokeWidth={2.2} />
            {sm.label}
          </span>

          {entry.priority && (
            <>
              <span style={{ color: 'var(--nf-border)', fontSize: 10 }}>·</span>
              <span className="nf-page__chip" style={{ color: 'var(--nf-text-secondary)' }}>
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
                <span key={tag} className="nf-page__chip" style={{ color: 'var(--nf-text-secondary)', opacity: 0.75 }}>
                  <Tag size={8} />
                  {tag}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
