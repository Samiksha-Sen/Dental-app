import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, typography } from '../theme/tokens';

export default function StepProgress({ step, total, label }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <MotiView
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.fill}
        />
      </View>
      <Text style={styles.label}>{label || `Step ${step} of ${total}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl, alignItems: 'center' },
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassFillStrong,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.cyan,
  },
  label: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
