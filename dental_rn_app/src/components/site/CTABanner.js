import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { gradients, radii, spacing, typography } from '../../theme/tokens';

export default function CTABanner({ title, subtitle, buttonLabel, onPress, style }) {
  return (
    <LinearGradient
      colors={gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, style]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <Pressable onPress={onPress} style={styles.btn}>
        <Text style={styles.btnText}>{buttonLabel}</Text>
        <ArrowRight size={18} color={gradients.primary[1]} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    maxWidth: 520,
  },
  btn: {
    marginTop: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  btnText: {
    fontWeight: '700',
    fontSize: typography.body.fontSize + 1,
    color: gradients.primary[1],
  },
});
