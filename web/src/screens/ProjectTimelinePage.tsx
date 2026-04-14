import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Check, Clock, Inbox, XCircle, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { EPIC, TIMELINE, type EntryStatus, type TimelineEntry } from '../data/projectTimeline';

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
  'in-progress': { label: 'Active', color: '#D84315', darkColor: '#FFB74D' },
  backlog: { label: 'Backlog', color: '#78909C', darkColor: '#90A4AE' },
  cancelled: { label: 'Cancelled', color: '#C62828', darkColor: '#EF9A9A' },
};

const PRIORITY_COLORS: Record<string, string> = { high: '#E53935', medium: '#FB8C00', low: '#43A047' };

export default function ProjectTimelinePage() {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const [filter, setFilter] = useState<Filter>('all');

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

  const borderCol = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)';
  const subtleBg = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.035)';
  const surfaceBg = isLight ? '#FFFFFF' : '#141416';

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: isLight ? '#FAFAFA' : '#0A0A0A',
      transition: 'background 0.3s',
      display: 'flex', flexDirection: 'column',
    }}>
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
              color: palette.textPrimary,
            }}>
              Project Timeline
            </h1>
            <p style={{ fontSize: 13, margin: '5px 0 0', lineHeight: 1.5, color: palette.textSecondary }}>
              Development progress for the Negotiation Flow Platform.
            </p>
          </div>

          {/* Epic link — compact, right-aligned */}
          <a
            href={EPIC.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 9999,
              border: `1px solid ${borderCol}`, background: surfaceBg,
              textDecoration: 'none', fontSize: 11, fontWeight: 600,
              color: palette.textSecondary,
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${palette.accent}50`; e.currentTarget.style.color = palette.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderCol; e.currentTarget.style.color = palette.textSecondary; }}
          >
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: palette.accent }}>{EPIC.key}</span>
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
            <div style={{ height: 3, borderRadius: 2, background: subtleBg, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                style={{ height: '100%', borderRadius: 2, background: palette.accent }}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: palette.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
              <span><strong style={{ color: palette.textPrimary, fontWeight: 700 }}>{progress}%</strong> complete</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span><strong style={{ color: '#43A047', fontWeight: 600 }}>{stats.done}</strong> done</span>
              <span><strong style={{ color: '#FB8C00', fontWeight: 600 }}>{stats.inProgress}</strong> active</span>
              <span><strong style={{ color: '#78909C', fontWeight: 600 }}>{stats.backlog}</strong> backlog</span>
            </div>
          </div>
        </div>

        {/* ── Filters + count ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: 2, padding: 3, borderRadius: 10,
            background: subtleBg, width: 'fit-content',
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
                    background: active ? surfaceBg : 'transparent',
                    color: active ? palette.textPrimary : palette.textSecondary,
                    boxShadow: active ? (isLight ? '0 1px 3px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.3)') : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: palette.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
            {filtered.length} items
          </span>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: borderCol, marginBottom: 4, flexShrink: 0 }} />

        {/* ── Timeline list ── */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                <Row entry={entry} palette={palette} isLight={isLight} borderCol={borderCol} surfaceBg={surfaceBg} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

type Palette = ReturnType<typeof useTheme>['palette'];

function Row({ entry, palette, isLight, borderCol, surfaceBg }: {
  entry: TimelineEntry; palette: Palette; isLight: boolean; borderCol: string; surfaceBg: string;
}) {
  const sm = STATUS_META[entry.status];
  const statusColor = isLight ? sm.color : sm.darkColor;
  const isRelease = entry.type === 'release';

  const StatusIcon = entry.status === 'done' ? Check
    : entry.status === 'in-progress' ? Clock
    : entry.status === 'cancelled' ? XCircle
    : Inbox;

  return (
    <div
      style={{
        display: 'flex', gap: 14, padding: '14px 12px',
        borderBottom: `1px solid ${borderCol}`,
        alignItems: 'flex-start',
        borderRadius: 8, margin: '0 -12px',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.018)' : 'rgba(255,255,255,0.02)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Timeline dot + vertical thread */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0, flexShrink: 0, paddingTop: 4,
      }}>
        <div style={{
          width: isRelease ? 10 : 7, height: isRelease ? 10 : 7,
          borderRadius: '50%',
          background: isRelease ? palette.accent : statusColor,
          border: isRelease ? `2px solid ${isLight ? '#FAFAFA' : '#0A0A0A'}` : 'none',
          boxShadow: isRelease ? `0 0 0 3px ${palette.accent}30` : 'none',
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          {entry.jiraKey && (
            <a
              href={entry.jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 10, fontWeight: 700, color: palette.accent,
                fontFamily: 'monospace', letterSpacing: '0.3px',
                textDecoration: 'none',
              }}
            >
              {entry.jiraKey}
            </a>
          )}
          <span style={{
            fontSize: 13, fontWeight: isRelease ? 700 : 600,
            color: palette.textPrimary, lineHeight: 1.35,
            letterSpacing: '-0.1px',
          }}>
            {entry.title}
          </span>
          {entry.date && (
            <span style={{
              fontSize: 10, color: palette.textSecondary,
              marginLeft: 'auto', fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {entry.date}
            </span>
          )}
        </div>

        {entry.description && (
          <p style={{
            fontSize: 12, color: palette.textSecondary,
            margin: '4px 0 0', lineHeight: 1.5,
          }}>
            {entry.description}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 600, color: statusColor,
          }}>
            <StatusIcon size={10} strokeWidth={2.2} />
            {sm.label}
          </span>

          {entry.priority && (
            <>
              <span style={{ color: borderCol, fontSize: 10 }}>·</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 500, color: palette.textSecondary,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: PRIORITY_COLORS[entry.priority] ?? palette.textSecondary,
                }} />
                {entry.priority}
              </span>
            </>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <>
              <span style={{ color: borderCol, fontSize: 10 }}>·</span>
              {entry.tags.map((tag) => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, color: palette.textSecondary, opacity: 0.75,
                }}>
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
