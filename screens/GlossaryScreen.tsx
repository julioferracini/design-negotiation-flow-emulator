import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NText,
  Box,
  Badge,
  ArrowBackIcon,
  useNuDSTheme,
} from '@nubank/nuds-vibecode-react-native';
import { useThemeMode } from '../config/ThemeModeContext';
import { GLOSSARY_DATA, type GlossaryEntry } from '../shared/data/glossary';

type SortKey = 'acronym' | 'definition';
type SortDir = 'asc' | 'desc';

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('#') && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

interface Props {
  onBack: () => void;
}

export default function GlossaryScreen({ onBack }: Props) {
  const theme = useNuDSTheme();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';
  const accent = theme.color.main;

  const [entries, setEntries] = useState<GlossaryEntry[]>(GLOSSARY_DATA);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('acronym');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [addOpen, setAddOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

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
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...result].sort((a, b) => a[sortKey].localeCompare(b[sortKey]) * dir);
  }, [entries, query, sortKey, sortDir]);

  const handleSort = () => {
    if (sortDir === 'asc') setSortDir('desc');
    else { setSortDir('asc'); setSortKey(sortKey === 'acronym' ? 'definition' : 'acronym'); }
  };

  const handleAdd = useCallback((entry: GlossaryEntry) => {
    setEntries((prev) => [...prev, entry]);
    setAddOpen(false);
  }, []);

  const handleEditSave = useCallback((updated: GlossaryEntry) => {
    if (editIndex === null) return;
    setEntries((prev) => prev.map((e, i) => (i === editIndex ? updated : e)));
    setEditIndex(null);
  }, [editIndex]);

  const handleRemove = useCallback(() => {
    if (editIndex === null) return;
    const removed = entries[editIndex];
    Alert.alert('Remove Term', `Delete "${removed.acronym}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          setEntries((prev) => prev.filter((_, i) => i !== editIndex));
          setEditIndex(null);
        },
      },
    ]);
  }, [editIndex, entries]);

  const cardBg = isLight ? '#FFFFFF' : '#151515';
  const borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  const renderItem = useCallback(({ item }: { item: GlossaryEntry }) => {
    const originalIndex = entries.indexOf(item);
    return (
      <Pressable
        onPress={() => setEditIndex(originalIndex)}
        style={({ pressed }) => [
          st.card,
          {
            backgroundColor: cardBg,
            borderColor,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={st.cardHeader}>
          <Text style={[st.acronym, { color: accent }]}>{item.acronym}</Text>
          <Text style={[st.definition, { color: theme.color.content.primary }]}>{item.definition}</Text>
        </View>
        <Text style={[st.explanation, { color: theme.color.content.secondary }]} numberOfLines={2}>
          {item.explanation}
        </Text>
      </Pressable>
    );
  }, [entries, cardBg, borderColor, accent, theme]);

  return (
    <Box surface="screen" style={st.screen}>
      <StatusBar style={isLight ? 'dark' : 'light'} />

      {/* Header */}
      <View style={st.headerWrap}>
        <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <ArrowBackIcon size={20} color={theme.color.content.primary} />
          <NText variant="labelSmallDefault" tone="secondary">Home</NText>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <NText variant="titleMedium">Glossary</NText>
            <NText variant="paragraphSmallDefault" tone="secondary">Business terms and definitions</NText>
          </View>
          <Badge label={`${filtered.length} terms`} color="neutral" />
        </View>

        {/* Search */}
        <View style={[st.searchBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={{ color: theme.color.content.secondary, fontSize: 15, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search..."
            placeholderTextColor={theme.color.content.secondary}
            value={query}
            onChangeText={setQuery}
            style={[st.searchInput, { color: theme.color.content.primary }]}
          />
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Pressable onPress={handleSort} style={[st.actionBtn, { borderColor }]}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.color.content.secondary }}>
              Sort: {sortKey === 'acronym' ? 'A→Z' : 'Def'} {sortDir === 'asc' ? '↑' : '↓'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setAddOpen(true)} style={[st.actionBtn, { backgroundColor: accent }]}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>+ Add Term</Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => `${item.acronym}-${i}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <NText variant="paragraphSmallDefault" tone="secondary">No terms found for "{query}"</NText>
          </View>
        }
      />

      {/* Add Bottom Sheet */}
      <EntryFormSheet
        visible={addOpen}
        title="Add Term"
        submitLabel="Add to Glossary"
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        theme={theme}
        isLight={isLight}
      />

      {/* Edit Bottom Sheet */}
      {editIndex !== null && (
        <EntryFormSheet
          visible
          title="Edit Term"
          submitLabel="Save Changes"
          initial={entries[editIndex]}
          onClose={() => setEditIndex(null)}
          onSubmit={handleEditSave}
          onDelete={handleRemove}
          theme={theme}
          isLight={isLight}
        />
      )}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Entry Form Bottom Sheet                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function EntryFormSheet({ visible, title, submitLabel, initial, onClose, onSubmit, onDelete, theme, isLight }: {
  visible: boolean;
  title: string;
  submitLabel: string;
  initial?: GlossaryEntry;
  onClose: () => void;
  onSubmit: (entry: GlossaryEntry) => void;
  onDelete?: () => void;
  theme: ReturnType<typeof useNuDSTheme>;
  isLight: boolean;
}) {
  const [acronym, setAcronym] = useState(initial?.acronym ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const canSubmit = acronym.trim() && definition.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ acronym: acronym.trim(), definition: definition.trim(), explanation: explanation.trim() });
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.color.border.primary,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: theme.color.content.primary,
    backgroundColor: theme.color.background.primary,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose}>
        <View />
      </Pressable>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ backgroundColor: isLight ? '#FFFFFF' : '#1A1A1C', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginTop: 10, marginBottom: 16 }} />
        <NText variant="subtitleSmallStrong" style={{ marginBottom: 16 } as any}>{title}</NText>

        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.color.content.secondary, marginBottom: 4 }}>Acronym *</Text>
        <TextInput value={acronym} onChangeText={setAcronym} placeholder="e.g. KPI" placeholderTextColor={theme.color.content.secondary} style={[inputStyle, { marginBottom: 12 }]} />

        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.color.content.secondary, marginBottom: 4 }}>Definition *</Text>
        <TextInput value={definition} onChangeText={setDefinition} placeholder="Key Performance Indicator" placeholderTextColor={theme.color.content.secondary} style={[inputStyle, { marginBottom: 12 }]} />

        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.color.content.secondary, marginBottom: 4 }}>Explanation</Text>
        <TextInput value={explanation} onChangeText={setExplanation} placeholder="A measurable value..." placeholderTextColor={theme.color.content.secondary} multiline numberOfLines={3} style={[inputStyle, { marginBottom: 16, minHeight: 72, textAlignVertical: 'top' }]} />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={handleSubmit} disabled={!canSubmit}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: canSubmit ? theme.color.main : withAlpha(theme.color.main, 0.3), alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{submitLabel}</Text>
          </Pressable>
          {onDelete && (
            <Pressable onPress={onDelete} style={{ paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#D01D1C', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#D01D1C' }}>Delete</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 44 },
  headerWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 },
  acronym: { fontSize: 14, fontWeight: '700' },
  definition: { fontSize: 13, fontWeight: '500', flex: 1 },
  explanation: { fontSize: 12, lineHeight: 18 },
});
