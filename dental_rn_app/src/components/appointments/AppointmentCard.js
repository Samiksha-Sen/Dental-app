import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Clock, DoorOpen } from 'lucide-react-native';
import PressableScale from '../PressableScale';
import PatientAvatar from './PatientAvatar';
import TreatmentTag from './TreatmentTag';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { treatmentColors } from '../../theme/appointmentTokens';
import { colors, radii, spacing, typography } from '../../theme/tokens';

// variant: 'row' (agenda/day/today-panel, full width) | 'compact' (week column) | 'chip' (month cell dot)
export default function AppointmentCard({ appointment, onPress, variant = 'row', delay = 0 }) {
  const accent = treatmentColors[appointment.status === 'Cancelled' ? 'Cancelled' : appointment.treatment] || treatmentColors.Consultation;

  if (variant === 'chip') {
    return (
      <PressableScale onPress={onPress} scaleTo={0.94}>
        <View style={[styles.chip, { backgroundColor: `${accent}22` }]}>
          <View style={[styles.chipDot, { backgroundColor: accent }]} />
          <Text style={styles.chipTxt} numberOfLines={1}>{appointment.time} {appointment.patientName}</Text>
        </View>
      </PressableScale>
    );
  }

  if (variant === 'compact') {
    return (
      <MotiView from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300, delay }}>
        <PressableScale onPress={onPress} scaleTo={0.97}>
          <View style={[styles.compactCard, { borderLeftColor: accent, backgroundColor: `${accent}14` }]}>
            <Text style={styles.compactTime}>{appointment.time}</Text>
            <Text style={styles.compactName} numberOfLines={1}>{appointment.patientName}</Text>
            <Text style={[styles.compactTreatment, { color: accent }]} numberOfLines={1}>{appointment.treatment}</Text>
          </View>
        </PressableScale>
      </MotiView>
    );
  }

  return (
    <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 320, delay }}>
      <PressableScale onPress={onPress} scaleTo={0.985}>
        <View style={[styles.row, { borderLeftColor: accent }]}>
          <PatientAvatar name={appointment.patientName} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.rowTop}>
              <Text style={styles.rowName} numberOfLines={1}>{appointment.patientName}</Text>
              <Text style={styles.rowTime}>{appointment.time}</Text>
            </View>
            <View style={styles.rowMetaLine}>
              <TreatmentTag treatment={appointment.treatment} compact />
              <Text style={styles.rowDoctor} numberOfLines={1}>{appointment.doctor}</Text>
            </View>
            <View style={styles.rowBottom}>
              <View style={styles.rowInlineMeta}>
                <Clock color={colors.textMuted} size={12} />
                <Text style={styles.rowInlineTxt}>{appointment.duration} min</Text>
              </View>
              <View style={styles.rowInlineMeta}>
                <DoorOpen color={colors.textMuted} size={12} />
                <Text style={styles.rowInlineTxt}>{appointment.room}</Text>
              </View>
              <AppointmentStatusBadge status={appointment.status} />
            </View>
          </View>
        </View>
      </PressableScale>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.glassFillStrong,
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  rowName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize, flexShrink: 1 },
  rowTime: { color: colors.textSecondary, fontWeight: '700', fontSize: typography.caption.fontSize },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6, flexWrap: 'wrap' },
  rowDoctor: { color: colors.textMuted, fontSize: typography.caption.fontSize, flexShrink: 1 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, flexWrap: 'wrap' },
  rowInlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowInlineTxt: { color: colors.textMuted, fontSize: typography.caption.fontSize },

  compactCard: {
    borderLeftWidth: 3,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  compactTime: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  compactName: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  compactTreatment: { fontSize: 10, fontWeight: '700', marginTop: 1 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 2,
  },
  chipDot: { width: 5, height: 5, borderRadius: 2.5 },
  chipTxt: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, flexShrink: 1 },
});
