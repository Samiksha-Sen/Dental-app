import React from 'react';
import { MotiView } from 'moti';
import { colors } from '../theme/tokens';

// Wrap a status chip / ring to give it a slow breathing glow.
export default function PulseGlow({ children, color, style }) {
  const glowColor = color || colors.primary;
  return (
    <MotiView
      from={{ shadowOpacity: 0.2 }}
      animate={{ shadowOpacity: 0.6 }}
      transition={{ type: 'timing', duration: 1400, loop: true, repeatReverse: true }}
      style={[
        {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 12,
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </MotiView>
  );
}
