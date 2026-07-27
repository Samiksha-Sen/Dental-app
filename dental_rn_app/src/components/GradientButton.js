import React from 'react';
import { Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, gradients, radii, spacing, typography } from '../theme/tokens';

// Layout sizing (flex/width/margins from `style`) lives on the plain RN
// Pressable — moti's Pressable/interactions layer doesn't reliably forward
// flex-based sizing to the DOM on web, so it only drives the animated transform.
export default function GradientButton({
  title,
  onPress,
  icon,
  colorsOverride,
  loading,
  disabled,
  style,
}) {
  return (
    <Pressable onPress={disabled || loading ? undefined : onPress} style={[disabled && styles.disabled, style]}>
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed ? 0.96 : 1, translateY: pressed ? 1 : 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          style={styles.stretch}
        >
          <LinearGradient
            colors={colorsOverride || gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                {icon}
                <Text style={styles.txt}>{title}</Text>
              </>
            )}
          </LinearGradient>
        </MotiView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stretch: {
    alignSelf: 'stretch',
  },
  btn: {
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  txt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.fontSize + 1,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
