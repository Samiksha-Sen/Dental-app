import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Bell, Clock, UserCheck, AlarmClockOff, XCircle } from 'lucide-react-native';
import IconButton from '../IconButton';
import { X } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const KIND_META = {
  reminder: { Icon: Clock, color: colors.cyanLight },
  arrived: { Icon: UserCheck, color: colors.success },
  delayed: { Icon: AlarmClockOff, color: colors.warning },
  cancelled: { Icon: XCircle, color: colors.danger },
};

function buildNotifications(appointments) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const notes = [];

  appointments
    .filter((a) => a.date === todayKey && a.status === 'Upcoming' && a.startMinutes - nowMinutes > 0 && a.startMinutes - nowMinutes <= 15)
    .forEach((a) => notes.push({ id: `rem-${a.id}`, kind: 'reminder', text: `${a.patientName}'s appointment starts in ${a.startMinutes - nowMinutes} minutes.` }));

  appointments
    .filter((a) => a.date === todayKey && a.status === 'Checked In')
    .slice(0, 2)
    .forEach((a) => notes.push({ id: `arr-${a.id}`, kind: 'arrived', text: `${a.patientName} has arrived and checked in for ${a.doctor}.` }));

  appointments
    .filter((a) => a.date === todayKey && a.status === 'In Progress')
    .slice(0, 1)
    .forEach((a) => notes.push({ id: `del-${a.id}`, kind: 'delayed', text: `${a.doctor} is running slightly behind schedule.` }));

  appointments
    .filter((a) => a.date === todayKey && a.status === 'Cancelled')
    .slice(0, 2)
    .forEach((a) => notes.push({ id: `can-${a.id}`, kind: 'cancelled', text: `${a.patientName}'s ${a.treatment.toLowerCase()} appointment was cancelled.` }));

  return notes.slice(0, 5);
}

export default function AppointmentNotifications({ appointments }) {
  const [dismissed, setDismissed] = useState([]);
  const notes = useMemo(() => buildNotifications(appointments).filter((n) => !dismissed.includes(n.id)), [appointments, dismissed]);

  if (notes.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Bell color={colors.textSecondary} size={15} />
        <Text style={styles.headerTxt}>Live Updates</Text>
      </View>
      <AnimatePresence>
        {notes.map((n, idx) => {
          const { Icon, color } = KIND_META[n.kind];
          return (
            <MotiView
              key={n.id}
              from={{ opacity: 0, translateX: -12 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: 12 }}
              transition={{ type: 'timing', duration: 260, delay: idx * 50 }}
              style={[styles.card, { borderLeftColor: color }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
                <Icon color={color} size={15} />
              </View>
              <Text style={styles.txt}>{n.text}</Text>
              <IconButton size={26} onPress={() => setDismissed((prev) => [...prev, n.id])}>
                <X color={colors.textMuted} size={13} />
              </IconButton>
            </MotiView>
          );
        })}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  headerTxt: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.glassBorder, borderLeftWidth: 3,
    borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.sm,
  },
  iconWrap: { width: 30, height: 30, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  txt: { flex: 1, color: colors.textPrimary, fontSize: typography.caption.fontSize, lineHeight: 16 },
});
