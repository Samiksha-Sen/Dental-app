import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Layers, Eye, Download, ImageIcon, UserRound, X } from 'lucide-react-native';
import GlassCard from '../../../src/components/GlassCard';
import StatCard from '../../../src/components/StatCard';
import FadeSlideIn from '../../../src/animations/FadeSlideIn';
import DetailPageHeader from '../../../src/components/dashboard/DetailPageHeader';
import DetailFiltersBar from '../../../src/components/dashboard/DetailFiltersBar';
import DetailSkeleton from '../../../src/components/dashboard/DetailSkeleton';
import DetailEmptyState from '../../../src/components/dashboard/DetailEmptyState';
import Pagination from '../../../src/components/dashboard/Pagination';
import { useAiScanHistory } from '../../../src/hooks/useAiScanHistory';
import * as databaseService from '../../../src/services/databaseService';
import { colors, radii, spacing, typography } from '../../../src/theme/tokens';

const PAGE_SIZE = 10;
const DATE_OPTIONS = ['All Dates', 'Today', 'This Week', 'This Month'];
const DIAGNOSIS_OPTIONS = ['Caries Detected', 'No Caries Detected', 'Not Yet Analysed'];

function matchesDate(item, filter) {
  if (!filter || filter === 'All') return true;
  const now = new Date();
  const d = new Date(item.uploadedAt);
  if (filter === 'Today') return item.dateKey === now.toISOString().slice(0, 10);
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

export default function AiScanHistoryPage() {
  const { scans, loading, error } = useAiScanHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ patient: 'All', date: 'All', diagnosis: 'All' });
  const [sort, setSort] = useState('Newest First');
  const [page, setPage] = useState(1);
  const [xrayPreview, setXrayPreview] = useState(null);
  const [reportModal, setReportModal] = useState(null);

  const patientNames = useMemo(() => Array.from(new Set(scans.filter((s) => s.patientId).map((s) => s.patientName))).sort(), [scans]);

  const filterDefs = [
    { key: 'patient', label: 'Patient', options: patientNames },
    { key: 'date', label: 'Date', options: DATE_OPTIONS },
    { key: 'diagnosis', label: 'Diagnosis', options: DIAGNOSIS_OPTIONS },
  ];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = scans.filter((s) => {
      if (q && !`${s.patientName} ${s.patientCode}`.toLowerCase().includes(q)) return false;
      if (filters.patient !== 'All' && s.patientName !== filters.patient) return false;
      if (filters.diagnosis !== 'All' && s.diagnosis !== filters.diagnosis) return false;
      if (!matchesDate(s, filters.date)) return false;
      return true;
    });
    list = list.sort((a, b) => sort === 'Newest First' ? new Date(b.uploadedAt) - new Date(a.uploadedAt) : new Date(a.uploadedAt) - new Date(b.uploadedAt));
    return list;
  }, [scans, searchQuery, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleOpenPatient = (scan) => {
    if (!scan.patientId) { alert('This scan has no linked patient profile.'); return; }
    router.push({ pathname: '/(portal)/patients', params: { name: scan.patientName } });
  };

  const handleViewReport = async (scan) => {
    const { data } = await databaseService.getReportsByScan(scan.id);
    setReportModal({ scan, report: data?.[0] || null });
  };

  const handleDownloadReport = async (scan) => {
    if (Platform.OS !== 'web') { alert('Downloading is available from the web version of the portal.'); return; }
    const { data } = await databaseService.getReportsByScan(scan.id);
    const report = data?.[0];
    const text = [
      'DentalAI — Scan Report',
      `Patient: ${scan.patientName} (${scan.patientCode})`,
      `Age: ${scan.patientAge != null ? scan.patientAge : 'N/A'}`,
      `Phone: ${scan.patientPhone || 'N/A'}`,
      `Scan Date: ${scan.dateKey} ${scan.timeLabel}`,
      `Diagnosis: ${scan.diagnosis}`,
      `Confidence: ${scan.confidence != null ? Math.round(scan.confidence) + '%' : 'N/A'}`,
      `Status: ${scan.status}`,
      `Recommendation: ${report?.recommendation || 'No recommendation recorded.'}`,
    ].join('\n');
    downloadTextFile(`scan-report-${scan.id.slice(0, 8)}.txt`, text);
  };

  const showEmpty = !loading && scans.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <FadeSlideIn>
        <DetailPageHeader
          crumb="AI Scans"
          title="AI Scan History"
          subtitle="Every dental X-ray processed by the AI diagnostic models, across all patients."
        />
      </FadeSlideIn>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorTxt}>Failed to load scans: {error}</Text>
        </View>
      )}

      {loading ? (
        <View style={{ marginBottom: spacing.lg }}><StatCard icon={<Layers color={colors.primary} size={19} />} label="Total Scans" value={0} color={colors.primary} /></View>
      ) : (
        <FadeSlideIn delay={60}>
          <View style={styles.statsRow}>
            <StatCard icon={<Layers color={colors.primary} size={19} />} label="Total Scans" value={scans.length} color={colors.primary} />
          </View>
        </FadeSlideIn>
      )}

      {!loading && !showEmpty && (
        <FadeSlideIn delay={100}>
          <DetailFiltersBar
            searchPlaceholder="Search by patient name or patient ID..."
            searchQuery={searchQuery}
            onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
            filterDefs={filterDefs}
            filters={filters}
            onChangeFilter={(k, v) => { setFilters((prev) => ({ ...prev, [k]: v })); setPage(1); }}
            sort={sort}
            onChangeSort={(v) => { setSort(v); setPage(1); }}
            sortOptions={['Newest First', 'Oldest First']}
          />
        </FadeSlideIn>
      )}

      {loading && <DetailSkeleton count={6} />}

      {showEmpty && (
        <DetailEmptyState Icon={Layers} title="No AI Scans Yet" subtitle="Scans processed through the AI Analysis tab will appear here." />
      )}

      {!loading && !showEmpty && (
        filtered.length === 0 ? (
          <View style={styles.noResultsWrap}><Text style={styles.noResultsTxt}>No scans match your current search/filters.</Text></View>
        ) : (
          <FadeSlideIn delay={140}>
            <View style={{ gap: spacing.sm }}>
              {pageItems.map((scan) => (
                <GlassCard key={scan.id} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <View style={{ flex: 1, minWidth: 160 }}>
                      <Text style={styles.patientName} numberOfLines={1}>{scan.patientName}</Text>
                      <Text style={styles.metaTxt}>
                        {scan.patientCode}{scan.patientAge != null ? ` · ${scan.patientAge} yrs` : ''}{scan.patientPhone ? ` · ${scan.patientPhone}` : ''} · {scan.dateKey} · {scan.timeLabel}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.diagTxt, { color: scan.diagnosis === 'Caries Detected' ? colors.danger : scan.diagnosis === 'No Caries Detected' ? colors.success : colors.textMuted }]}>
                        {scan.diagnosis}
                      </Text>
                      <Text style={styles.metaTxt}>{scan.confidence != null ? `${Math.round(scan.confidence)}% confidence` : 'No confidence score'} · {scan.status}</Text>
                    </View>
                  </View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewReport(scan)}>
                      <Eye color={colors.primary} size={14} /><Text style={styles.actionTxt}>View Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownloadReport(scan)}>
                      <Download color={colors.primary} size={14} /><Text style={styles.actionTxt}>Download</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setXrayPreview(scan)}>
                      <ImageIcon color={colors.primary} size={14} /><Text style={styles.actionTxt}>View X-ray</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenPatient(scan)}>
                      <UserRound color={colors.primary} size={14} /><Text style={styles.actionTxt}>Open Patient</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}
            </View>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </FadeSlideIn>
        )
      )}

      <Modal visible={!!xrayPreview} transparent animationType="fade" onRequestClose={() => setXrayPreview(null)}>
        <View style={styles.previewBackdrop}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setXrayPreview(null)}><X color="#fff" size={22} /></TouchableOpacity>
          {xrayPreview && <Image source={{ uri: xrayPreview.imageUrl }} style={styles.previewImage} resizeMode="contain" />}
        </View>
      </Modal>

      <Modal visible={!!reportModal} transparent animationType="fade" onRequestClose={() => setReportModal(null)}>
        <View style={styles.reportBackdrop}>
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Scan Report</Text>
              <TouchableOpacity onPress={() => setReportModal(null)}><X color={colors.textMuted} size={18} /></TouchableOpacity>
            </View>
            {reportModal && (
              <>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Patient: </Text>{reportModal.scan.patientName} ({reportModal.scan.patientCode})</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Age: </Text>{reportModal.scan.patientAge != null ? reportModal.scan.patientAge : 'N/A'}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Phone: </Text>{reportModal.scan.patientPhone || 'N/A'}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Diagnosis: </Text>{reportModal.scan.diagnosis}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Confidence: </Text>{reportModal.scan.confidence != null ? `${Math.round(reportModal.scan.confidence)}%` : 'N/A'}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Severity: </Text>{reportModal.report?.severity || 'Not recorded'}</Text>
                <Text style={styles.reportLine}><Text style={styles.reportLabel}>Recommendation: </Text>{reportModal.report?.recommendation || 'No recommendation recorded for this scan.'}</Text>
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
  errorBanner: {
    backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)',
    borderRadius: radii.sm, padding: spacing.md, marginBottom: spacing.lg,
  },
  errorTxt: { color: colors.danger, fontSize: typography.caption.fontSize, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' },
  noResultsWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  noResultsTxt: { color: colors.textMuted, fontSize: typography.body.fontSize },
  rowCard: { padding: spacing.md },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  patientName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  metaTxt: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  diagTxt: { fontWeight: '700', fontSize: typography.caption.fontSize },
  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7,
  },
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
