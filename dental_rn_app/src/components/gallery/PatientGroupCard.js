import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import PatientAvatar from '../appointments/PatientAvatar';
import PressableScale from '../PressableScale';
import GlassCard from '../GlassCard';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export default function PatientGroupCard({ group, onQuickView }) {
  const lastVisitKey = group.lastVisit ? new Date(group.lastVisit).toLocaleDateString() : '—';
  return (
    <PressableScale onPress={onQuickView} scaleTo={0.98}>
      <GlassCard style={styles.card}>
        <PatientAvatar name={group.patientName} size={48} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{group.patientName}</Text>
          <Text style={styles.meta} numberOfLines={1}>{group.patientCode} · {group.totalScans} X-ray{group.totalScans === 1 ? '' : 's'}</Text>
          <Text style={styles.meta} numberOfLines={1}>Last visit: {lastVisitKey}</Text>
        </View>
        <ChevronRight color={colors.textMuted} size={18} />
      </GlassCard>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
