import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { Link, useRouter, usePathname } from 'expo-router';
import { X, Menu } from 'lucide-react-native';
import Logo from './Logo';
import { colors, radii, spacing, typography, gradients } from '../../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'AI Technology', href: '/ai-technology' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

function CTAButton({ onPress, compact }) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cta, compact && styles.ctaCompact]}
      >
        <Text style={styles.ctaText}>Launch Portal</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function Nav() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isWide = width >= 768;

  const goTo = (href) => {
    setOpen(false);
    router.push(href);
  };

  const isActive = (href) => {
    if (href === '/') return pathname === '/' || pathname === '/(marketing)' || pathname === '/(marketing)/';
    return pathname?.startsWith(href);
  };

  return (
    <View style={styles.bar}>
      <Pressable onPress={() => goTo('/')} hitSlop={8}>
        <Logo size={34} />
      </Pressable>

      {isWide ? (
        <View style={styles.rightRow}>
          <View style={styles.linksRow}>
            {LINKS.map((l) => (
              <Pressable key={l.href} onPress={() => goTo(l.href)} style={styles.linkItem}>
                <Text style={[styles.linkText, isActive(l.href) && styles.linkTextActive]}>
                  {l.label}
                </Text>
                {isActive(l.href) ? <View style={styles.activeDot} /> : null}
              </Pressable>
            ))}
          </View>
          <CTAButton onPress={() => goTo('/(auth)/login')} />
        </View>
      ) : (
        <Pressable onPress={() => setOpen(true)} style={styles.menuBtn} hitSlop={10}>
          <Menu size={24} color={colors.textPrimary} />
        </Pressable>
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Logo size={30} />
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <X size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          {LINKS.map((l) => (
            <Pressable key={l.href} onPress={() => goTo(l.href)} style={styles.sheetLink}>
              <Text style={[styles.sheetLinkText, isActive(l.href) && styles.linkTextActive]}>
                {l.label}
              </Text>
            </Pressable>
          ))}
          <View style={{ marginTop: spacing.lg }}>
            <CTAButton onPress={() => goTo('/(auth)/login')} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: colors.bgElevated,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  linkItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  linkTextActive: {
    color: colors.primary,
  },
  activeDot: {
    marginTop: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  menuBtn: {
    padding: spacing.xs,
  },
  cta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  ctaCompact: {
    paddingHorizontal: spacing.md,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.fontSize,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetLink: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  sheetLinkText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
});
