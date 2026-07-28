import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { Plus, CalendarClock, Download, X, CalendarRange, CheckCircle2, XCircle, CalendarDays } from 'lucide-react-native';
import StatCard from '../../src/components/StatCard';
import PressableScale from '../../src/components/PressableScale';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import CalendarView from '../../src/components/appointments/CalendarView';
import TodaySchedulePanel from '../../src/components/appointments/TodaySchedulePanel';
import AppointmentFiltersBar from '../../src/components/appointments/AppointmentFiltersBar';
import AppointmentNotifications from '../../src/components/appointments/AppointmentNotifications';
import AppointmentDetailSheet from '../../src/components/appointments/AppointmentDetailSheet';
import NewAppointmentSheet from '../../src/components/appointments/NewAppointmentSheet';
import AppointmentEmptyState from '../../src/components/appointments/AppointmentEmptyState';
import AppointmentSkeleton, { SummaryCardsSkeleton } from '../../src/components/appointments/AppointmentSkeleton';
import { useAppointments, toDateKey } from '../../src/hooks/useAppointments';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

function matchesDateFilter(appt, dateFilter, todayKey) {
  if (!dateFilter || dateFilter === 'All') return true;
  if (dateFilter === 'Today') return appt.date === todayKey;
  if (dateFilter === 'This Week') {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    return appt.date >= todayKey && appt.date < toDateKey(weekEnd);
  }
  return true;
}

export default function Appointments() {
  const { appointments, loading, summary, createAppointment, updateAppointmentStatus, editAppointment } = useAppointments();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ doctor: 'All', treatment: 'All', date: 'All', status: 'All', priority: 'All', room: 'All' });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return appointments.filter((a) => {
      if (q) {
        const hay = `${a.patientName} ${a.id} ${a.doctor} ${a.treatment} ${a.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.doctor !== 'All' && a.doctor !== filters.doctor) return false;
      if (filters.treatment !== 'All' && a.treatment !== filters.treatment) return false;
      if (filters.status !== 'All' && a.status !== filters.status) return false;
      if (filters.priority !== 'All' && a.priority !== filters.priority) return false;
      if (filters.room !== 'All' && a.room !== filters.room) return false;
      if (!matchesDateFilter(a, filters.date, todayKey)) return false;
      return true;
    });
  }, [appointments, searchQuery, filters, todayKey]);

  const handleExport = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      alert('Exporting is available from the web version of the portal.');
      return;
    }
    const rows = [
      ['Appointment ID', 'Patient', 'Doctor', 'Treatment', 'Date', 'Time', 'Duration (min)', 'Room', 'Priority', 'Status'],
      ...filteredAppointments.map((a) => [a.id, a.patientName, a.doctor, a.treatment, a.date, a.time, a.duration, a.room, a.priority, a.status]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-schedule-${todayKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveNew = (data) => {
    createAppointment(data);
    setCreating(false);
    alert(`Appointment scheduled for ${data.patientName} on ${data.date} at ${data.time}.`);
  };

  const handleSaveEdit = (data) => {
    editAppointment(editing.id, data);
    setEditing(null);
    setSelectedAppointment((prev) => (prev && prev.id === editing.id ? { ...prev, ...data } : prev));
  };

  const showOnboardingEmpty = !loading && appointments.length === 0;
  const showNoResults = !loading && appointments.length > 0 && filteredAppointments.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.orbA} pointerEvents="none" />

        <FadeSlideIn>
          <Text style={styles.eyebrow}>SCHEDULING</Text>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, minWidth: 220 }}>
              <Text style={styles.title}>Appointments</Text>
              <Text style={styles.subtitle}>Manage dental appointments, schedules, and upcoming patient visits.</Text>
            </View>
          </View>

          <View style={styles.headerBtnRow}>
            <PressableScale onPress={() => setCreating(true)} style={{ flexGrow: 1, minWidth: 160 }} innerStyle={styles.primaryBtn}>
              <Plus color="#fff" size={16} />
              <Text style={styles.primaryBtnTxt}>New Appointment</Text>
            </PressableScale>
            <PressableScale onPress={() => setScheduleModalVisible(true)} style={{ flexGrow: 1, minWidth: 160 }} innerStyle={styles.ghostBtn}>
              <CalendarClock color={colors.primary} size={16} />
              <Text style={styles.ghostBtnTxt}>Today's Schedule</Text>
            </PressableScale>
            <PressableScale onPress={handleExport} style={{ flexGrow: 1, minWidth: 160 }} innerStyle={styles.ghostBtn}>
              <Download color={colors.primary} size={16} />
              <Text style={styles.ghostBtnTxt}>Export Schedule</Text>
            </PressableScale>
          </View>
        </FadeSlideIn>

        {loading ? (
          <SummaryCardsSkeleton />
        ) : (
          <FadeSlideIn delay={80}>
            <View style={styles.statsRow}>
              <StatCard icon={<CalendarDays color={colors.primary} size={19} />} label="Today's Appointments" value={summary.todayCount} color={colors.primary} />
              <StatCard icon={<CalendarRange color={colors.cyanLight} size={19} />} label="Upcoming This Week" value={summary.upcomingWeekCount} color={colors.cyanLight} />
              <StatCard icon={<CheckCircle2 color={colors.success} size={19} />} label="Completed Today" value={summary.completedTodayCount} color={colors.success} />
              <StatCard icon={<XCircle color={colors.danger} size={19} />} label="Cancelled" value={summary.cancelledCount} color={colors.danger} />
            </View>
          </FadeSlideIn>
        )}

        {!loading && <AppointmentNotifications appointments={appointments} />}

        {!loading && !showOnboardingEmpty && (
          <FadeSlideIn delay={120}>
            <AppointmentFiltersBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onChangeFilter={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            />
          </FadeSlideIn>
        )}

        {loading && <AppointmentSkeleton count={4} />}

        {showOnboardingEmpty && <AppointmentEmptyState onCreate={() => setCreating(true)} />}

        {!loading && !showOnboardingEmpty && (
          <FadeSlideIn delay={160}>
            <View style={[styles.mainRow, !isDesktop && styles.mainRowStacked]}>
              <View style={{ flex: isDesktop ? 2 : undefined }}>
                {showNoResults ? (
                  <View style={styles.noResultsWrap}>
                    <Text style={styles.noResultsTxt}>No appointments match your current search/filters.</Text>
                  </View>
                ) : (
                  <CalendarView appointments={filteredAppointments} onSelectAppointment={setSelectedAppointment} />
                )}
              </View>
              {isDesktop && (
                <TodaySchedulePanel
                  appointments={filteredAppointments}
                  onSelectAppointment={setSelectedAppointment}
                  style={{ flex: 1, maxWidth: 340 }}
                />
              )}
            </View>
          </FadeSlideIn>
        )}
      </ScrollView>

      {isMobile && (
        <PressableScale onPress={() => setCreating(true)} style={styles.fabWrap} innerStyle={styles.fab} scaleTo={0.9}>
          <Plus color="#fff" size={24} />
        </PressableScale>
      )}

      <Modal visible={scheduleModalVisible && !isDesktop} transparent animationType="fade" onRequestClose={() => setScheduleModalVisible(false)}>
        <View style={styles.scheduleBackdrop}>
          <View style={styles.scheduleModalCard}>
            <View style={styles.scheduleModalHeader}>
              <Text style={styles.scheduleModalTitle}>Today's Schedule</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <X color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>
            <TodaySchedulePanel
              appointments={filteredAppointments}
              onSelectAppointment={(a) => { setScheduleModalVisible(false); setSelectedAppointment(a); }}
              style={{ maxWidth: '100%' }}
            />
          </View>
        </View>
      </Modal>

      <AppointmentDetailSheet
        visible={!!selectedAppointment}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdateStatus={updateAppointmentStatus}
        onEdit={(a) => { setSelectedAppointment(null); setEditing(a); }}
      />

      <NewAppointmentSheet
        visible={creating}
        initial={null}
        onCancel={() => setCreating(false)}
        onSave={handleSaveNew}
      />

      <NewAppointmentSheet
        visible={!!editing}
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 50, paddingBottom: 100 },
  orbA: {
    position: 'absolute', top: -30, right: -60, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: colors.cyanLight, marginBottom: spacing.sm, textTransform: 'uppercase' },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { color: colors.textMuted, fontSize: typography.body.fontSize, marginTop: 4, maxWidth: 460 },
  headerBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radii.sm, paddingVertical: 12, paddingHorizontal: spacing.lg,
  },
  primaryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: radii.sm, paddingVertical: 12, paddingHorizontal: spacing.lg,
  },
  ghostBtnTxt: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  mainRow: { flexDirection: 'row', gap: spacing.lg },
  mainRowStacked: { flexDirection: 'column' },
  noResultsWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  noResultsTxt: { color: colors.textMuted, fontSize: typography.body.fontSize },

  fabWrap: { position: 'absolute', right: spacing.xl, bottom: spacing.xl },
  fab: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },

  scheduleBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  scheduleModalCard: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg,
    borderWidth: 1, borderColor: colors.glassBorder, borderBottomWidth: 0, padding: spacing.lg, maxHeight: '85%',
  },
  scheduleModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  scheduleModalTitle: { ...typography.h3, color: colors.textPrimary },
});
