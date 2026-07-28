import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { CheckCircle2, Clock, Loader2, XCircle, AlertTriangle } from 'lucide-react-native';
import { aiStatusMeta } from '../../theme/galleryTokens';
import { radii, spacing, typography } from '../../theme/tokens';

const ICONS = {
  'Analysed': CheckCircle2,
  'Pending': Clock,
  'Processing': Loader2,
  'Rejected': XCircle,
  'Requires Review': AlertTriangle,
};

export default function AIStatusBadge({ status, style }) {
  const meta = aiStatusMeta[status] || aiStatusMeta.Pending;
  const Icon = ICONS[status] || Clock;

  const iconEl = status === 'Processing' ? (
    <MotiView
      from={{ rotate: '0deg' }}
      animate={{ rotate: '360deg' }}
      transition={{ type: 'timing', duration: 1100, loop: true, repeatReverse: false }}
    >
      <Icon color={meta.color} size={12} />
    </MotiView>
  ) : (
    <Icon color={meta.color} size={12} />
  );

  return (
    <View style={[styles.pill, { backgroundColor: meta.bg, borderColor: meta.border }, style]}>
      {iconEl}
      <Text style={[styles.txt, { color: meta.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 5,
  },
  txt: { fontSize: typography.caption.fontSize, fontWeight: '700' },
});
