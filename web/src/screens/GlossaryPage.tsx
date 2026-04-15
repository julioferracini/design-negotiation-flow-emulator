import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, Upload, X, Check, Trash2 } from 'lucide-react';
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

  const [entries, setEntries] = useState<GlossaryEntry[]>(GLOSSARY_DATA);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

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
    showToast(`"${entry.acronym}" added to glossary`);
  };

  const handleImport = (imported: GlossaryEntry[]) => {
    setEntries((prev) => [...prev, ...imported]);
    setImportOpen(false);
    showToast(`${imported.length} terms imported`);
  };

  const handleEditSave = (updated: GlossaryEntry) => {
    if (editIndex === null) return;
    setEntries((prev) => prev.map((e, i) => (i === editIndex ? updated : e)));
    setEditIndex(null);
    showToast(`"${updated.acronym}" updated`);
  };

  const handleRemove = () => {
    if (editIndex === null) return;
    const removed = entries[editIndex];
    setEntries((prev) => prev.filter((_, i) => i !== editIndex));
    setEditIndex(null);
    showToast(`"${removed.acronym}" removed`);
  };

  return (
    <div className="nf-page nf-page--flex-col" data-mode={mode}>
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
            color: palette.textPrimary, transition: 'color 0.3s ease',
          }}>
            Glossary
          </h1>
          <p style={{
            fontSize: 12, margin: '4px 0 0', lineHeight: 1.4,
            color: 'var(--nf-text-tertiary)',
            transition: 'color 0.3s ease',
          }}>
            Business terms, acronyms, and domain definitions used across the platform.
          </p>
        </div>

        {/* Search + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
          <div className="nf-page__search">
            <Search size={16} className="nf-page__search-icon" />
            <input
              type="text"
              className="nf-page__search-input"
              placeholder="Search acronyms, definitions, or explanations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600, color: palette.textSecondary,
            background: 'var(--nf-bg)', padding: '6px 14px', borderRadius: 9999,
            transition: 'all 0.3s ease', whiteSpace: 'nowrap',
          }}>
            {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              className="nf-page__action-btn nf-page__action-btn--secondary"
              onClick={() => setImportOpen(true)}
            >
              <Upload size={15} />
              Import CSV
            </button>
            <button
              className="nf-page__action-btn nf-page__action-btn--primary"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={15} />
              Add Term
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="nf-page__table-wrap">
          <table className="nf-page__table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ width: col.width === '1fr' ? undefined : col.width }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      <SortIcon active={sortKey === col.key} dir={sortKey === col.key ? sortDir : null} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--nf-text-secondary)', fontSize: 13 }}>
                    No terms found matching "{query}"
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const originalIndex = entries.indexOf(entry);
                  return (
                  <tr
                    key={`${entry.acronym}-${originalIndex}`}
                    onClick={() => setEditIndex(originalIndex)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: palette.accent, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {entry.acronym}
                    </td>
                    <td style={{ fontWeight: 500, color: palette.textPrimary }}>
                      {entry.definition}
                    </td>
                    <td style={{ color: palette.textSecondary, lineHeight: 1.5 }}>
                      {entry.explanation}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {addOpen && <AddTermModal onAdd={handleAddTerm} onClose={() => setAddOpen(false)} palette={palette} />}
        {importOpen && <ImportCSVModal onImport={handleImport} onClose={() => setImportOpen(false)} palette={palette} />}
        {editIndex !== null && (
          <EditTermModal
            entry={entries[editIndex]}
            onSave={handleEditSave}
            onRemove={handleRemove}
            onClose={() => setEditIndex(null)}
            palette={palette}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} palette={palette} />}
      </AnimatePresence>
    </div>
  );
}

/* ───────── Sub-components ───────── */

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active || !dir) return <ArrowUpDown size={12} style={{ color: 'var(--nf-text-secondary)', opacity: 0.4 }} />;
  const Icon = dir === 'asc' ? ArrowUp : ArrowDown;
  return <Icon size={12} style={{ color: 'var(--nf-accent)' }} />;
}

/* ───────── Add Term Modal ───────── */

function AddTermModal({
  onAdd, onClose, palette,
}: {
  onAdd: (entry: GlossaryEntry) => void;
  onClose: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const [acronym, setAcronym] = useState('');
  const [definition, setDefinition] = useState('');
  const [explanation, setExplanation] = useState('');

  const canSubmit = acronym.trim() && definition.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({ acronym: acronym.trim(), definition: definition.trim(), explanation: explanation.trim() });
  };

  return (
    <ModalShell onClose={onClose} title="Add Term">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldGroup label="Acronym" required>
          <input className="nf-page__input" value={acronym} onChange={(e) => setAcronym(e.target.value)} placeholder="e.g. KPI" />
        </FieldGroup>
        <FieldGroup label="Definition" required>
          <input className="nf-page__input" value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Key Performance Indicator" />
        </FieldGroup>
        <FieldGroup label="Explanation">
          <textarea
            className="nf-page__input"
            rows={3}
            style={{ resize: 'vertical' }}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="A measurable value that demonstrates how effectively..."
          />
        </FieldGroup>
        <button
          className="nf-page__action-btn nf-page__action-btn--primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 4, padding: '10px 0', width: '100%', justifyContent: 'center',
            opacity: canSubmit ? 1 : 0.5,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          Add to Glossary
        </button>
      </div>
    </ModalShell>
  );
}

/* ───────── Edit Term Modal ───────── */

function EditTermModal({
  entry, onSave, onRemove, onClose, palette,
}: {
  entry: GlossaryEntry;
  onSave: (updated: GlossaryEntry) => void;
  onRemove: () => void;
  onClose: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const [acronym, setAcronym] = useState(entry.acronym);
  const [definition, setDefinition] = useState(entry.definition);
  const [explanation, setExplanation] = useState(entry.explanation);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const canSubmit = acronym.trim() && definition.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ acronym: acronym.trim(), definition: definition.trim(), explanation: explanation.trim() });
  };

  return (
    <ModalShell onClose={onClose} title="Edit Term">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldGroup label="Acronym" required>
          <input className="nf-page__input" value={acronym} onChange={(e) => setAcronym(e.target.value)} />
        </FieldGroup>
        <FieldGroup label="Definition" required>
          <input className="nf-page__input" value={definition} onChange={(e) => setDefinition(e.target.value)} />
        </FieldGroup>
        <FieldGroup label="Explanation">
          <textarea
            className="nf-page__input"
            rows={3}
            style={{ resize: 'vertical' }}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </FieldGroup>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            className="nf-page__action-btn nf-page__action-btn--primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              flex: 1, padding: '10px 0', justifyContent: 'center',
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            Save Changes
          </button>
          <button
            onClick={() => {
              if (confirmRemove) { onRemove(); } else { setConfirmRemove(true); setTimeout(() => setConfirmRemove(false), 3000); }
            }}
            style={{
              padding: '10px 16px', borderRadius: 10,
              border: confirmRemove ? 'none' : '1px solid var(--nf-border-strong)',
              background: confirmRemove ? 'var(--nf-negative)' : 'transparent',
              color: confirmRemove ? '#FFF' : 'var(--nf-negative)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <Trash2 size={14} />
            {confirmRemove ? 'Confirm?' : 'Remove'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ───────── Import CSV Modal ───────── */

function ImportCSVModal({
  onImport, onClose, palette,
}: {
  onImport: (entries: GlossaryEntry[]) => void;
  onClose: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
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

  return (
    <ModalShell onClose={onClose} title="Import CSV">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--nf-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Upload a CSV file with columns: <strong>Acronym, Definition, Explanation</strong>
        </p>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            padding: '28px 16px', borderRadius: 10,
            border: '2px dashed var(--nf-border-strong)', background: 'var(--nf-bg)',
            textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={20} style={{ color: 'var(--nf-text-secondary)', marginBottom: 6 }} />
          <p style={{ fontSize: 13, color: 'var(--nf-text-secondary)', margin: 0 }}>
            Click to select a <strong>.csv</strong> file
          </p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--nf-negative)', margin: 0 }}>{error}</p>
        )}

        {preview.length > 0 && (
          <>
            <p style={{ fontSize: 12, color: 'var(--nf-text-secondary)', margin: 0 }}>
              Preview: <strong>{preview.length}</strong> terms ready to import
            </p>
            <div style={{
              maxHeight: 160, overflow: 'auto', borderRadius: 8,
              border: '1px solid var(--nf-border-strong)', fontSize: 12,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {preview.slice(0, 8).map((e, i) => (
                    <tr key={i}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: palette.accent, borderBottom: '1px solid var(--nf-border-strong)', whiteSpace: 'nowrap' }}>
                        {e.acronym}
                      </td>
                      <td style={{ padding: '6px 10px', color: palette.textPrimary, borderBottom: '1px solid var(--nf-border-strong)' }}>
                        {e.definition}
                      </td>
                    </tr>
                  ))}
                  {preview.length > 8 && (
                    <tr>
                      <td colSpan={2} style={{ padding: '6px 10px', color: 'var(--nf-text-secondary)', textAlign: 'center' }}>
                        ...and {preview.length - 8} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              className="nf-page__action-btn nf-page__action-btn--primary"
              onClick={() => onImport(preview)}
              style={{ padding: '10px 0', width: '100%', justifyContent: 'center' }}
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
      <span className="nf-page__field-label">
        {label}{required && <span className="nf-page__field-required"> *</span>}
      </span>
      {children}
    </label>
  );
}

function ModalShell({
  onClose, title, children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="nf-page__modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="nf-page__modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nf-page__modal-header">
          <h2 className="nf-page__modal-title">{title}</h2>
          <button className="nf-page__modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ───────── Toast ───────── */

function Toast({
  message, palette,
}: {
  message: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <motion.div
      className="nf-page__toast"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        background: palette.textPrimary,
        color: palette.background,
      }}
    >
      <Check size={15} style={{ color: palette.positive }} />
      {message}
    </motion.div>
  );
}
