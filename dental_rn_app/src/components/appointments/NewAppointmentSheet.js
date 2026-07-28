import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Switch, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { X, CalendarPlus } from 'lucide-react-native';
import FloatingInput from '../FloatingInput';
import GradientButton from '../GradientButton';
import { DOCTORS, TREATMENT_TYPES, PRIORITIES, ROOMS, treatmentColors, priorityColors } from '../../theme/appointmentTokens';
import { minutesToLabel, toDateKey } from '../../hooks/useAppointments';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const TIME_SLOTS = (() => {
  const slots = [];
  for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) slots.push(m);
  return slots;
})();

const DURATIONS = [15, 20, 30, 45, 60, 90];

function ChipGroup({ label, options, value, onChange, renderLabel, colorFor }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((opt) => {
          const active = value === opt;
          const accent = colorFor ? colorFor(opt) : colors.primary;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.chip,
                active && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{renderLabel ? renderLabel(opt) : opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const emptyForm = () => ({
  patientName: '',
  patientId: '',
  phone: '',
  doctor: DOCTORS[0],
  treatment: TREATMENT_TYPES[0],
  date: toDateKey(new Date()),
  startMinutes: TIME_SLOTS[0],
  duration: 30,
  priority: 'Medium',
  room: ROOMS[0],
  notes: '',
  reminder: true,
});

export default function NewAppointmentSheet({ visible, initial, onCancel, onSave }) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (visible) {
      setForm(initial ? {
        patientName: initial.patientName,
        patientId: initial.patientId,
        phone: initial.phone,
        doctor: initial.doctor,
        treatment: initial.treatment,
        date: initial.date,
        startMinutes: initial.startMinutes,
        duration: initial.duration,
        priority: initial.priority,
        room: initial.room,
        notes: initial.notes,
        reminder: initial.reminder ?? true,
      } : emptyForm());
    }
  }, [visible, initial]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.patientName.trim()) {
      alert('Please enter the patient name.');
      return;
    }
    if (!form.phone.trim()) {
      alert('Please enter a phone number.');
      return;
    }
    onSave({
      ...form,
      patientId: form.patientId.trim() || `PT-${Math.floor(10000 + Math.random() * 89999)}`,
      time: minutesToLabel(form.startMinutes),
      age: initial?.age ?? Math.floor(15 + Math.random() * 55),
      gender: initial?.gender ?? 'Unspecified',
      aiXrayStatus: initial?.aiXrayStatus ?? (form.treatment === 'Emergency' || form.treatment === 'Root Canal' ? 'Pending Review' : 'Not Required'),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <MotiView
          from={{ translateY: 420, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 210 }}
          style={styles.sheet}
        >
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <CalendarPlus color={colors.primary} size={19} />
              <Text style={styles.sheetTitle}>{initial ? 'Edit Appointment' : 'New Appointment'}</Text>
            </View>
            <TouchableOpacity onPress={onCancel}>
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <FloatingInput label="Patient Name" value={form.patientName} onChangeText={(v) => set('patientName', v)} placeholder="Patient full name" />
            <FloatingInput label="Patient ID" value={form.patientId} onChangeText={(v) => set('patientId', v)} placeholder="Auto-generated if left blank" />
            <FloatingInput label="Phone Number" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="+91 98765 43210" keyboardType="phone-pad" />

            <ChipGroup label="Doctor" options={DOCTORS} value={form.doctor} onChange={(v) => set('doctor', v)} />
            <ChipGroup
              label="Treatment Type"
              options={TREATMENT_TYPES}
              value={form.treatment}
              onChange={(v) => set('treatment', v)}
              colorFor={(opt) => treatmentColors[opt]}
            />

            <FloatingInput label="Appointment Date" value={form.date} onChangeText={(v) => set('date', v)} placeholder="YYYY-MM-DD" />

            <ChipGroup
              label="Appointment Time"
              options={TIME_SLOTS}
              value={form.startMinutes}
              onChange={(v) => set('startMinutes', v)}
              renderLabel={(m) => minutesToLabel(m)}
            />
            <ChipGroup
              label="Duration"
              options={DURATIONS}
              value={form.duration}
              onChange={(v) => set('duration', v)}
              renderLabel={(d) => `${d} min`}
            />
            <ChipGroup
              label="Priority"
              options={PRIORITIES}
              value={form.priority}
              onChange={(v) => set('priority', v)}
              colorFor={(opt) => priorityColors[opt]}
            />
            <ChipGroup label="Room" options={ROOMS} value={form.room} onChange={(v) => set('room', v)} />

            <FloatingInput label="Notes" value={form.notes} onChangeText={(v) => set('notes', v)} placeholder="Any additional notes for this visit" />

            <View style={styles.reminderRow}>
              <View>
                <Text style={styles.fieldLabel}>Reminder</Text>
                <Text style={styles.reminderHint}>Notify patient before this appointment</Text>
              </View>
              <Switch
                value={form.reminder}
                onValueChange={(v) => set('reminder', v)}
                trackColor={{ false: colors.glassBorder, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <GradientButton title="Save Appointment" onPress={handleSave} style={{ flex: 1 }} />
            </View>
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
    padding: spacing.xl, maxHeight: '90%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sheetTitle: { ...typography.h3, color: colors.textPrimary },
  fieldLabel: { fontSize: typography.label.fontSize, color: colors.textMuted, marginBottom: spacing.sm, letterSpacing: 0.3 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radii.pill,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
  },
  chipTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTxtActive: { color: '#fff', fontWeight: '700' },
  reminderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.glassFillStrong, borderRadius: radii.sm, padding: spacing.md, marginBottom: spacing.xl,
  },
  reminderHint: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2, maxWidth: 220 },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassFill,
    borderRadius: radii.md, paddingVertical: 14,
  },
  cancelBtnTxt: { color: colors.textSecondary, fontWeight: '700', fontSize: typography.body.fontSize },
});
