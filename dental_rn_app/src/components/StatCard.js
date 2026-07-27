import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from './GlassCard';
import AnimatedCounter from '../animations/AnimatedCounter';
import { colors, radii, spacing, typography } from '../theme/tokens';

export default function StatCard({ icon, label, value, color, glowColors, isNumeric = true }) {
  const wash = glowColors || [`${color}33`, 'transparent'];
  return (
    <GlassCard style={[styles.card, { borderColor: `${color}40` }]}>
      <LinearGradient colors={wash} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.iconWrap, { backgroundColor: `${color}26`, shadowColor: color }]}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      {isNumeric ? (
        <AnimatedCounter value={Number(value) || 0} style={[styles.value, { color }]} />
      ) : (
        <Text style={[styles.value, { color }]}>{value}</Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    marginBottom: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
  },
});
