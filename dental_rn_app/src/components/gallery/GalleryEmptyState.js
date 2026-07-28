import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ImagePlus } from 'lucide-react-native';
import { MotiView } from 'moti';
import GradientButton from '../GradientButton';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function GalleryEmptyState({ onUpload }) {
  return (
    <MotiView from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 380 }} style={styles.wrap}>
      <View style={styles.iconWrap}>
        <ImagePlus color={colors.primaryPurple} size={48} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>No X-rays Available</Text>
      <Text style={styles.subtitle}>Upload your first dental X-ray to begin building your patient's imaging history.</Text>
      <GradientButton title="Upload First X-ray" onPress={onUpload} style={styles.btn} />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 1.5, paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 96, height: 96, borderRadius: radii.lg, backgroundColor: colors.glassFillStrong,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.body.fontSize, textAlign: 'center', maxWidth: 320, lineHeight: 20, marginBottom: spacing.xl },
  btn: { minWidth: 220 },
});
