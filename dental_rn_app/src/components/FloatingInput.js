import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, radii, spacing, typography } from '../theme/tokens';

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  placeholder,
  maxLength,
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      <MotiView
        animate={{
          borderColor: focused ? colors.primary : colors.glassBorder,
          shadowOpacity: focused ? 0.5 : 0,
        }}
        transition={{ type: 'timing', duration: 220 }}
        style={[styles.fieldShell, { shadowColor: colors.primary }]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          maxLength={maxLength}
        />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: typography.label.fontSize,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.cyanLight,
  },
  fieldShell: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: radii.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize + 1,
  },
});
