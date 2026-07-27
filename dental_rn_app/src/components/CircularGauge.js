import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography } from '../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const CIRCUMFERENCE = 251;

// Same strokeDasharray(251)/r=40 technique the app already used for its gauges,
// now animated and reusable across Scan results / Tooth Map / EHR cards.
export default function CircularGauge({ size = 100, value = 0, color, label = 'Precision' }) {
  const progress = useSharedValue(0);
  const strokeColor = color || colors.primary;

  useEffect(() => {
    progress.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE - (CIRCUMFERENCE * progress.value) / 100,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="40" stroke={colors.glassFillStrong} strokeWidth="6" fill="none" />
        <AnimatedCircle
          cx="50"
          cy="50"
          r="40"
          stroke={strokeColor}
          strokeWidth="6"
          strokeDasharray={CIRCUMFERENCE}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
          rotation="-90"
          origin="50, 50"
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.overlay}>
          <Text style={[styles.value, { color: strokeColor }]}>{value.toFixed(1)}%</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: typography.h3.fontSize,
    fontWeight: '800',
  },
  label: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: 2,
  },
});
