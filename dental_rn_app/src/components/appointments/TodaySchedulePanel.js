import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CalendarCheck } from 'lucide-react-native';
import GlassCard from '../GlassCard';
import AppointmentCard from './AppointmentCard';
import { toDateKey } from '../../hooks/useAppointments';
import { colors, spacing, typography } from '../../theme/tokens';

export default function TodaySchedulePanel({ appointments, onSelectAppointment, style }) {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const todays = useMemo(
    () => appointments.filter((a) => a.date === todayKey).sort((a, b) => a.startMinutes - b.startMinutes),
    [appointments, todayKey]
  );

  return (
    <GlassCard style={[styles.wrap, style]}>
      <View style={styles.header}>
        <CalendarCheck color={colors.primary} size={17} />
        <Text style={styles.title}>Today's Schedule</Text>
      </View>
      <Text style={styles.subtitle}>{todays.length} appointment{todays.length === 1 ? '' : 's'} today</Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {todays.length === 0 ? (
          <Text style={styles.emptyTxt}>Nothing scheduled for today.</Text>
        ) : (
          todays.map((a, idx) => (
            <AppointmentCard key={a.id} appointment={a} variant="row" onPress={() => onSelectAppointment(a)} delay={idx * 40} />
          ))
        )}
      </ScrollView>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginBottom: spacing.md },
  list: { maxHeight: 640 },
  emptyTxt: { color: colors.textMuted, fontSize: typography.body.fontSize, textAlign: 'center', paddingVertical: spacing.xl },
});
