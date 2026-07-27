import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

// Diagonal glass-shine sweep, meant to sit absolutely-positioned inside a GlassCard.
export default function ShimmerSweep({ width = 140 }) {
  return (
    <MotiView
      style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}
      pointerEvents="none"
    >
      <MotiView
        from={{ translateX: -width * 2 }}
        animate={{ translateX: 400 }}
        transition={{ type: 'timing', duration: 2200, loop: true, repeatReverse: false, delay: 600 }}
        style={{ position: 'absolute', top: 0, bottom: 0, width }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.09)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </MotiView>
    </MotiView>
  );
}
