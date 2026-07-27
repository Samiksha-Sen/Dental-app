import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing, shadow } from '../theme/tokens';

export default function GlassCard({ children, style, glow, ...rest }) {
  return (
    <View
      style={[
        styles.card,
        glow ? shadow.glow(glow) : shadow.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
});
