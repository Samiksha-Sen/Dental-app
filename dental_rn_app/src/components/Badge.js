import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { badgeColors, radii, spacing, typography } from '../theme/tokens';

// badge: 'urgent' | 'pending' | 'cleared'
export default function Badge({ badge, label, style }) {
  const c = badgeColors[badge] || badgeColors.cleared;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <View style={[styles.dot, { backgroundColor: c.color }]} />
      <Text style={[styles.txt, { color: c.color }]}>{label}</Text>
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  txt: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
});
