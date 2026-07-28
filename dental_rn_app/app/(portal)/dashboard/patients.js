import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Users as UsersIcon, UserRound, FileText, ImageIcon, CalendarDays, Search, X } from 'lucide-react-native';
import GlassCard from '../../../src/components/GlassCard';
import StatCard from '../../../src/components/StatCard';
import Badge from '../../../src/components/Badge';
import PatientAvatar from '../../../src/components/appointments/PatientAvatar';
import FadeSlideIn from '../../../src/animations/FadeSlideIn';
import DetailPageHeader from '../../../src/components/dashboard/DetailPageHeader';
import DetailSkeleton from '../../../src/components/dashboard/DetailSkeleton';
import DetailEmptyState from '../../../src/components/dashboard/DetailEmptyState';
import { useTrackedPatients } from '../../../src/hooks/useTrackedPatients';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';

export default function PatientsTrackedPage() {
  const { trackedPatients, loading } = useTrackedPatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [reportsPatient, setReportsPatient] = useState(null);
  const [xraysPatient, setXraysPatient] = useState(null);
  const [xrayPreview, setXrayPreview] = useState(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trackedPatients;
    return trackedPatients.filter((p) => `${p.patientName} ${p.patientCode}`.toLowerCase().includes(q));
  }, [trackedPatients, searchQuery]);

  const handleOpenProfile = (p) => router.push({ pathname: '/(portal)/patients', params: { name: p.patientName } });
  const handleAppointments = () => router.push('/(portal)/appointments');

  const showEmpty = !loading && trackedPatients.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <FadeSlideIn>
        <DetailPageHeader crumb="Patients" title="Patients" subtitle="Every patient currently tracked in your clinical roster." />
      </FadeSlideIn>

      {loading ? (
        <View style={{ marginBottom: spacing.lg }}><StatCard icon={<UsersIcon color={colors.cyanLight} size={19} />} label="Patients Tracked" value={0} color={colors.cyanLight} /></View>
      ) : (
        <FadeSlideIn delay={60}>
          <View style={styles.statsRow}>
            <StatCard icon={<UsersIcon color={colors.cyanLight} size={19} />} label="Patients Tracked" value={trackedPatients.length} color={colors.cyanLight} />
          </View>
        </FadeSlideIn>
      )}

      {!loading && !showEmpty && (
        <FadeSlideIn delay={100}>
          <View style={styles.searchRow}>
            <Search color={colors.textMuted} size={16} style={{ marginLeft: spacing.md }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by patient name or patient ID..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </FadeSlideIn>
      )}

      {loading && <DetailSkeleton count={6} />}

      {showEmpty && (
        <DetailEmptyState Icon={UsersIcon} title="No Patients Tracked" subtitle="Patients registered from the Patients tab will appear here." />
      )}

      {!loading && !showEmpty && (
        filtered.length === 0 ? (
          <View style={styles.noResultsWrap}><Text style={styles.noResultsTxt}>No patients match your search.</Text></View>
        ) : (
          <FadeSlideIn delay={140}>
            <View style={{ gap: spacing.sm }}>
              {filtered.map((p) => (
                <GlassCard key={p.patientDbId} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <PatientAvatar name={p.patientName} size={48} />
                    <View style={{ flex: 1, minWidth: 160 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text style={styles.patientName} numberOfLines={1}>{p.patientName}</Text>
                        <Badge badge={p.badge} label={p.status} />
                      </View>
                      <Text style={styles.metaTxt}>{p.patientCode} · {p.age} yrs · {p.gender} · {p.phone}</Text>
                      <Text style={styles.metaTxt}>Last visit: {p.lastVisit} · {p.totalXrays} X-ray{p.totalXrays === 1 ? '' : 's'}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenProfile(p)}>
                      <UserRound color={colors.primary} size={14} /><Text style={styles.actionTxt}>Open Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setReportsPatient(p)}>
                      <FileText color={colors.primary} size={14} /><Text style={styles.actionTxt}>View Reports</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setXraysPatient(p)}>
                      <ImageIcon color={colors.primary} size={14} /><Text style={styles.actionTxt}>View X-rays</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleAppointments}>
                      <CalendarDays color={colors.primary} size={14} /><Text style={styles.actionTxt}>Appointments</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}
            </View>
          </FadeSlideIn>
        )
      )}

      <Modal visible={!!reportsPatient} transparent animationType="fade" onRequestClose={() => setReportsPatient(null)}>
        <View style={styles.reportBackdrop}>
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{reportsPatient?.patientName}'s Reports</Text>
              <TouchableOpacity onPress={() => setReportsPatient(null)}><X color={colors.textMuted} size={18} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {reportsPatient?.scans.length === 0 && <Text style={styles.reportLine}>No scans recorded for this patient yet.</Text>}
              {reportsPatient?.scans.map((s) => (
                <View key={s.id} style={styles.reportItem}>
                  <Text style={styles.reportLine}><Text style={styles.reportLabel}>Diagnosis: </Text>{s.diagnosis}{s.confidence != null ? ` (${Math.round(s.confidence)}%)` : ''}</Text>
                  <Text style={styles.reportLine}><Text style={styles.reportLabel}>Severity: </Text>{s.report?.severity || 'Not recorded'}</Text>
                  <Text style={styles.reportLine}><Text style={styles.reportLabel}>Recommendation: </Text>{s.report?.recommendation || 'None recorded'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!xraysPatient} transparent animationType="fade" onRequestClose={() => setXraysPatient(null)}>
        <View style={styles.reportBackdrop}>
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{xraysPatient?.patientName}'s X-rays</Text>
              <TouchableOpacity onPress={() => setXraysPatient(null)}><X color={colors.textMuted} size={18} /></TouchableOpacity>
            </View>
            {xraysPatient?.scans.length === 0 ? (
              <Text style={styles.reportLine}>No X-rays uploaded for this patient yet.</Text>
            ) : (
              <View style={styles.thumbGrid}>
                {xraysPatient?.scans.map((s) => (
                  <TouchableOpacity key={s.id} onPress={() => setXrayPreview(s)}>
                    <Image source={{ uri: s.imageUrl }} style={styles.thumb} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!xrayPreview} transparent animationType="fade" onRequestClose={() => setXrayPreview(null)}>
        <View style={styles.previewBackdrop}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setXrayPreview(null)}><X color="#fff" size={22} /></TouchableOpacity>
          {xrayPreview && <Image source={{ uri: xrayPreview.imageUrl }} style={styles.previewImage} resizeMode="contain" />}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 50, paddingBottom: 60 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.sm, marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, height: 46, paddingHorizontal: spacing.sm, color: colors.textPrimary },
  noResultsWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  noResultsTxt: { color: colors.textMuted, fontSize: typography.body.fontSize },
  rowCard: { padding: spacing.md },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  patientName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  metaTxt: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  actionTxt: { color: colors.primary, fontSize: 11, fontWeight: '700' },

  reportBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  reportCard: { width: '100%', maxWidth: 420, backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.xl },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  reportTitle: { ...typography.h3, color: colors.textPrimary, flexShrink: 1 },
  reportItem: { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  reportLine: { color: colors.textSecondary, fontSize: typography.body.fontSize, marginBottom: 4, lineHeight: 20 },
  reportLabel: { fontWeight: '700', color: colors.textPrimary },
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { width: 76, height: 76, borderRadius: radii.sm },

  previewBackdrop: { flex: 1, backgroundColor: 'rgba(11,18,32,0.95)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  previewClose: { position: 'absolute', top: 50, right: spacing.xl, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '80%' },
});
