import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Search, ChevronDown, X, Check } from 'lucide-react-native';
import { DOCTORS, TREATMENT_TYPES, APPOINTMENT_STATUSES, PRIORITIES, ROOMS } from '../../theme/appointmentTokens';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const DATE_OPTIONS = ['All Dates', 'Today', 'This Week'];

const FILTER_DEFS = [
  { key: 'doctor', label: 'Doctor', options: DOCTORS },
  { key: 'treatment', label: 'Treatment', options: TREATMENT_TYPES },
  { key: 'date', label: 'Date', options: DATE_OPTIONS },
  { key: 'status', label: 'Status', options: APPOINTMENT_STATUSES },
  { key: 'priority', label: 'Priority', options: PRIORITIES },
  { key: 'room', label: 'Room', options: ROOMS },
];

export default function AppointmentFiltersBar({ searchQuery, onSearchChange, filters, onChangeFilter }) {
  const [openKey, setOpenKey] = useState(null);
  const activeDef = FILTER_DEFS.find((d) => d.key === openKey);
  const activeCount = Object.values(filters).filter((v) => v && v !== 'All').length;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={styles.searchRow}>
        <Search color={colors.textMuted} size={16} style={{ marginLeft: spacing.md }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient, appointment ID, doctor, treatment, or phone..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {FILTER_DEFS.map((def) => {
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
          <TouchableOpacity
            style={styles.clearChip}
            onPress={() => FILTER_DEFS.forEach((d) => onChangeFilter(d.key, 'All'))}
          >
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
              <TouchableOpacity onPress={() => setOpenKey(null)}>
                <X color={colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => { onChangeFilter(openKey, 'All'); setOpenKey(null); }}
            >
              <Text style={styles.optionTxt}>All {activeDef?.label}s</Text>
              {(!filters[openKey] || filters[openKey] === 'All') && <Check color={colors.primary} size={16} />}
            </TouchableOpacity>
            {activeDef?.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.optionRow}
                onPress={() => { onChangeFilter(openKey, opt); setOpenKey(null); }}
              >
                <Text style={styles.optionTxt}>{opt}</Text>
                {filters[openKey] === opt && <Check color={colors.primary} size={16} />}
              </TouchableOpacity>
            ))}
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
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', maxWidth: 110 },
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
  optionTxt: { color: colors.textPrimary, fontSize: typography.body.fontSize },
});
