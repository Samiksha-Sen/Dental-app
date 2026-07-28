import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { treatmentColors } from '../../theme/appointmentTokens';
import { radii, spacing, typography } from '../../theme/tokens';

export default function TreatmentTag({ treatment, style, compact }) {
  const color = treatmentColors[treatment] || treatmentColors.Consultation;
  return (
    <View style={[styles.tag, compact && styles.tagCompact, { backgroundColor: `${color}1F`, borderColor: `${color}40` }, style]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.txt, compact && styles.txtCompact, { color }]} numberOfLines={1}>{treatment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  tagCompact: { paddingHorizontal: 6, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  txt: { fontSize: typography.caption.fontSize, fontWeight: '700' },
  txtCompact: { fontSize: 10 },
});
