import React from 'react';
import { MotiView } from 'moti';

export default function FadeSlideIn({ children, delay = 0, style, from = 16 }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: from }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
