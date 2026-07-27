import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/tokens';

// Sweeping horizontal scan line for the X-ray analyzing state.
export default function LaserScanLine({ active = true }) {
  if (!active) return null;
  return (
    <MotiView
      from={{ translateY: 0 }}
      animate={{ translateY: 240 }}
      transition={{ type: 'timing', duration: 1500, loop: true, repeatReverse: true }}
      style={styles.line}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', colors.cyanLight, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.beam}
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
  },
  beam: {
    flex: 1,
    shadowColor: colors.cyanLight,
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
});
