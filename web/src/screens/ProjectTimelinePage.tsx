import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Check, Clock, Inbox, XCircle, Tag, Rocket } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { EPIC, TIMELINE, type EntryStatus, type TimelineEntry } from '../data/projectTimeline';

type Filter = 'all' | EntryStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'done', label: 'Done' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<EntryStatus, { label: string; color: string; bg: string; darkColor: string; darkBg: string }> = {
  done: { label: 'Done', color: '#2E7D32', bg: '#E8F5E9', darkColor: '#81C784', darkBg: 'rgba(76,175,80,0.15)' },
  'in-progress': { label: 'In Progress', color: '#E65100', bg: '#FFF3E0', darkColor: '#FFB74D', darkBg: 'rgba(255,152,0,0.15)' },
  backlog: { label: 'Backlog', color: '#546E7A', bg: '#ECEFF1', darkColor: '#90A4AE', darkBg: 'rgba(144,164,174,0.15)' },
  cancelled: { label: 'Cancelled', color: '#C62828', bg: '#FFEBEE', darkColor: '#EF9A9A', darkBg: 'rgba(239,83,80,0.12)' },
};

const PRIORITY_DOTS: Record<string, string> = {
  high: '#E53935',
  medium: '#FB8C00',
  low: '#43A047',
};

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
      cancelled: tasks.filter((e) => e.status === 'cancelled').length,
    };
  }, []);

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === 'all') return TIMELINE;
    return TIMELINE.filter((e) => e.status === filter);
  }, [filter]);

  const pageBg = isLight ? '#FAFAFA' : '#0A0A0A';

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: pageBg, transition: 'background 0.3s',
      display: 'flex', flexDirection: 'column',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 48px 32px 72px', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <h1 style={{
            fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0,
            color: palette.textPrimary, transition: 'color 0.3s',
          }}>
            Project Timeline
          </h1>
          <p style={{
            fontSize: 12, margin: '4px 0 0', lineHeight: 1.4,
            color: isLight ? 'rgba(31,2,48,0.5)' : 'rgba(255,255,255,0.45)',
          }}>
            Development progress and changelog for the Negotiation Flow Platform.
          </p>
        </div>

        {/* Epic card + progress */}
        <div style={{
          display: 'flex', gap: 16, marginBottom: 20, flexShrink: 0, flexWrap: 'wrap',
        }}>
          {/* Epic link */}
          <a
            href={EPIC.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: '1 1 300px', padding: '14px 18px', borderRadius: 12,
              border: `1px solid ${palette.border}`,
              background: isLight ? '#fff' : palette.surfaceSecondary,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: palette.accentSubtle,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Rocket size={16} style={{ color: palette.accent }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: palette.textPrimary }}>{EPIC.key}</div>
              <div style={{ fontSize: 11, color: palette.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {EPIC.title}
              </div>
            </div>
            <ExternalLink size={13} style={{ color: palette.textSecondary, flexShrink: 0 }} />
          </a>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatPill icon={<Check size={12} />} label={`${stats.done} done`} color="#2E7D32" isLight={isLight} />
            <StatPill icon={<Clock size={12} />} label={`${stats.inProgress} active`} color="#E65100" isLight={isLight} />
            <StatPill icon={<Inbox size={12} />} label={`${stats.backlog} backlog`} color="#546E7A" isLight={isLight} />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: palette.textSecondary }}>
              Progress
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: palette.accent, fontVariantNumeric: 'tabular-nums' }}>
              {progress}%
            </span>
          </div>
          <div style={{
            height: 6, borderRadius: 3, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              style={{ height: '100%', borderRadius: 3, background: palette.accent }}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexShrink: 0 }}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  background: active ? palette.accentSubtle : 'transparent',
                  color: active ? palette.accent : palette.textSecondary,
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            );
          })}
          <span style={{
            fontSize: 11, fontWeight: 600, color: palette.textSecondary,
            padding: '6px 10px', marginLeft: 'auto',
          }}>
            {filtered.length} items
          </span>
        </div>

        {/* Timeline list */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02, duration: 0.25 }}
              >
                <TimelineRow entry={entry} palette={palette} isLight={isLight} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

type Palette = ReturnType<typeof useTheme>['palette'];

function StatPill({ icon, label, color, isLight }: { icon: React.ReactNode; label: string; color: string; isLight: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 8,
      background: isLight ? `${color}10` : `${color}18`,
      color: isLight ? color : `${color}CC`,
      fontSize: 11, fontWeight: 600,
    }}>
      {icon}
      {label}
    </div>
  );
}

function TimelineRow({ entry, palette, isLight }: { entry: TimelineEntry; palette: Palette; isLight: boolean }) {
  const sc = STATUS_CONFIG[entry.status];
  const statusColor = isLight ? sc.color : sc.darkColor;
  const statusBg = isLight ? sc.bg : sc.darkBg;
  const isRelease = entry.type === 'release';

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 0',
      borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
      alignItems: 'flex-start',
    }}>
      {/* Left: status dot / release icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: isRelease ? palette.accentSubtle : statusBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
      }}>
        {isRelease ? (
          <Rocket size={13} style={{ color: palette.accent }} />
        ) : entry.status === 'done' ? (
          <Check size={13} style={{ color: statusColor }} />
        ) : entry.status === 'in-progress' ? (
          <Clock size={13} style={{ color: statusColor }} />
        ) : entry.status === 'cancelled' ? (
          <XCircle size={13} style={{ color: statusColor }} />
        ) : (
          <Inbox size={13} style={{ color: statusColor }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {entry.jiraKey && (
            <span style={{ fontSize: 10, fontWeight: 700, color: palette.accent, fontFamily: 'monospace' }}>
              {entry.jiraKey}
            </span>
          )}
          <span style={{
            fontSize: 13, fontWeight: isRelease ? 700 : 600,
            color: palette.textPrimary, lineHeight: 1.3,
          }}>
            {entry.title}
          </span>
        </div>
        {entry.description && (
          <p style={{
            fontSize: 11, color: palette.textSecondary, margin: '4px 0 0', lineHeight: 1.4,
            maxWidth: 600,
          }}>
            {entry.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
            padding: '2px 7px', borderRadius: 4, background: statusBg, color: statusColor,
          }}>
            {sc.label}
          </span>
          {entry.priority && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
              padding: '2px 6px', borderRadius: 4,
              background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
              color: palette.textSecondary,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: 2.5, background: PRIORITY_DOTS[entry.priority] ?? palette.textSecondary }} />
              {entry.priority}
            </span>
          )}
          {entry.tags?.map((tag) => (
            <span key={tag} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
              color: palette.textSecondary,
            }}>
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {entry.date && (
            <span style={{ fontSize: 10, color: palette.textSecondary, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
              {entry.date}
            </span>
          )}
        </div>
      </div>

      {/* Jira link */}
      {entry.jiraUrl && (
        <a
          href={entry.jiraUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
            border: `1px solid ${palette.border}`,
            background: isLight ? '#fff' : palette.surfaceSecondary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', transition: 'border-color 0.15s',
          }}
        >
          <ExternalLink size={11} style={{ color: palette.textSecondary }} />
        </a>
      )}
    </div>
  );
}
