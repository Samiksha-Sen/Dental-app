import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Search, X, ChevronDown, User, Phone, CalendarClock } from 'lucide-react-native';
import PatientAvatar from './appointments/PatientAvatar';
import { colors, radii, spacing, typography } from '../theme/tokens';

// Deterministic per-patient gender — patients has no gender column yet, and
// adding one isn't required for Age support, so this mirrors the same
// hash-derived placeholder already used on the dashboard's "Patients
// Tracked" page. Phone and age are now real stored fields, used as-is.
function hashString(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  return h;
}
function deriveGender(seed) { return hashString(`gender-${seed}`) % 2 === 0 ? 'Female' : 'Male'; }

export default function PatientSearchSelect({ patients, value, onSelect }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const withDerived = useMemo(
    () => patients.map((p) => ({ ...p, phone: p.phone || '', age: p.age ?? null, gender: deriveGender(p.dbId) })),
    [patients]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withDerived;
    return withDerived.filter((p) =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [withDerived, query]);

  const showDropdown = focused;

  const handleSelect = (p) => {
    onSelect(p);
    setQuery('');
    setFocused(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelect(null);
  };

  const showSummary = !!value && !focused;

  return (
    <View>
      {!showSummary && (
        <View style={styles.searchRow}>
          <Search color={colors.textMuted} size={16} style={{ marginLeft: spacing.md }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Patient ID, name, or phone number..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            autoFocus={!!value}
          />
          {(query.length > 0 || value) && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <X color={colors.textMuted} size={15} />
            </TouchableOpacity>
          )}
          <ChevronDown color={colors.textMuted} size={15} style={{ marginRight: spacing.md }} />
        </View>
      )}

      <AnimatePresence>
        {showDropdown && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -6 }}
            transition={{ type: 'timing', duration: 180 }}
            style={styles.dropdown}
          >
            {filtered.length === 0 ? (
              <Text style={styles.emptyTxt}>No matching patient found.</Text>
            ) : (
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.dropdownScroll}>
                {filtered.map((p) => (
                  <TouchableOpacity key={p.dbId} style={styles.optionRow} onPress={() => handleSelect(p)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.optionMeta}>{p.id} · {p.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </MotiView>
        )}
      </AnimatePresence>

      {showSummary && (
        <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 220 }} style={styles.summaryCard}>
          <PatientAvatar name={value.name} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.summaryName} numberOfLines={1}>{value.name}</Text>
            <Text style={styles.summaryMeta}>Patient ID: {value.id}</Text>
            <View style={styles.summaryMetaRow}>
              <User color={colors.textMuted} size={12} />
              <Text style={styles.summaryMetaTxt}>{value.age} yrs · {value.gender}</Text>
            </View>
            <View style={styles.summaryMetaRow}>
              <Phone color={colors.textMuted} size={12} />
              <Text style={styles.summaryMetaTxt}>{value.phone}</Text>
            </View>
            <View style={styles.summaryMetaRow}>
              <CalendarClock color={colors.textMuted} size={12} />
              <Text style={styles.summaryMetaTxt}>Last scan: {value.history?.[0]?.date || 'No previous scans'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={() => setFocused(true)}>
            <Text style={styles.changeBtnTxt}>Change</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.sm,
  },
  searchInput: { flex: 1, height: 46, paddingHorizontal: spacing.sm, color: colors.textPrimary },
  clearBtn: { padding: spacing.sm },
  dropdown: {
    marginTop: spacing.sm, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: radii.sm, maxHeight: 260, overflow: 'hidden',
  },
  dropdownScroll: { maxHeight: 260 },
  optionRow: { paddingVertical: 10, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  optionName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  optionMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  emptyTxt: { color: colors.textMuted, fontSize: typography.body.fontSize, textAlign: 'center', paddingVertical: spacing.lg },
  clearLink: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  clearLinkTxt: { color: colors.cyanLight, fontWeight: '700', fontSize: typography.caption.fontSize },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.glassFillStrong, borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: radii.sm, padding: spacing.md,
  },
  summaryName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  summaryMeta: { color: colors.cyanLight, fontWeight: '700', fontSize: typography.caption.fontSize, marginTop: 2 },
  summaryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  summaryMetaTxt: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  changeBtn: {
    borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassFill,
    borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  changeBtnTxt: { color: colors.primary, fontWeight: '700', fontSize: 11 },
});
