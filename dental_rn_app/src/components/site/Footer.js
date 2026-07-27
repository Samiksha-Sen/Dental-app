import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Logo from './Logo';
import { colors, spacing, typography } from '../../theme/tokens';

const LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'AI Technology', href: '/ai-technology' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View style={styles.wrap}>
      <View style={[styles.top, isWide && styles.topWide]}>
        <View style={styles.brandCol}>
          <Logo size={30} />
          <Text style={styles.tagline}>
            AI-assisted caries screening for dental clinics.
          </Text>
        </View>
        <View style={styles.linksRow}>
          {LINKS.map((l) => (
            <Pressable key={l.href} onPress={() => router.push(l.href)} style={styles.linkItem}>
              <Text style={styles.linkText}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.copyright}>
        © 2026 DentalAI Clinical Diagnostics. For clinical decision support — not a replacement
        for professional diagnosis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  top: {
    flexDirection: 'column',
    gap: spacing.xl,
  },
  topWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandCol: {
    gap: spacing.sm,
    maxWidth: 320,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  linkItem: {
    paddingVertical: 4,
  },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.xl,
  },
  copyright: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
