import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Search, ChevronDown, X, Check, ArrowUpDown } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

// Generic search + chip-filter bar, built fresh for the dashboard detail
// pages so the existing Appointments/Gallery filter bars (which hardcode
// their own option lists) never need to be touched.
export default function DetailFiltersBar({
  searchPlaceholder, searchQuery, onSearchChange,
  filterDefs, filters, onChangeFilter,
  sort, onChangeSort, sortOptions,
}) {
  const [openKey, setOpenKey] = useState(null);
  const activeDef = filterDefs.find((d) => d.key === openKey);
  const activeCount = Object.values(filters).filter((v) => v && v !== 'All').length;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={styles.searchRow}>
        <Search color={colors.textMuted} size={16} style={{ marginLeft: spacing.md }} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {sortOptions && (
          <TouchableOpacity
            style={[styles.filterChip, styles.sortChip]}
            onPress={() => onChangeSort(sort === sortOptions[0] ? sortOptions[1] : sortOptions[0])}
          >
            <ArrowUpDown color={colors.primary} size={13} />
            <Text style={[styles.filterChipTxt, { color: colors.primary }]}>{sort}</Text>
          </TouchableOpacity>
        )}

        {filterDefs.map((def) => {
          const value = filters[def.key];
          const active = value && value !== 'All';
          return (
            <TouchableOpacity
              key={def.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setOpenKey(def.key)}
            >
              <Text style={[styles.filterChipTxt, active && styles.filterChipTxtActive]} numberOfLines={1}>
                {active ? value : def.label}
              </Text>
              <ChevronDown color={active ? '#fff' : colors.textMuted} size={13} />
            </TouchableOpacity>
          );
        })}
        {activeCount > 0 && (
          <TouchableOpacity style={styles.clearChip} onPress={() => filterDefs.forEach((d) => onChangeFilter(d.key, 'All'))}>
            <X color={colors.danger} size={13} />
            <Text style={styles.clearChipTxt}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={!!openKey} transparent animationType="fade" onRequestClose={() => setOpenKey(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpenKey(null)}>
          <MotiView
            from={{ opacity: 0, translateY: 12, scale: 0.97 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            style={styles.sheet}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{activeDef?.label}</Text>
              <TouchableOpacity onPress={() => setOpenKey(null)}><X color={colors.textMuted} size={18} /></TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity style={styles.optionRow} onPress={() => { onChangeFilter(openKey, 'All'); setOpenKey(null); }}>
                <Text style={styles.optionTxt}>All {activeDef?.label}s</Text>
                {(!filters[openKey] || filters[openKey] === 'All') && <Check color={colors.primary} size={16} />}
              </TouchableOpacity>
              {activeDef?.options.map((opt) => (
                <TouchableOpacity key={opt} style={styles.optionRow} onPress={() => { onChangeFilter(openKey, opt); setOpenKey(null); }}>
                  <Text style={styles.optionTxt} numberOfLines={1}>{opt}</Text>
                  {filters[openKey] === opt && <Check color={colors.primary} size={16} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </MotiView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.sm, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, height: 46, paddingHorizontal: spacing.sm, color: colors.textPrimary },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: 2 },
  sortChip: { backgroundColor: colors.glassFillStrong, borderColor: colors.glassBorder },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', maxWidth: 130 },
  filterChipTxtActive: { color: '#fff' },
  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill,
    backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)',
  },
  clearChipTxt: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: {
    alignSelf: 'stretch', backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg,
    borderWidth: 1, borderColor: colors.glassBorder, borderBottomWidth: 0,
    padding: spacing.lg, maxHeight: '70%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { ...typography.h3, color: colors.textPrimary },
  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
  },
  optionTxt: { color: colors.textPrimary, fontSize: typography.body.fontSize, flexShrink: 1, marginRight: spacing.sm },
});
