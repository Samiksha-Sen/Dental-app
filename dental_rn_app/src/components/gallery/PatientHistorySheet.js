import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { X } from 'lucide-react-native';
import AIStatusBadge from './AIStatusBadge';
import PatientAvatar from '../appointments/PatientAvatar';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function PatientHistorySheet({ visible, group, onClose, onSelectScan }) {
  if (!group) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <MotiView
          from={{ translateY: 420, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 210 }}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <View style={styles.patientRow}>
              <PatientAvatar name={group.patientName} size={44} />
              <View>
                <Text style={styles.patientName}>{group.patientName}</Text>
                <Text style={styles.patientMeta}>{group.patientCode} · {group.totalScans} X-ray{group.totalScans === 1 ? '' : 's'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}><X color={colors.textMuted} size={20} /></TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Chronological X-ray History</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {group.scans.map((scan) => (
              <TouchableOpacity key={scan.id} style={styles.row} onPress={() => onSelectScan(scan)}>
                <Image source={{ uri: scan.imageUrl }} style={styles.thumb} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowDate}>{scan.dateKey}</Text>
                  <Text style={styles.rowDiag} numberOfLines={1}>{scan.diagnosis}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>{scan.scanType} · {scan.doctor}</Text>
                </View>
                <AIStatusBadge status={scan.aiStatus} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: {
    alignSelf: 'stretch', backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg,
    borderWidth: 1, borderColor: colors.glassBorder, borderBottomWidth: 0,
    padding: spacing.xl, maxHeight: '85%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  patientName: { ...typography.h3, color: colors.textPrimary },
  patientMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  sectionLabel: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.glassFillStrong, borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: radii.sm },
  rowDate: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.caption.fontSize },
  rowDiag: { color: colors.textSecondary, fontSize: typography.body.fontSize, fontWeight: '600', marginTop: 2 },
  rowMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
});
