import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <View style={styles.wrap}>
      <Text style={styles.rangeTxt}>{start}–{end} of {totalItems}</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, page === 1 && styles.btnDisabled]}
          onPress={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft color={page === 1 ? colors.textMuted : colors.textSecondary} size={16} />
        </TouchableOpacity>
        <Text style={styles.pageTxt}>Page {page} of {totalPages}</Text>
        <TouchableOpacity
          style={[styles.btn, page === totalPages && styles.btnDisabled]}
          onPress={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight color={page === totalPages ? colors.textMuted : colors.textSecondary} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, flexWrap: 'wrap', gap: spacing.sm,
  },
  rangeTxt: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: {
    width: 32, height: 32, borderRadius: radii.sm, backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  pageTxt: { color: colors.textSecondary, fontSize: typography.caption.fontSize, fontWeight: '600' },
});
