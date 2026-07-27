import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, gradients, radii, typography } from '../../theme/tokens';

// Simplified hand-drawn tooth outline (two roots + crown), stroked in white.
function ToothMark({ size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c-2.2 0-3.1 1.1-4.4 1.1-1.6 0-2.9-1-3.9 0-1.1 1.1-.9 3.4-.6 5.2.4 2.4 1.2 4.6 2 6.7.5 1.4 1 2.9 1.9 3.4.9.5 1.5-.6 1.9-2 .4-1.4.6-3 1.1-3 .5 0 .7 1.6 1.1 3 .4 1.4 1 2.5 1.9 2 .9-.5 1.4-2 1.9-3.4.8-2.1 1.6-4.3 2-6.7.3-1.8.5-4.1-.6-5.2-1-1-2.3 0-3.9 0C15.1 4.1 14.2 3 12 3z"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function Logo({ size = 36, showWordmark = true, textStyle, style }) {
  const iconSize = Math.round(size * 0.6);
  return (
    <View style={[styles.row, style]}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: size * 0.28 },
        ]}
      >
        <ToothMark size={iconSize} />
      </LinearGradient>
      {showWordmark ? (
        <Text style={[styles.wordmark, { fontSize: Math.max(15, size * 0.46) }, textStyle]}>
          Dental<Text style={{ color: colors.primary }}>AI</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});
