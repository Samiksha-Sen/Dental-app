import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '../GlassCard';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function FeatureCard({ icon: Icon, title, description, style }) {
  return (
    <GlassCard style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        {Icon ? <Icon size={20} color={colors.primary} /> : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 260,
    marginBottom: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  desc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
