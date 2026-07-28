import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { statusColors } from '../../theme/appointmentTokens';
import { radii, spacing, typography } from '../../theme/tokens';

export default function AppointmentStatusBadge({ status, style }) {
  const c = statusColors[status] || statusColors.Upcoming;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <View style={[styles.dot, { backgroundColor: c.color }]} />
      <Text style={[styles.txt, { color: c.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  txt: { fontSize: typography.caption.fontSize, fontWeight: '700' },
});
