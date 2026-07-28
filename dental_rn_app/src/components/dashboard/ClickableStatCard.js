import React, { useState } from 'react';
import { Pressable, Platform } from 'react-native';
import { MotiView } from 'moti';
import StatCard from '../StatCard';

// Wraps the existing StatCard (unmodified, still used as-is elsewhere) with
// hover elevation + press-scale so dashboard stat cards can act as full-card
// navigation links, without changing StatCard's own API/behaviour.
export default function ClickableStatCard(props) {
  const { onPress, ...statCardProps } = props;
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[{ flex: 1, minWidth: 140 }, Platform.OS === 'web' && { cursor: 'pointer' }]}
      accessibilityRole="button"
    >
      {({ pressed }) => (
        <MotiView
          animate={{
            translateY: hovered && !pressed ? -4 : 0,
            scale: pressed ? 0.97 : 1,
          }}
          transition={{ type: 'timing', duration: 180 }}
        >
          <StatCard {...statCardProps} />
        </MotiView>
      )}
    </Pressable>
  );
}
