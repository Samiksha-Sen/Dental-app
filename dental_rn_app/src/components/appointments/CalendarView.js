import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react-native';
import AppointmentCard from './AppointmentCard';
import GlassCard from '../GlassCard';
import { CALENDAR_VIEWS } from '../../theme/appointmentTokens';
import { toDateKey } from '../../hooks/useAppointments';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_HOURS = Array.from({ length: 10 }, (_, i) => 8 + i); // 8am..5pm

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeek(first);
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarView({ appointments, onSelectAppointment }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [view, setView] = useState('Month');
  const [anchor, setAnchor] = useState(new Date());

  const today = useMemo(() => new Date(), []);

  const byDateKey = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.values(map).forEach((list) => list.sort((x, y) => x.startMinutes - y.startMinutes));
    return map;
  }, [appointments]);

  const goPrev = () => setAnchor((d) => {
    if (view === 'Month') return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    if (view === 'Week') return addDays(d, -7);
    return addDays(d, -1);
  });
  const goNext = () => setAnchor((d) => {
    if (view === 'Month') return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    if (view === 'Week') return addDays(d, 7);
    return addDays(d, 1);
  });
  const goToday = () => setAnchor(new Date());

  const headerLabel = useMemo(() => {
    if (view === 'Month') return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (view === 'Week') {
      const start = startOfWeek(anchor);
      const end = addDays(start, 6);
      return `${MONTH_NAMES[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (view === 'Day') return `${DAY_NAMES[anchor.getDay()]}, ${MONTH_NAMES[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`;
    return 'All upcoming appointments';
  }, [view, anchor]);

  const openDay = (date) => { setAnchor(date); setView('Day'); };

  // ---------------- Month ----------------
  const renderMonth = () => {
    const gridStart = startOfMonthGrid(anchor);
    const weeks = [];
    for (let w = 0; w < 6; w += 1) {
      const days = [];
      for (let d = 0; d < 7; d += 1) days.push(addDays(gridStart, w * 7 + d));
      weeks.push(days);
    }
    return (
      <View>
        <View style={styles.weekHeaderRow}>
          {DAY_NAMES.map((n) => <Text key={n} style={styles.weekHeaderTxt}>{n}</Text>)}
        </View>
        {weeks.map((days, wi) => (
          <View key={wi} style={styles.monthWeekRow}>
            {days.map((day) => {
              const key = toDateKey(day);
              const inMonth = day.getMonth() === anchor.getMonth();
              const isToday = isSameDay(day, today);
              const dayAppts = byDateKey[key] || [];
              return (
                <TouchableOpacity key={key} style={[styles.monthCell, !inMonth && styles.monthCellOut]} onPress={() => openDay(day)} activeOpacity={0.7}>
                  <View style={[styles.monthDateWrap, isToday && styles.monthDateToday]}>
                    <Text style={[styles.monthDateTxt, !inMonth && styles.monthDateTxtOut, isToday && styles.monthDateTxtToday]}>{day.getDate()}</Text>
                  </View>
                  {dayAppts.slice(0, 3).map((a) => (
                    <AppointmentCard key={a.id} appointment={a} variant="chip" onPress={() => onSelectAppointment(a)} />
                  ))}
                  {dayAppts.length > 3 && (
                    <Text style={styles.moreTxt}>+{dayAppts.length - 3} more</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // ---------------- Week ----------------
  const renderWeek = () => {
    const start = startOfWeek(anchor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weekGrid}>
          {days.map((day) => {
            const key = toDateKey(day);
            const isToday = isSameDay(day, today);
            const dayAppts = byDateKey[key] || [];
            return (
              <View key={key} style={styles.weekCol}>
                <TouchableOpacity onPress={() => openDay(day)} style={[styles.weekColHeader, isToday && styles.weekColHeaderToday]}>
                  <Text style={[styles.weekColDayName, isToday && styles.weekColTodayTxt]}>{DAY_NAMES[day.getDay()]}</Text>
                  <Text style={[styles.weekColDayNum, isToday && styles.weekColTodayTxt]}>{day.getDate()}</Text>
                </TouchableOpacity>
                <ScrollView style={styles.weekColBody} showsVerticalScrollIndicator={false}>
                  {dayAppts.length === 0 ? (
                    <Text style={styles.weekEmptyTxt}>—</Text>
                  ) : (
                    dayAppts.map((a, idx) => (
                      <AppointmentCard key={a.id} appointment={a} variant="compact" onPress={() => onSelectAppointment(a)} delay={idx * 30} />
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  // ---------------- Day ----------------
  const renderDay = () => {
    const key = toDateKey(anchor);
    const dayAppts = byDateKey[key] || [];
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const isToday = isSameDay(anchor, today);
    return (
      <View>
        {DAY_HOURS.map((hour) => {
          const slotAppts = dayAppts.filter((a) => Math.floor(a.startMinutes / 60) === hour);
          const isCurrentHour = isToday && Math.floor(nowMinutes / 60) === hour;
          return (
            <View key={hour} style={styles.dayHourRow}>
              <View style={styles.dayHourLabelWrap}>
                <Text style={[styles.dayHourLabel, isCurrentHour && styles.dayHourLabelNow]}>
                  {hour % 12 === 0 ? 12 : hour % 12}:00 {hour >= 12 ? 'PM' : 'AM'}
                </Text>
                {isCurrentHour && <View style={styles.nowDot} />}
              </View>
              <View style={styles.dayHourContent}>
                {slotAppts.length === 0 ? (
                  <View style={styles.dayHourEmpty} />
                ) : (
                  slotAppts.map((a, idx) => (
                    <AppointmentCard key={a.id} appointment={a} variant="row" onPress={() => onSelectAppointment(a)} delay={idx * 40} />
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ---------------- Agenda ----------------
  const renderAgenda = () => {
    const grouped = [...appointments]
      .sort((a, b) => (a.date + String(a.startMinutes).padStart(4, '0')).localeCompare(b.date + String(b.startMinutes).padStart(4, '0')))
      .reduce((acc, a) => {
        if (!acc.length || acc[acc.length - 1].date !== a.date) acc.push({ date: a.date, items: [a] });
        else acc[acc.length - 1].items.push(a);
        return acc;
      }, []);

    if (grouped.length === 0) {
      return <Text style={styles.weekEmptyTxt}>No appointments match your current search/filters.</Text>;
    }

    return (
      <View>
        {grouped.map((group) => (
          <View key={group.date} style={{ marginBottom: spacing.lg }}>
            <Text style={styles.agendaDateHeader}>{group.date}</Text>
            {group.items.map((a, idx) => (
              <AppointmentCard key={a.id} appointment={a} variant="row" onPress={() => onSelectAppointment(a)} delay={idx * 30} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <GlassCard style={styles.wrap}>
      <View style={styles.toolbar}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={goPrev}><ChevronLeft color={colors.textSecondary} size={18} /></TouchableOpacity>
          <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
            <CalendarClock color={colors.primary} size={13} />
            <Text style={styles.todayBtnTxt}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={goNext}><ChevronRight color={colors.textSecondary} size={18} /></TouchableOpacity>
        </View>
        <Text style={styles.headerLabel} numberOfLines={1}>{headerLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewSwitchRow}>
          {CALENDAR_VIEWS.map((v) => (
            <TouchableOpacity key={v} style={[styles.viewChip, view === v && styles.viewChipActive]} onPress={() => setView(v)}>
              <Text style={[styles.viewChipTxt, view === v && styles.viewChipTxtActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {view === 'Month' && renderMonth()}
      {view === 'Week' && renderWeek()}
      {view === 'Day' && renderDay()}
      {view === 'Agenda' && renderAgenda()}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg },
  toolbar: { marginBottom: spacing.md },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  navBtn: {
    width: 32, height: 32, borderRadius: radii.sm, backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center',
  },
  todayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radii.pill, backgroundColor: colors.glassFillStrong,
  },
  todayBtnTxt: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  headerLabel: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  viewSwitchRow: { flexDirection: 'row', gap: 6 },
  viewChip: {
    paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radii.pill,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
  },
  viewChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  viewChipTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  viewChipTxtActive: { color: '#fff' },

  weekHeaderRow: { flexDirection: 'row' },
  weekHeaderTxt: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '700', paddingVertical: 6 },
  monthWeekRow: { flexDirection: 'row' },
  monthCell: {
    flex: 1, minHeight: 84, borderWidth: 0.5, borderColor: colors.glassBorder, padding: 4,
  },
  monthCellOut: { backgroundColor: colors.glassFill },
  monthDateWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  monthDateToday: { backgroundColor: colors.primary },
  monthDateTxt: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  monthDateTxtOut: { color: colors.textMuted },
  monthDateTxtToday: { color: '#fff' },
  moreTxt: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 1 },

  weekGrid: { flexDirection: 'row' },
  weekCol: { width: 160, borderRightWidth: 1, borderRightColor: colors.glassBorder },
  weekColHeader: { alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  weekColHeaderToday: { backgroundColor: colors.glassFillStrong },
  weekColDayName: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  weekColDayNum: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 2 },
  weekColTodayTxt: { color: colors.primary },
  weekColBody: { padding: 6, maxHeight: 420 },
  weekEmptyTxt: { color: colors.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: spacing.md },

  dayHourRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.glassBorder, paddingVertical: spacing.sm },
  dayHourLabelWrap: { width: 76, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayHourLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  dayHourLabelNow: { color: colors.primary, fontWeight: '800' },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  dayHourContent: { flex: 1 },
  dayHourEmpty: { height: 1 },

  agendaDateHeader: { color: colors.textSecondary, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', marginBottom: spacing.sm, letterSpacing: 0.4 },
});
