import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function DetailEmptyState({ Icon, title, subtitle }) {
  return (
    <MotiView from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 380 }} style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon color={colors.primary} size={44} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 88, height: 88, borderRadius: radii.lg, backgroundColor: colors.glassFillStrong,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.body.fontSize, textAlign: 'center', maxWidth: 320, lineHeight: 20 },
});
