import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import {
  X, Phone, Stethoscope, CalendarDays, Clock, DoorOpen, Flag, FileText, ScanLine,
  PlayCircle, Pencil, CheckCircle2, Ban, Printer,
} from 'lucide-react-native';
import PatientAvatar from './PatientAvatar';
import TreatmentTag from './TreatmentTag';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import GradientButton from '../GradientButton';
import ConfirmModal from '../ConfirmModal';
import { priorityColors } from '../../theme/appointmentTokens';
import { colors, gradients, radii, spacing, typography } from '../../theme/tokens';

function InfoRow({ Icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Icon color={colors.textMuted} size={15} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AppointmentDetailSheet({ visible, appointment, onClose, onUpdateStatus, onEdit }) {
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!appointment) return null;
  const a = appointment;

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      alert('Printing is available from the web version of the portal.');
    }
  };

  const canStart = a.status === 'Upcoming' || a.status === 'Checked In';
  const canComplete = a.status !== 'Completed' && a.status !== 'Cancelled';

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
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Appointment Details</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.patientRow}>
              <PatientAvatar name={a.patientName} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{a.patientName}</Text>
                <Text style={styles.patientMeta}>{a.id} · {a.age} yrs · {a.gender}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 6, flexWrap: 'wrap' }}>
                  <AppointmentStatusBadge status={a.status} />
                  <TreatmentTag treatment={a.treatment} />
                </View>
              </View>
            </View>

            <View style={styles.grid}>
              <InfoRow Icon={Phone} label="Phone Number" value={a.phone} />
              <InfoRow Icon={Stethoscope} label="Doctor" value={a.doctor} />
              <InfoRow Icon={CalendarDays} label="Appointment Date" value={a.date} />
              <InfoRow Icon={Clock} label="Time · Duration" value={`${a.time} · ${a.duration} min`} />
              <InfoRow Icon={DoorOpen} label="Room Number" value={a.room} />
              <InfoRow Icon={Flag} label="Priority" value={a.priority} />
            </View>
            <View style={[styles.priorityStrip, { backgroundColor: `${priorityColors[a.priority]}18`, borderColor: `${priorityColors[a.priority]}40` }]}>
              <Flag color={priorityColors[a.priority]} size={13} />
              <Text style={[styles.priorityStripTxt, { color: priorityColors[a.priority] }]}>{a.priority} priority appointment</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FileText color={colors.textMuted} size={14} />
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <Text style={styles.notesTxt}>{a.notes || 'No additional notes.'}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ScanLine color={colors.textMuted} size={14} />
                <Text style={styles.sectionTitle}>AI X-ray Analysis Status</Text>
              </View>
              <View style={[styles.aiPill, { backgroundColor: a.aiXrayStatus.includes('Caries Detected') ? colors.dangerBg : colors.successBg }]}>
                <Text style={[styles.aiPillTxt, { color: a.aiXrayStatus.includes('Caries Detected') ? colors.danger : colors.success }]}>
                  {a.aiXrayStatus}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              {canStart && (
                <GradientButton
                  title="Start Consultation"
                  icon={<PlayCircle color="#fff" size={17} />}
                  onPress={() => { onUpdateStatus(a.id, 'In Progress'); }}
                  style={{ marginBottom: spacing.md }}
                />
              )}
              {canComplete && (
                <GradientButton
                  title="Mark Completed"
                  icon={<CheckCircle2 color="#fff" size={17} />}
                  colorsOverride={gradients.success}
                  onPress={() => { onUpdateStatus(a.id, 'Completed'); onClose(); }}
                  style={{ marginBottom: spacing.md }}
                />
              )}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => onEdit(a)}>
                  <Pencil color={colors.cyanLight} size={15} />
                  <Text style={styles.ghostBtnTxt}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={handlePrint}>
                  <Printer color={colors.cyanLight} size={15} />
                  <Text style={styles.ghostBtnTxt}>Print</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ghostBtn, styles.dangerBtn]}
                  onPress={() => setConfirmCancel(true)}
                  disabled={a.status === 'Cancelled'}
                >
                  <Ban color={colors.danger} size={15} />
                  <Text style={[styles.ghostBtnTxt, { color: colors.danger }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </MotiView>
      </View>

      <ConfirmModal
        visible={confirmCancel}
        title="Cancel this appointment?"
        message={`This will mark ${a.patientName}'s ${a.treatment.toLowerCase()} appointment on ${a.date} as cancelled.`}
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Appointment"
        danger
        onConfirm={() => { onUpdateStatus(a.id, 'Cancelled'); setConfirmCancel(false); onClose(); }}
        onCancel={() => setConfirmCancel(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: {
    alignSelf: 'stretch', backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg,
    borderWidth: 1, borderColor: colors.glassBorder, borderBottomWidth: 0,
    padding: spacing.xl, maxHeight: '88%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sheetTitle: { ...typography.h3, color: colors.textPrimary },
  patientRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, alignItems: 'center' },
  patientName: { ...typography.h3, color: colors.textPrimary },
  patientMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '47%', minWidth: 140 },
  infoIconWrap: {
    width: 30, height: 30, borderRadius: radii.sm, backgroundColor: colors.glassFillStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '700', marginTop: 1 },
  priorityStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.lg,
  },
  priorityStripTxt: { fontSize: typography.caption.fontSize, fontWeight: '700' },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase' },
  notesTxt: { color: colors.textSecondary, fontSize: typography.body.fontSize, lineHeight: 20 },
  aiPill: { alignSelf: 'flex-start', borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: 8 },
  aiPillTxt: { fontSize: typography.caption.fontSize, fontWeight: '700' },
  actions: { marginTop: spacing.sm, marginBottom: spacing.xl },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  ghostBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassFill,
    borderRadius: radii.sm, paddingVertical: 12,
  },
  dangerBtn: { borderColor: 'rgba(220,38,38,0.3)', backgroundColor: colors.dangerBg },
  ghostBtnTxt: { color: colors.cyanLight, fontWeight: '700', fontSize: 12 },
});
