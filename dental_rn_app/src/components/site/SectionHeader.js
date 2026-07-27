import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

export default function SectionHeader({ eyebrow, title, subhead, center, style }) {
  return (
    <View style={[styles.wrap, center && styles.center, style]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.title, center && styles.centerText]}>{title}</Text>
      {subhead ? (
        <Text style={[styles.subhead, center && styles.centerText]}>{subhead}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  center: {
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subhead: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 640,
    lineHeight: 21,
  },
  centerText: {
    textAlign: 'center',
  },
});
