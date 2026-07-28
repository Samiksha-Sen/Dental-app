import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function DetailPageHeader({ crumb, title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.breadcrumbRow}>
        <Text style={styles.breadcrumbLink} onPress={() => router.push('/(portal)/dashboard')}>Dashboard</Text>
        <ChevronRight color={colors.textMuted} size={13} />
        <Text style={styles.breadcrumbCurrent}>{crumb}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => (router.canGoBack() ? router.back() : router.push('/(portal)/dashboard'))}
      >
        <ArrowLeft color={colors.primary} size={16} />
        <Text style={styles.backBtnTxt}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  breadcrumbLink: { color: colors.cyanLight, fontWeight: '700', fontSize: typography.caption.fontSize },
  breadcrumbCurrent: { color: colors.textMuted, fontWeight: '600', fontSize: typography.caption.fontSize },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { color: colors.textMuted, fontSize: typography.body.fontSize, marginTop: 4, maxWidth: 480 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start',
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: radii.sm, paddingVertical: 10, paddingHorizontal: spacing.lg, marginTop: spacing.md,
  },
  backBtnTxt: { color: colors.primary, fontWeight: '700', fontSize: typography.caption.fontSize },
});
