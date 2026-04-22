import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Check, Clock, Inbox, CircleX, Tag, ChevronDown, Search, X, Layers } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { EPICS, STATUS_REPORT, type EntryStatus, type TimelineEntry, type EpicDefinition } from '../data/projectTimeline';

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

function epicStats(epic: EpicDefinition) {
  const tasks = epic.tasks.filter((t) => t.type === 'task');
  const done = tasks.filter((t) => t.status === 'done').length;
  const active = tasks.filter((t) => t.status === 'in-progress').length;
  const total = tasks.length;
  return { done, active, backlog: total - done - active - tasks.filter((t) => t.status === 'cancelled').length, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export default function ProjectTimelinePage() {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';
  const [selectedEpic, setSelectedEpic] = useState<string>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  const activeEpics = EPICS.filter((e) => e.status !== 'done');
  const closedEpics = EPICS.filter((e) => e.status === 'done');

  const visibleTasks = useMemo(() => {
    const source = selectedEpic === 'all'
      ? EPICS.flatMap((e) => e.tasks)
      : EPICS.find((e) => e.key === selectedEpic)?.tasks ?? [];
    const q = search.trim().toLowerCase();
    return source.filter((e) => {
      if (filter !== 'all' && e.status !== filter) return false;
      if (!q) return true;
      return e.title.toLowerCase().includes(q)
        || (e.description?.toLowerCase().includes(q) ?? false)
        || (e.jiraKey?.toLowerCase().includes(q) ?? false)
        || (e.tags?.some((t) => t.toLowerCase().includes(q)) ?? false);
    });
  }, [selectedEpic, filter, search]);

  const globalStats = useMemo(() => {
    const all = EPICS.flatMap((e) => e.tasks).filter((t) => t.type === 'task');
    const done = all.filter((t) => t.status === 'done').length;
    const active = all.filter((t) => t.status === 'in-progress').length;
    return { done, active, backlog: all.length - done - active, total: all.length, pct: all.length > 0 ? Math.round((done / all.length) * 100) : 0 };
  }, []);

  const doneColor = '#43A047';
  const activeColor = isLight ? '#1565C0' : '#42A5F5';
  const trackBg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';

  return (
    <div className="nf-page nf-page--flex-col" data-mode={mode}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '28px 48px 32px 72px' }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24, flexShrink: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', margin: 0, color: 'var(--nf-text)' }}>
            Project Timeline
          </h1>
          <p style={{ fontSize: 13, margin: '5px 0 0', lineHeight: 1.5, color: 'var(--nf-text-secondary)' }}>
            {EPICS.length} epics · {globalStats.total} tasks · {globalStats.pct}% complete
          </p>
        </div>

        {/* Epic grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8, marginBottom: 20, flexShrink: 0,
        }}>
          <EpicCard
            label="All Epics"
            active={selectedEpic === 'all'}
            onClick={() => setSelectedEpic('all')}
            isLight={isLight} palette={palette}
            status="in-progress"
            doneColor={doneColor} activeColor={activeColor} trackBg={trackBg}
            stats={globalStats}
          />
          {[...activeEpics, ...closedEpics].map((epic) => {
            const s = epicStats(epic);
            return (
              <EpicCard
                key={epic.key}
                label={epic.shortTitle}
                epicKey={epic.key}
                url={epic.url}
                description={epic.description}
                active={selectedEpic === epic.key}
                onClick={() => setSelectedEpic(epic.key)}
                isLight={isLight} palette={palette}
                status={epic.status}
                doneColor={doneColor} activeColor={activeColor} trackBg={trackBg}
                stats={s}
              />
            );
          })}
        </div>

        {/* Report */}
        {STATUS_REPORT.length > 0 && (
          <div style={{ marginBottom: 16, flexShrink: 0 }}>
            <button
              onClick={() => setReportOpen(!reportOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: '14px 18px', borderRadius: 12,
                border: '1px solid var(--nf-border)',
                background: 'var(--nf-bg-secondary)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--nf-border)'; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: isLight
                  ? `linear-gradient(135deg, #1F0230, ${palette.accent})`
                  : `linear-gradient(135deg, #0D0118, ${palette.accent}80)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {STATUS_REPORT[0].date.split('-')[2]}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nf-text)', lineHeight: 1.3 }}>
                  {STATUS_REPORT[0].title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--nf-text-secondary)', marginTop: 2 }}>
                  {STATUS_REPORT[0].date}
                </div>
              </div>
              <motion.div
                animate={{ rotate: reportOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <ChevronDown size={14} style={{ color: 'var(--nf-text-secondary)' }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {reportOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.25, delay: 0.1 } }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    marginTop: 6, borderRadius: 12, border: '1px solid var(--nf-border)',
                    background: 'var(--nf-bg-secondary)', overflow: 'hidden',
                  }}>
                    {STATUS_REPORT.map((entry, idx) => (
                      <motion.div
                        key={entry.date + idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.1 + idx * 0.06 }}
                        style={{ padding: '16px 20px', borderTop: idx > 0 ? '1px solid var(--nf-border)' : undefined }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: palette.accent, fontFamily: 'monospace' }}>{entry.date}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--nf-text)' }}>{entry.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--nf-text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-line', paddingLeft: 0 }}>
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

        {/* Filters + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexShrink: 0 }}>
          <div style={{
            display: 'flex', gap: 2, padding: 4, borderRadius: 12,
            background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            width: 'fit-content', flexShrink: 0, position: 'relative',
          }}>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    background: 'transparent',
                    color: active ? 'var(--nf-text)' : 'var(--nf-text-secondary)',
                    position: 'relative', zIndex: 1, transition: 'color 0.2s',
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="timeline-filter-pill"
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 9,
                        background: 'var(--nf-bg-secondary)',
                        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.3)',
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

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8,
            border: '1px solid var(--nf-border)', background: 'var(--nf-bg-secondary)',
            maxWidth: 200, width: '100%', transition: 'border-color 0.15s',
          }}
            onFocus={(e) => { e.currentTarget.style.borderColor = palette.accent; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--nf-border)'; }}
          >
            <Search size={12} style={{ color: 'var(--nf-text-secondary)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 11, color: 'var(--nf-text)', fontFamily: 'inherit' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)' }}>
                <X size={10} style={{ color: 'var(--nf-text-secondary)' }} />
              </button>
            )}
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--nf-text-secondary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {visibleTasks.length}
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--nf-border)', marginBottom: 4, flexShrink: 0 }} />

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 24 }}>
          <AnimatePresence mode="popLayout">
            {visibleTasks.map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.01, duration: 0.2 }}
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

/* ── Epic card ── */

function EpicCard({ label, epicKey, url, description, active, onClick, isLight, palette, status, doneColor, activeColor, trackBg, stats }: {
  label: string; epicKey?: string; url?: string; description?: string;
  active: boolean; onClick: () => void;
  isLight: boolean; palette: any; status: string;
  doneColor: string; activeColor: string; trackBg: string;
  stats: { done: number; active: number; backlog: number; total: number; pct: number };
}) {
  const isDone = status === 'done';
  const pct = stats.pct;

  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
        textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 0,
        background: active
          ? isLight ? `${palette.accent}0C` : `${palette.accent}14`
          : 'var(--nf-bg-secondary)',
        boxShadow: active
          ? `inset 0 0 0 1.5px ${palette.accent}`
          : `inset 0 0 0 1px ${isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.15s',
        opacity: isDone && !active ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${palette.accent}50`;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.boxShadow = `inset 0 0 0 1px ${isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'}`;
      }}
    >
      {/* Top row: key + title + done badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        {epicKey ? (
          <span style={{
            fontSize: 9, fontWeight: 700, color: palette.accent,
            fontFamily: 'monospace', padding: '1px 5px', borderRadius: 4,
            background: isLight ? `${palette.accent}10` : `${palette.accent}20`,
          }}>
            {epicKey.replace('DND-', '')}
          </span>
        ) : (
          <Layers size={11} style={{ color: palette.accent, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--nf-text)', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
          {label}
        </span>
        {isDone && <Check size={12} style={{ color: doneColor, flexShrink: 0 }} />}
        {url && (
          <a
            href={url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--nf-text-secondary)', opacity: 0.4, flexShrink: 0, display: 'flex' }}
          >
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Description */}
      {description && (
        <div style={{
          fontSize: 11, color: 'var(--nf-text-secondary)', lineHeight: 1.35,
          marginBottom: 10, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        }}>
          {description}
        </div>
      )}
      {!description && <div style={{ marginBottom: 10 }} />}

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 2, background: trackBg, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
        {stats.total > 0 && (
          <>
            <div style={{ width: `${(stats.done / stats.total) * 100}%`, height: '100%', background: doneColor, flexShrink: 0, transition: 'width 0.4s ease' }} />
            <div style={{ width: `${(stats.active / stats.total) * 100}%`, height: '100%', background: activeColor, flexShrink: 0, transition: 'width 0.4s ease' }} />
          </>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 10, color: 'var(--nf-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 1.5, background: doneColor, flexShrink: 0 }} />
          <strong style={{ color: doneColor, fontWeight: 700 }}>{stats.done}</strong>
        </span>
        {stats.active > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: 1.5, background: activeColor, flexShrink: 0 }} />
            <strong style={{ color: activeColor, fontWeight: 700 }}>{stats.active}</strong>
          </span>
        )}
        {stats.backlog > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: 1.5, background: trackBg, flexShrink: 0 }} />
            {stats.backlog}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 11, color: pct === 100 ? doneColor : 'var(--nf-text)' }}>
          {pct}%
        </span>
      </div>
    </button>
  );
}

/* ── Row ── */

function Row({ entry, isLight }: { entry: TimelineEntry; isLight: boolean }) {
  const sm = STATUS_META[entry.status];
  const statusColor = isLight ? sm.color : sm.darkColor;
  const isRelease = entry.type === 'release';
  const StatusIcon = entry.status === 'done' ? Check : entry.status === 'in-progress' ? Clock : entry.status === 'cancelled' ? CircleX : Inbox;

  const rowStyle: React.CSSProperties = {
    display: 'flex', gap: 14, padding: '12px 14px',
    borderBottom: '1px solid var(--nf-border)',
    alignItems: 'flex-start', borderRadius: 8, marginBottom: 3,
    background: 'var(--nf-bg-secondary)',
    transition: 'background 0.12s ease',
    textDecoration: 'none', color: 'inherit',
    cursor: entry.jiraUrl ? 'pointer' : 'default',
  };
  const hoverIn = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.06)'; };
  const hoverOut = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = 'var(--nf-bg-secondary)'; };

  const content = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
        <StatusIcon size={14} strokeWidth={2.2} color={statusColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {entry.jiraKey && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--nf-accent)', fontFamily: 'monospace', letterSpacing: '0.3px', display: 'inline-block', marginBottom: 2 }}>
            {entry.jiraKey}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: isRelease ? 700 : 600, color: 'var(--nf-text)', lineHeight: 1.4, letterSpacing: '-0.1px', wordBreak: 'break-word' }}>
            {entry.title}
          </span>
          {entry.date && (
            <span style={{ fontSize: 10, color: 'var(--nf-text-secondary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2 }}>
              {entry.date}
            </span>
          )}
        </div>
        {entry.description && (
          <p style={{ fontSize: 12, color: 'var(--nf-text-secondary)', margin: '3px 0 0', lineHeight: 1.5 }}>{entry.description}</p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="nf-page__badge" style={{ gap: 4, color: statusColor }}>
            <StatusIcon size={10} strokeWidth={2.2} />
            {sm.label}
          </span>
          {entry.priority && (
            <>
              <span style={{ color: 'var(--nf-border)', fontSize: 10 }}>·</span>
              <span className="nf-page__chip" style={{ color: 'var(--nf-text-secondary)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: PRIORITY_COLORS[entry.priority] ?? 'var(--nf-text-secondary)' }} />
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

  if (!entry.jiraUrl) return <div style={rowStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{content}</div>;
  return <a href={entry.jiraUrl} target="_blank" rel="noopener noreferrer" style={rowStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{content}</a>;
}
