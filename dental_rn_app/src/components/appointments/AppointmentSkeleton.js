import React from 'react';
import { View, StyleSheet } from 'react-native';
import GlassCard from '../GlassCard';
import ShimmerSweep from '../../animations/ShimmerSweep';
import { colors, radii, spacing } from '../../theme/tokens';

function Bone({ width, height = 12, style }) {
  return <View style={[styles.bone, { width, height, borderRadius: height / 2 }, style]} />;
}

function SkeletonCard() {
  return (
    <GlassCard style={styles.card}>
      <ShimmerSweep />
      <View style={styles.row}>
        <View style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Bone width="55%" height={13} />
          <Bone width="35%" height={10} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Bone width="100%" height={10} style={{ marginTop: spacing.md }} />
      <Bone width="70%" height={10} style={{ marginTop: 8 }} />
    </GlassCard>
  );
}

// Generic skeleton block used for the four summary stat cards.
export function SummaryCardsSkeleton() {
  return (
    <View style={styles.statsRow}>
      {[0, 1, 2, 3].map((i) => (
        <GlassCard key={i} style={styles.statCard}>
          <ShimmerSweep />
          <Bone width={40} height={40} style={{ borderRadius: radii.sm, marginBottom: spacing.sm }} />
          <Bone width="60%" height={10} />
          <Bone width="40%" height={20} style={{ marginTop: 8 }} />
        </GlassCard>
      ))}
    </View>
  );
}

export default function AppointmentSkeleton({ count = 5 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.glassFillStrong },
  bone: { backgroundColor: colors.glassFillStrong },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 140, overflow: 'hidden' },
});
