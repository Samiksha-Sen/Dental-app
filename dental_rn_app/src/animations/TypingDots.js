import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../theme/tokens';

export default function TypingDots() {
  return (
    <View style={styles.row}>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          from={{ translateY: 0, opacity: 0.4 }}
          animate={{ translateY: -4, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 420,
            loop: true,
            repeatReverse: true,
            delay: i * 140,
          }}
          style={styles.dot}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
});
