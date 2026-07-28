import React from 'react';
import { View, StyleSheet } from 'react-native';
import GlassCard from '../GlassCard';
import ShimmerSweep from '../../animations/ShimmerSweep';
import { colors, spacing } from '../../theme/tokens';

function Bone({ width, height = 12, style }) {
  return <View style={[styles.bone, { width, height, borderRadius: height / 2 }, style]} />;
}

function SkeletonRow() {
  return (
    <GlassCard style={styles.row}>
      <ShimmerSweep />
      <View style={{ flex: 1 }}>
        <Bone width="40%" height={13} />
        <Bone width="25%" height={10} style={{ marginTop: 8 }} />
      </View>
      <Bone width={70} height={22} />
    </GlassCard>
  );
}

export default function DetailSkeleton({ count = 6 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, overflow: 'hidden' },
  bone: { backgroundColor: colors.glassFillStrong },
});
