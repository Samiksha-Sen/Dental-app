import React from 'react';
import { Pressable } from 'react-native';
import { MotiView } from 'moti';

// Shared safe-pressable pattern: layout sizing (flex/width/%) lives on the
// plain RN Pressable (reliable on web), while MotiView only drives the
// animated transform. moti/interactions' MotiPressable doesn't reliably
// forward flex-based sizing to the DOM on web, causing flex:1 / width:'%'
// children to collapse to content size instead of stretching.
export default function PressableScale({ onPress, children, style, innerStyle, scaleTo = 0.96, disabled }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={style} disabled={disabled}>
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed ? scaleTo : 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          style={innerStyle}
        >
          {children}
        </MotiView>
      )}
    </Pressable>
  );
}
