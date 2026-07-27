import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { spacing } from '../../theme/tokens';

// Centers content and caps its width on desktop, full-bleed padded on mobile.
export default function Container({ children, style, maxWidth = 1080 }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.inner,
          { maxWidth, paddingHorizontal: isWide ? spacing.xxl : spacing.lg },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
});
