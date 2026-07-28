import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, Platform, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import { X, CloudUpload, ImagePlus } from 'lucide-react-native';
import GradientButton from '../GradientButton';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function UploadXraySheet({ visible, patients, onCancel, onUpload, uploading }) {
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [imageUri, setImageUri] = useState(null);

  const reset = () => { setSelectedPatientName(''); setImageUri(null); };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert('Permission to access media library is required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled && result.assets?.length) setImageUri(result.assets[0].uri);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setImageUri(URL.createObjectURL(file));
  };

  const triggerPick = () => {
    if (Platform.OS === 'web') document.getElementById('gallery-upload-input')?.click();
    else pickImage();
  };

  const handleUpload = async () => {
    if (!imageUri) { alert('Please select an X-ray image first.'); return; }
    const target = patients.find((p) => p.name === selectedPatientName);
    await onUpload({ imageUri, patientId: target?.dbId || null });
    reset();
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
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ImagePlus color={colors.primaryPurple} size={19} />
              <Text style={styles.title}>Upload X-ray</Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onCancel(); }}><X color={colors.textMuted} size={20} /></TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={styles.label}>Assign to Patient (optional)</Text>
            <View style={styles.chipWrap}>
              {patients.map((p) => {
                const active = selectedPatientName === p.name;
                return (
                  <TouchableOpacity
                    key={p.dbId}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedPatientName(active ? '' : p.name)}
                  >
                    <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.dropzone} onPress={triggerPick}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <>
                  <CloudUpload color={colors.primary} size={28} />
                  <Text style={styles.dropzoneTitle}>Select X-ray Image</Text>
                  <Text style={styles.dropzoneDesc}>Tap to choose a PNG/JPG file from your device</Text>
                </>
              )}
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <input id="gallery-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
            )}

            <GradientButton
              title="Upload X-ray"
              icon={<CloudUpload color="#fff" size={17} />}
              onPress={handleUpload}
              loading={uploading}
              style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
            />
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
    padding: spacing.xl, maxHeight: '88%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.h3, color: colors.textPrimary },
  label: { fontSize: typography.label.fontSize, color: colors.textMuted, marginBottom: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radii.pill,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTxtActive: { color: '#fff', fontWeight: '700' },
  dropzone: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.glassBorder,
    borderRadius: radii.lg, alignItems: 'center', padding: spacing.xl, overflow: 'hidden', minHeight: 160, justifyContent: 'center',
  },
  preview: { width: '100%', height: 160, borderRadius: radii.sm },
  dropzoneTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize, marginTop: spacing.sm },
  dropzoneDesc: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 4, textAlign: 'center' },
});
