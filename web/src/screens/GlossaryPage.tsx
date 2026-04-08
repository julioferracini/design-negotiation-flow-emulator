import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, Upload, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { GLOSSARY_DATA, type GlossaryEntry } from '../data/glossary';

type SortKey = 'acronym' | 'definition' | 'explanation';
type SortDir = 'asc' | 'desc' | null;

const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  { key: 'acronym', label: 'Acronym', width: '120px' },
  { key: 'definition', label: 'Definition', width: '280px' },
  { key: 'explanation', label: 'Explanation', width: '1fr' },
];

export default function GlossaryPage() {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  const [entries, setEntries] = useState<GlossaryEntry[]>(GLOSSARY_DATA);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = entries;
    if (q) {
      result = entries.filter(
        (e) =>
          e.acronym.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q) ||
          e.explanation.toLowerCase().includes(q),
      );
    }
    if (sortKey && sortDir) {
      const dir = sortDir === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => a[sortKey].localeCompare(b[sortKey]) * dir);
    }
    return result;
  }, [entries, query, sortKey, sortDir]);

  const handleAddTerm = (entry: GlossaryEntry) => {
    setEntries((prev) => [...prev, entry]);
    setAddOpen(false);
  };

  const handleImport = (imported: GlossaryEntry[]) => {
    setEntries((prev) => [...prev, ...imported]);
    setImportOpen(false);
  };

  const pageBg = isLight ? '#FAFAFA' : '#0A0A0A';
  const cardBg = isLight ? '#FFFFFF' : '#161616';
  const headerBg = isLight ? '#F5F3F7' : '#1C1C1C';
  const rowHoverBg = isLight ? '#F9F8FA' : '#1A1A1A';
  const borderColor = isLight ? '#F0EEF1' : '#2A2A2A';

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: pageBg, transition: 'background 0.3s ease',
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
            fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: 0,
            color: palette.textPrimary, transition: 'color 0.3s ease',
          }}>
            Glossary
          </h1>
          <p style={{
            fontSize: 13, color: palette.textSecondary, margin: '4px 0 0',
            transition: 'color 0.3s ease',
          }}>
            Business terms, acronyms, and domain definitions used across the platform.
          </p>
        </div>

        {/* Search + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
          <div style={{
            flex: 1, maxWidth: 420, position: 'relative', display: 'flex', alignItems: 'center',
          }}>
            <Search size={16} style={{ position: 'absolute', left: 12, color: palette.textSecondary, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search acronyms, definitions, or explanations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                border: `1px solid ${borderColor}`, background: cardBg,
                color: palette.textPrimary, fontSize: 13, outline: 'none',
                transition: 'border-color 0.2s ease, background 0.3s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = palette.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = borderColor; }}
            />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600, color: palette.textSecondary,
            background: headerBg, padding: '6px 14px', borderRadius: 9999,
            transition: 'all 0.3s ease', whiteSpace: 'nowrap',
          }}>
            {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <ActionButton icon={Upload} label="Import CSV" onClick={() => setImportOpen(true)} palette={palette} isLight={isLight} secondary />
            <ActionButton icon={Plus} label="Add Term" onClick={() => setAddOpen(true)} palette={palette} isLight={isLight} />
          </div>
        </div>

        {/* Table */}
        <div style={{
          flex: 1, overflow: 'auto', borderRadius: 12,
          border: `1px solid ${borderColor}`, background: cardBg,
          transition: 'all 0.3s ease',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 11,
                      fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase',
                      color: palette.textSecondary, background: headerBg,
                      borderBottom: `1px solid ${borderColor}`, cursor: 'pointer',
                      userSelect: 'none', position: 'sticky', top: 0, zIndex: 1,
                      transition: 'all 0.3s ease', whiteSpace: 'nowrap',
                      width: col.width === '1fr' ? undefined : col.width,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      <SortIcon active={sortKey === col.key} dir={sortKey === col.key ? sortDir : null} color={palette.textSecondary} accent={palette.accent} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{
                    padding: '48px 16px', textAlign: 'center',
                    color: palette.textSecondary, fontSize: 13,
                  }}>
                    No terms found matching "{query}"
                  </td>
                </tr>
              ) : (
                filtered.map((entry, i) => (
                  <tr
                    key={`${entry.acronym}-${i}`}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = rowHoverBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    style={{ transition: 'background 0.15s ease' }}
                  >
                    <td style={{
                      padding: '12px 16px', fontSize: 13, fontWeight: 600,
                      color: palette.accent, borderBottom: `1px solid ${borderColor}`,
                      whiteSpace: 'nowrap', verticalAlign: 'top',
                    }}>
                      {entry.acronym}
                    </td>
                    <td style={{
                      padding: '12px 16px', fontSize: 13, fontWeight: 500,
                      color: palette.textPrimary, borderBottom: `1px solid ${borderColor}`,
                      verticalAlign: 'top',
                    }}>
                      {entry.definition}
                    </td>
                    <td style={{
                      padding: '12px 16px', fontSize: 13, lineHeight: 1.5,
                      color: palette.textSecondary, borderBottom: `1px solid ${borderColor}`,
                      verticalAlign: 'top',
                    }}>
                      {entry.explanation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {addOpen && <AddTermModal onAdd={handleAddTerm} onClose={() => setAddOpen(false)} palette={palette} isLight={isLight} />}
        {importOpen && <ImportCSVModal onImport={handleImport} onClose={() => setImportOpen(false)} palette={palette} isLight={isLight} />}
      </AnimatePresence>
    </div>
  );
}

/* ───────── Sub-components ───────── */

function SortIcon({ active, dir, color, accent }: { active: boolean; dir: SortDir; color: string; accent: string }) {
  if (!active || !dir) return <ArrowUpDown size={12} style={{ color, opacity: 0.4 }} />;
  const Icon = dir === 'asc' ? ArrowUp : ArrowDown;
  return <Icon size={12} style={{ color: accent }} />;
}

function ActionButton({
  icon: Icon, label, onClick, palette, isLight, secondary,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
  secondary?: boolean;
}) {
  const bg = secondary
    ? (isLight ? '#F0EEF1' : '#222')
    : palette.accent;
  const fg = secondary ? palette.textPrimary : '#FFFFFF';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 10, border: 'none',
        background: bg, color: fg, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

/* ───────── Add Term Modal ───────── */

function AddTermModal({
  onAdd, onClose, palette, isLight,
}: {
  onAdd: (entry: GlossaryEntry) => void;
  onClose: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}) {
  const [acronym, setAcronym] = useState('');
  const [definition, setDefinition] = useState('');
  const [explanation, setExplanation] = useState('');

  const canSubmit = acronym.trim() && definition.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({ acronym: acronym.trim(), definition: definition.trim(), explanation: explanation.trim() });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${isLight ? '#E3E0E5' : '#333'}`,
    background: isLight ? '#FAFAFA' : '#1C1C1C',
    color: palette.textPrimary, fontSize: 13, outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  return (
    <ModalShell onClose={onClose} title="Add Term" palette={palette} isLight={isLight}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldGroup label="Acronym" required>
          <input style={inputStyle} value={acronym} onChange={(e) => setAcronym(e.target.value)} placeholder="e.g. KPI" />
        </FieldGroup>
        <FieldGroup label="Definition" required>
          <input style={inputStyle} value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Key Performance Indicator" />
        </FieldGroup>
        <FieldGroup label="Explanation">
          <textarea
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="A measurable value that demonstrates how effectively..."
          />
        </FieldGroup>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 4, padding: '10px 0', borderRadius: 10, border: 'none',
            background: canSubmit ? palette.accent : (isLight ? '#E3E0E5' : '#333'),
            color: canSubmit ? '#FFF' : palette.textSecondary,
            fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
        >
          Add to Glossary
        </button>
      </div>
    </ModalShell>
  );
}

/* ───────── Import CSV Modal ───────── */

function ImportCSVModal({
  onImport, onClose, palette, isLight,
}: {
  onImport: (entries: GlossaryEntry[]) => void;
  onClose: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<GlossaryEntry[]>([]);
  const [error, setError] = useState('');

  const parseCSV = useCallback((text: string): GlossaryEntry[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

    const header = lines[0].toLowerCase();
    const hasAcronym = header.includes('acronym') || header.includes('sigla');
    if (!hasAcronym) throw new Error('CSV must contain an "Acronym" column.');

    return lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      return {
        acronym: cols[0] ?? '',
        definition: cols[1] ?? '',
        explanation: cols[2] ?? '',
      };
    }).filter((e) => e.acronym);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        setPreview(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV.');
      }
    };
    reader.readAsText(file);
  };

  const dropBg = isLight ? '#F8F6F8' : '#1C1C1C';
  const dropBorder = isLight ? '#E3E0E5' : '#333';

  return (
    <ModalShell onClose={onClose} title="Import CSV" palette={palette} isLight={isLight}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12, color: palette.textSecondary, margin: 0, lineHeight: 1.5 }}>
          Upload a CSV file with columns: <strong>Acronym, Definition, Explanation</strong>
        </p>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            padding: '28px 16px', borderRadius: 10,
            border: `2px dashed ${dropBorder}`, background: dropBg,
            textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={20} style={{ color: palette.textSecondary, marginBottom: 6 }} />
          <p style={{ fontSize: 13, color: palette.textSecondary, margin: 0 }}>
            Click to select a <strong>.csv</strong> file
          </p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#D01D1C', margin: 0 }}>{error}</p>
        )}

        {preview.length > 0 && (
          <>
            <p style={{ fontSize: 12, color: palette.textSecondary, margin: 0 }}>
              Preview: <strong>{preview.length}</strong> terms ready to import
            </p>
            <div style={{
              maxHeight: 160, overflow: 'auto', borderRadius: 8,
              border: `1px solid ${dropBorder}`, fontSize: 12,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {preview.slice(0, 8).map((e, i) => (
                    <tr key={i}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: palette.accent, borderBottom: `1px solid ${dropBorder}`, whiteSpace: 'nowrap' }}>
                        {e.acronym}
                      </td>
                      <td style={{ padding: '6px 10px', color: palette.textPrimary, borderBottom: `1px solid ${dropBorder}` }}>
                        {e.definition}
                      </td>
                    </tr>
                  ))}
                  {preview.length > 8 && (
                    <tr>
                      <td colSpan={2} style={{ padding: '6px 10px', color: palette.textSecondary, textAlign: 'center' }}>
                        ...and {preview.length - 8} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => onImport(preview)}
              style={{
                padding: '10px 0', borderRadius: 10, border: 'none',
                background: palette.accent, color: '#FFF',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Import {preview.length} Terms
            </button>
          </>
        )}
      </div>
    </ModalShell>
  );
}

/* ───────── Shared ───────── */

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
        {label}{required && <span style={{ color: '#D01D1C' }}> *</span>}
      </span>
      {children}
    </label>
  );
}

function ModalShell({
  onClose, title, palette, isLight, children,
}: {
  onClose: () => void;
  title: string;
  palette: ReturnType<typeof useTheme>['palette'];
  isLight: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, maxHeight: '80vh', overflow: 'auto',
          background: isLight ? '#FFF' : '#1A1A1A',
          borderRadius: 16, padding: '24px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: palette.textPrimary, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: isLight ? '#F0EEF1' : '#2A2A2A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: palette.textSecondary,
            }}
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
