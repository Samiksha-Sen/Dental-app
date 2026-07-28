import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ShieldAlert, FileText, ImageIcon, UserRound, X } from 'lucide-react-native';
import GlassCard from '../../../src/components/GlassCard';
import StatCard from '../../../src/components/StatCard';
import Badge from '../../../src/components/Badge';
import FadeSlideIn from '../../../src/animations/FadeSlideIn';
import DetailPageHeader from '../../../src/components/dashboard/DetailPageHeader';
import DetailFiltersBar from '../../../src/components/dashboard/DetailFiltersBar';
import DetailSkeleton from '../../../src/components/dashboard/DetailSkeleton';
import DetailEmptyState from '../../../src/components/dashboard/DetailEmptyState';
import { useSevereCariesCases } from '../../../src/hooks/useSevereCariesCases';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';

const DOCTORS = ['Dr. Meera Nair', 'Dr. Arjun Rao', 'Dr. Kavya Singh', 'Dr. Rohan Gupta', 'Dr. Priya Desai'];
const TREATMENT_STATUSES = ['Pending Treatment', 'Scheduled', 'In Progress', 'Resolved'];
const SEVERITY_OPTIONS = ['High', 'Normal'];
const DATE_OPTIONS = ['All Dates', 'Today', 'This Week', 'This Month'];

function matchesDate(rawDate, filter) {
  if (!filter || filter === 'All') return true;
  if (!rawDate) return false;
  const now = new Date();
  const d = new Date(rawDate);
  if (filter === 'Today') return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  if (filter === 'This Week') { const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7); return d >= weekAgo && d <= now; }
  if (filter === 'This Month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  return true;
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SevereCariesPage() {
  const { cases, loading } = useSevereCariesCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ severity: 'All', doctor: 'All', treatmentStatus: 'All', date: 'All' });
  const [xrayPreview, setXrayPreview] = useState(null);
  const [detailCase, setDetailCase] = useState(null);

  const filterDefs = [
    { key: 'severity', label: 'Severity', options: SEVERITY_OPTIONS },
    { key: 'doctor', label: 'Doctor', options: DOCTORS },
    { key: 'treatmentStatus', label: 'Treatment Status', options: TREATMENT_STATUSES },
    { key: 'date', label: 'Date', options: DATE_OPTIONS },
  ];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cases.filter((c) => {
      if (q && !`${c.patientName} ${c.patientCode}`.toLowerCase().includes(q)) return false;
      if (filters.severity !== 'All' && c.severity !== filters.severity) return false;
      if (filters.doctor !== 'All' && c.doctor !== filters.doctor) return false;
      if (filters.treatmentStatus !== 'All' && c.treatmentStatus !== filters.treatmentStatus) return false;
      if (!matchesDate(c.diagnosisDateRaw, filters.date)) return false;
      return true;
    });
  }, [cases, searchQuery, filters]);

  const handleOpenPatient = (c) => router.push({ pathname: '/(portal)/patients', params: { name: c.patientName } });

  const handleGenerateReport = (c) => {
    if (Platform.OS !== 'web') { alert('Generating reports is available from the web version of the portal.'); return; }
    const text = [
      'DentalAI — Severe Caries Case Report',
      `Patient: ${c.patientName} (${c.patientCode})`,
      `Age: ${c.age != null ? c.age : 'N/A'}`,
      `Phone: ${c.phone || 'N/A'}`,
      `Affected Teeth: ${c.affectedTeeth}`,
      `AI Confidence: ${c.confidence != null ? Math.round(c.confidence) + '%' : 'N/A'}`,
      `Diagnosis Date: ${c.diagnosisDate}`,
      `Assigned Doctor: ${c.doctor}`,
      `Treatment Status: ${c.treatmentStatus}`,
      `Clinical Notes: ${c.description}`,
    ].join('\n');
    downloadTextFile(`severe-caries-report-${c.patientCode}.txt`, text);
  };

  const showEmpty = !loading && cases.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <FadeSlideIn>
        <DetailPageHeader
          crumb="Severe Caries"
          title="Severe Caries Cases"
          subtitle="Patients currently flagged Urgent Care following an AI-detected caries diagnosis."
        />
      </FadeSlideIn>

      {loading ? (
        <View style={{ marginBottom: spacing.lg }}><StatCard icon={<ShieldAlert color={colors.danger} size={19} />} label="Total Severe Cases" value={0} color={colors.danger} /></View>
      ) : (
        <FadeSlideIn delay={60}>
          <View style={styles.statsRow}>
            <StatCard icon={<ShieldAlert color={colors.danger} size={19} />} label="Total Severe Cases" value={cases.length} color={colors.danger} />
          </View>
        </FadeSlideIn>
      )}

      {!loading && !showEmpty && (
        <FadeSlideIn delay={100}>
          <DetailFiltersBar
            searchPlaceholder="Search by patient name or patient ID..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterDefs={filterDefs}
            filters={filters}
            onChangeFilter={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
          />
        </FadeSlideIn>
      )}

      {loading && <DetailSkeleton count={5} />}

      {showEmpty && (
        <DetailEmptyState Icon={ShieldAlert} title="No Severe Cases" subtitle="Patients flagged with a caries diagnosis will appear here for urgent follow-up." />
      )}

      {!loading && !showEmpty && (
        filtered.length === 0 ? (
          <View style={styles.noResultsWrap}><Text style={styles.noResultsTxt}>No cases match your current search/filters.</Text></View>
        ) : (
          <FadeSlideIn delay={140}>
            <View style={{ gap: spacing.sm }}>
              {filtered.map((c) => (
                <GlassCard key={c.patientDbId} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <View style={{ flex: 1, minWidth: 160 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text style={styles.patientName} numberOfLines={1}>{c.patientName}</Text>
                        <Badge badge={c.badge} label={c.status} />
                      </View>
                      <Text style={styles.metaTxt}>
                        {c.patientCode}{c.age != null ? ` · ${c.age} yrs` : ''}{c.phone ? ` · ${c.phone}` : ''} · Teeth: {c.affectedTeeth}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.confTxt}>{c.confidence != null ? `${Math.round(c.confidence)}% AI confidence` : 'No confidence recorded'}</Text>
                      <Text style={styles.metaTxt}>{c.diagnosisDate}</Text>
                    </View>
                  </View>
                  <Text style={styles.subMetaTxt}>{c.doctor} · {c.treatmentStatus}</Text>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setDetailCase(c)}>
                      <FileText color={colors.primary} size={14} /><Text style={styles.actionTxt}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, !c.imageUrl && styles.actionBtnDisabled]}
                      onPress={() => c.imageUrl ? setXrayPreview(c) : alert('No X-ray image linked to this diagnosis.')}
                    >
                      <ImageIcon color={colors.primary} size={14} /><Text style={styles.actionTxt}>View X-ray</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleGenerateReport(c)}>
                      <FileText color={colors.primary} size={14} /><Text style={styles.actionTxt}>Generate Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenPatient(c)}>
                      <UserRound color={colors.primary} size={14} /><Text style={styles.actionTxt}>Open Patient</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}
            </View>
          </FadeSlideIn>
        )
      )}

      <Modal visible={!!xrayPreview} transparent animationType="fade" onRequestClose={() => setXrayPreview(null)}>
        <View style={styles.previewBackdrop}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setXrayPreview(null)}><X color="#fff" size={22} /></TouchableOpacity>
          {xrayPreview && <Image source={{ uri: xrayPreview.imageUrl }} style={styles.previewImage} resizeMode="contain" />}
        </View>
      </Modal>

      <Modal visible={!!detailCase} transparent animationType="fade" onRequestClose={() => setDetailCase(null)}>
        <View style={styles.reportBackdrop}>
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Case Details</Text>
              <TouchableOpacity onPress={() => setDetailCase(null)}><X color={colors.textMuted} size={18} /></TouchableOpacity>
            </View>
            {detailCase && (
              <>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Patient: </Text>{detailCase.patientName} ({detailCase.patientCode})</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Age: </Text>{detailCase.age != null ? detailCase.age : 'N/A'}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Phone: </Text>{detailCase.phone || 'N/A'}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Affected Teeth: </Text>{detailCase.affectedTeeth}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>AI Confidence: </Text>{detailCase.confidence != null ? `${Math.round(detailCase.confidence)}%` : 'N/A'}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Diagnosis Date: </Text>{detailCase.diagnosisDate}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Doctor: </Text>{detailCase.doctor}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Treatment Status: </Text>{detailCase.treatmentStatus}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Notes: </Text>{detailCase.description}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 50, paddingBottom: 60 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' },
  noResultsWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  noResultsTxt: { color: colors.textMuted, fontSize: typography.body.fontSize },
  rowCard: { padding: spacing.md },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  patientName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  metaTxt: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  subMetaTxt: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: spacing.sm },
  confTxt: { color: colors.danger, fontWeight: '700', fontSize: typography.caption.fontSize },
  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionTxt: { color: colors.primary, fontSize: 11, fontWeight: '700' },

  previewBackdrop: { flex: 1, backgroundColor: 'rgba(11,18,32,0.95)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  previewClose: { position: 'absolute', top: 50, right: spacing.xl, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '80%' },

  reportBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  reportCard: { width: '100%', maxWidth: 420, backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.xl },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  reportTitle: { ...typography.h3, color: colors.textPrimary },
  reportLine: { color: colors.textSecondary, fontSize: typography.body.fontSize, marginBottom: spacing.sm, lineHeight: 20 },
  reportLabel: { fontWeight: '700', color: colors.textPrimary },
});
