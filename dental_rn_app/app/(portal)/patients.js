import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Search, Plus, X, User } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import GlassCard from '../../src/components/GlassCard';
import GradientButton from '../../src/components/GradientButton';
import Badge from '../../src/components/Badge';
import PressableScale from '../../src/components/PressableScale';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import SuccessCheckmark from '../../src/animations/SuccessCheckmark';
import { usePatients } from '../../src/hooks/usePatients';
import { colors, gradients, radii, spacing, typography } from '../../src/theme/tokens';

const STATUS_OPTIONS = ['Healthy Clear', 'Pending', 'Urgent Care'];

function PatientCard({ p, expanded, onPress }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} innerStyle={styles.patientCard}>
      <View style={styles.patientTop}>
        <Text style={styles.patientName}>{p.name}</Text>
        <Badge badge={p.badge} label={p.status} />
      </View>
      <Text style={styles.patientMeta}>Patient ID: {p.id}</Text>

      <AnimatePresence>
        {expanded && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'timing', duration: 260 }}
            style={styles.timeline}
          >
            <Text style={styles.label}>EHR Diagnostic details</Text>
            <Text style={styles.descText}>{p.desc}</Text>

            {p.history && p.history.map((h, hidx) => (
              <FadeSlideIn key={hidx} delay={hidx * 60} from={8}>
                <View style={styles.timelineNode}>
                  <View style={[styles.timeDot, { backgroundColor: h.type === 'caries' ? colors.danger : colors.success }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timeDate}>{h.date}</Text>
                    <Text style={styles.timeTitle}>{h.title}</Text>
                    {h.imageUrl && (
                      <Image source={{ uri: h.imageUrl }} style={styles.timeThumb} resizeMode="cover" />
                    )}
                  </View>
                </View>
              </FadeSlideIn>
            ))}
          </MotiView>
        )}
      </AnimatePresence>
    </PressableScale>
  );
}

export default function Patients() {
  const params = useLocalSearchParams();
  const { patients, patientsLoaded, patientsError, createPatient } = usePatients();

  const [patientSearch, setPatientSearch] = useState('');
  const [activePatientName, setActivePatientName] = useState(params.name || '');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');
  const [newPatientStatus, setNewPatientStatus] = useState('Healthy Clear');
  const [formVisible, setFormVisible] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()));

  const handleSaveNewPatient = async () => {
    const { error } = await createPatient({
      name: newPatientName,
      allergies: newPatientAllergies,
      status: newPatientStatus,
    });
    if (error) {
      alert(`Error: Failed to register patient — ${error.message}`);
      return;
    }
    alert(`Success: Registered patient ${newPatientName.trim()}!`);
    setNewPatientName('');
    setNewPatientAllergies('');
    setNewPatientStatus('Healthy Clear');
  };

  const onSave = async () => {
    if (!newPatientName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    await handleSaveNewPatient();
    setFormVisible(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <FadeSlideIn>
        <Text style={styles.title}>Patient Directory</Text>
        {!patientsLoaded && <Text style={styles.loadingTxt}>Loading patients…</Text>}
        {patientsError && <Text style={styles.errorTxt}>Failed to load patients: {patientsError}</Text>}

        <View style={styles.searchRow}>
          <Search color={colors.textMuted} size={16} style={{ marginLeft: spacing.md }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name..."
            placeholderTextColor={colors.textMuted}
            value={patientSearch}
            onChangeText={setPatientSearch}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setFormVisible(true)}>
          <Plus color="#fff" size={16} />
          <Text style={styles.addBtnTxt}>Add New Patient</Text>
        </TouchableOpacity>

        {justSaved && (
          <View style={styles.savedRow}>
            <SuccessCheckmark size={40} />
            <Text style={styles.savedTxt}>Patient registered</Text>
          </View>
        )}
      </FadeSlideIn>

      <View style={{ marginTop: spacing.md }}>
        {filtered.map((p, idx) => (
          <FadeSlideIn key={p.dbId || idx} delay={idx * 40}>
            <PatientCard
              p={p}
              expanded={activePatientName === p.name}
              onPress={() => setActivePatientName(activePatientName === p.name ? '' : p.name)}
            />
          </FadeSlideIn>
        ))}
      </View>

      <Modal visible={formVisible} transparent animationType="none" onRequestClose={() => setFormVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <MotiView
            from={{ translateY: 400, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            style={styles.sheet}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Register New Patient</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <X color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Patient Full Name</Text>
              <TextInput
                style={styles.input}
                value={newPatientName}
                onChangeText={setNewPatientName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Allergies / Special Notes</Text>
              <TextInput
                style={styles.input}
                value={newPatientAllergies}
                onChangeText={setNewPatientAllergies}
                placeholder="e.g. Penicillin, Sulfa Drugs, None"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Initial Diagnosis Status</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((status) => {
                  const isSel = newPatientStatus === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusChip, isSel && styles.statusChipActive]}
                      onPress={() => setNewPatientStatus(status)}
                    >
                      <Text style={[styles.statusChipTxt, isSel && styles.statusChipTxtActive]}>{status}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <GradientButton
                title="Save Patient Profile"
                icon={<User color="#fff" size={16} />}
                onPress={onSave}
                colorsOverride={gradients.success}
                style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}
              />
            </ScrollView>
          </MotiView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 50, paddingBottom: 24 },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  loadingTxt: { color: colors.textMuted, marginBottom: spacing.sm },
  errorTxt: { color: colors.danger, marginBottom: spacing.sm },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.sm, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, height: 46, paddingHorizontal: spacing.sm, color: colors.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radii.sm, paddingVertical: 12, marginBottom: spacing.sm,
  },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  savedTxt: { color: colors.success, fontWeight: '700' },

  patientCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: radii.md, padding: spacing.lg, marginBottom: spacing.md,
  },
  patientTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  patientName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  patientMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  timeline: { alignSelf: 'stretch', marginTop: spacing.md, overflow: 'hidden' },
  label: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: 6 },
  descText: { color: colors.textSecondary, fontSize: 13 },
  timelineNode: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  timeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  timeDate: { color: colors.textMuted, fontSize: 10 },
  timeTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  timeThumb: { width: 96, height: 96, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.glassBorder, marginTop: spacing.sm },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgCard, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg,
    borderWidth: 1, borderColor: colors.glassBorder, borderBottomWidth: 0,
    padding: spacing.xl, maxHeight: '85%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { ...typography.h3, color: colors.textPrimary },
  input: {
    height: 46, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill, paddingHorizontal: spacing.md, color: colors.textPrimary,
  },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusChip: {
    flex: 1, paddingVertical: 10, borderRadius: radii.sm, backgroundColor: colors.glassFill,
    borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center',
  },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipTxt: { color: colors.textSecondary, fontSize: 11 },
  statusChipTxtActive: { color: '#fff', fontWeight: '700' },
});
