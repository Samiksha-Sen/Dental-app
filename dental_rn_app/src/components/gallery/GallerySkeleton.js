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
      <View style={styles.image}><ShimmerSweep /></View>
      <View style={{ padding: spacing.md }}>
        <Bone width="70%" height={13} />
        <Bone width="45%" height={10} style={{ marginTop: 8 }} />
        <Bone width="55%" height={10} style={{ marginTop: 6 }} />
        <Bone width="90%" height={10} style={{ marginTop: spacing.sm }} />
      </View>
    </GlassCard>
  );
}

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

export default function GallerySkeleton({ count = 6 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cell}><SkeletonCard /></View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { flexGrow: 1, flexBasis: 220, maxWidth: 320 },
  card: { padding: 0, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.glassFillStrong, overflow: 'hidden' },
  bone: { backgroundColor: colors.glassFillStrong },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 140, overflow: 'hidden' },
});
