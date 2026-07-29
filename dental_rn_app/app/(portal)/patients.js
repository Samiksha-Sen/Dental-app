import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Search, Plus, X, User, Phone, Pencil, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import GlassCard from '../../src/components/GlassCard';
import GradientButton from '../../src/components/GradientButton';
import Badge from '../../src/components/Badge';
import PressableScale from '../../src/components/PressableScale';
import ConfirmModal from '../../src/components/ConfirmModal';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import SuccessCheckmark from '../../src/animations/SuccessCheckmark';
import { usePatients } from '../../src/hooks/usePatients';
import { colors, gradients, radii, spacing, typography } from '../../src/theme/tokens';

const STATUS_OPTIONS = ['Healthy Clear', 'Pending', 'Urgent Care'];

function PatientCard({ p, expanded, onPress, onEdit, onDelete }) {
  return (
    <PressableScale testID={`patient-card-${p.dbId || p.id}`} onPress={onPress} scaleTo={0.985} innerStyle={styles.patientCard}>
      <View style={styles.patientTop}>
        <Text style={styles.patientName}>{p.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Badge badge={p.badge} label={p.status} />
          <TouchableOpacity
            style={styles.editBtn}
            onPress={(e) => { e.stopPropagation?.(); onEdit(p); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Pencil color={colors.textMuted} size={14} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={(e) => { e.stopPropagation?.(); onDelete(p); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 color={colors.danger} size={14} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.patientMeta}>
        Patient ID: {p.id}{p.age != null ? ` · Age: ${p.age}` : ''}{p.phone ? ` · Phone: ${p.phone}` : ''}
      </Text>

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
  const { patients, patientsLoaded, patientsError, createPatient, updatePatient, deletePatient } = usePatients();

  const [patientSearch, setPatientSearch] = useState('');
  const [activePatientName, setActivePatientName] = useState(params.name || '');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientPhoneError, setNewPatientPhoneError] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientAgeError, setNewPatientAgeError] = useState('');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');
  const [newPatientStatus, setNewPatientStatus] = useState('Healthy Clear');
  const [formVisible, setFormVisible] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [editingPatient, setEditingPatient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoneError, setEditPhoneError] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editAgeError, setEditAgeError] = useState('');

  const [pendingDelete, setPendingDelete] = useState(null);

  const PHONE_INVALID_MSG = 'Please enter a valid 10-digit mobile number.';
  const AGE_INVALID_MSG = 'Please enter a valid age.';

  const filtered = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.phone || '').includes(patientSearch.replace(/\s/g, ''))
    );
  });

  const handleSaveNewPatient = async () => {
    const { error } = await createPatient({
      name: newPatientName,
      phone: newPatientPhone,
      age: newPatientAge,
      allergies: newPatientAllergies,
      status: newPatientStatus,
    });
    if (error) {
      alert(`Error: Failed to register patient — ${error.message}`);
      return;
    }
    alert(`Success: Registered patient ${newPatientName.trim()}!`);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientPhoneError('');
    setNewPatientAge('');
    setNewPatientAgeError('');
    setNewPatientAllergies('');
    setNewPatientStatus('Healthy Clear');
  };

  const onChangeNewPatientPhone = (v) => {
    const digitsOnly = v.replace(/[^0-9]/g, '').slice(0, 10);
    setNewPatientPhone(digitsOnly);
    if (newPatientPhoneError) setNewPatientPhoneError('');
  };

  const onChangeNewPatientAge = (v) => {
    const digitsOnly = v.replace(/[^0-9]/g, '').slice(0, 3);
    setNewPatientAge(digitsOnly);
    if (newPatientAgeError) setNewPatientAgeError('');
  };

  const onSave = async () => {
    if (!newPatientName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (!/^\d{10}$/.test(newPatientPhone)) {
      setNewPatientPhoneError(PHONE_INVALID_MSG);
      return;
    }
    const ageNum = Number(newPatientAge);
    if (!newPatientAge || Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 119) {
      setNewPatientAgeError(AGE_INVALID_MSG);
      return;
    }
    await handleSaveNewPatient();
    setFormVisible(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const onOpenEdit = (p) => {
    setEditingPatient(p);
    setEditName(p.name);
    setEditPhone(p.phone || '');
    setEditPhoneError('');
    setEditAge(p.age != null ? String(p.age) : '');
    setEditAgeError('');
  };

  const onChangeEditPhone = (v) => {
    const digitsOnly = v.replace(/[^0-9]/g, '').slice(0, 10);
    setEditPhone(digitsOnly);
    if (editPhoneError) setEditPhoneError('');
  };

  const onChangeEditAge = (v) => {
    const digitsOnly = v.replace(/[^0-9]/g, '').slice(0, 3);
    setEditAge(digitsOnly);
    if (editAgeError) setEditAgeError('');
  };

  const onSaveEdit = async () => {
    if (!editName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (!/^\d{10}$/.test(editPhone)) {
      setEditPhoneError(PHONE_INVALID_MSG);
      return;
    }
    const ageNum = Number(editAge);
    if (!editAge || Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 119) {
      setEditAgeError(AGE_INVALID_MSG);
      return;
    }
    const { error } = await updatePatient(editingPatient.dbId, { name: editName, phone: editPhone, age: editAge });
    if (error) {
      alert(`Error: Failed to update patient — ${error.message}`);
      return;
    }
    setEditingPatient(null);
  };

  const onConfirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    const { error } = await deletePatient(target.dbId);
    if (error) {
      alert(`Error: Failed to delete patient — ${error.message}`);
    }
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
            testID="patients-search-input"
            style={styles.searchInput}
            placeholder="Search by name, Patient ID, or phone..."
            placeholderTextColor={colors.textMuted}
            value={patientSearch}
            onChangeText={setPatientSearch}
          />
        </View>

        <TouchableOpacity testID="patients-add-new-button" style={styles.addBtn} onPress={() => setFormVisible(true)}>
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
              onEdit={onOpenEdit}
              onDelete={setPendingDelete}
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
                testID="patient-form-name-input"
                style={styles.input}
                value={newPatientName}
                onChangeText={setNewPatientName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.phoneInputRow, newPatientPhoneError && styles.phoneInputRowError]}>
                <Phone color={colors.textMuted} size={16} />
                <TextInput
                  testID="patient-form-phone-input"
                  style={styles.phoneInput}
                  value={newPatientPhone}
                  onChangeText={onChangeNewPatientPhone}
                  placeholder="Enter patient's 10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              {!!newPatientPhoneError && <Text style={styles.fieldErrorTxt}>{newPatientPhoneError}</Text>}

              <Text style={styles.label}>Age</Text>
              <TextInput
                testID="patient-form-age-input"
                style={[styles.input, newPatientAgeError && styles.inputError]}
                value={newPatientAge}
                onChangeText={onChangeNewPatientAge}
                placeholder="Enter patient's age"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={3}
              />
              {!!newPatientAgeError && <Text style={styles.fieldErrorTxt}>{newPatientAgeError}</Text>}

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
                testID="patient-form-save-button"
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

      <Modal visible={!!editingPatient} transparent animationType="none" onRequestClose={() => setEditingPatient(null)}>
        <View style={styles.sheetBackdrop}>
          <MotiView
            from={{ translateY: 400, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            style={styles.sheet}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Patient</Text>
              <TouchableOpacity onPress={() => setEditingPatient(null)}>
                <X color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Patient Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.phoneInputRow, editPhoneError && styles.phoneInputRowError]}>
                <Phone color={colors.textMuted} size={16} />
                <TextInput
                  style={styles.phoneInput}
                  value={editPhone}
                  onChangeText={onChangeEditPhone}
                  placeholder="Enter patient's 10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              {!!editPhoneError && <Text style={styles.fieldErrorTxt}>{editPhoneError}</Text>}

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[styles.input, editAgeError && styles.inputError]}
                value={editAge}
                onChangeText={onChangeEditAge}
                placeholder="Enter patient's age"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={3}
              />
              {!!editAgeError && <Text style={styles.fieldErrorTxt}>{editAgeError}</Text>}

              <GradientButton
                title="Save Changes"
                icon={<User color="#fff" size={16} />}
                onPress={onSaveEdit}
                colorsOverride={gradients.success}
                style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}
              />
            </ScrollView>
          </MotiView>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!pendingDelete}
        title="Delete this patient?"
        message={pendingDelete ? `This will permanently remove ${pendingDelete.name} (${pendingDelete.id}) and their EHR history. This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={onConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
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
  inputError: { borderColor: colors.danger },
  phoneInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    height: 46, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill, paddingHorizontal: spacing.md,
  },
  phoneInputRowError: { borderColor: colors.danger },
  phoneInput: { flex: 1, height: 46, color: colors.textPrimary },
  fieldErrorTxt: { color: colors.danger, fontSize: typography.caption.fontSize, marginTop: 4 },
  editBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.glassFillStrong,
    alignItems: 'center', justifyContent: 'center',
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
