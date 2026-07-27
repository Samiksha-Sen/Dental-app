import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Check } from 'lucide-react-native';
import { colors } from '../theme/tokens';

export default function SuccessCheckmark({ size = 64 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <MotiView
        from={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ type: 'timing', duration: 900 }}
        style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
      />
      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 80 }}
        style={[
          styles.circle,
          { width: size * 0.8, height: size * 0.8, borderRadius: (size * 0.8) / 2 },
        ]}
      >
        <Check color="#fff" size={size * 0.4} strokeWidth={3} />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.success,
  },
  circle: {
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
