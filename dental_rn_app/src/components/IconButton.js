import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../theme/tokens';

export default function IconButton({ children, onPress, size = 40, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed ? 0.9 : 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          style={styles.center}
        >
          {children}
        </MotiView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
