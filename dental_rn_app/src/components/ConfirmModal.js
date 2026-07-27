import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import GradientButton from './GradientButton';
import { colors, gradients, radii, spacing, typography } from '../theme/tokens';

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: 12 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 220 }}
          style={styles.card}
        >
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.msg}>{message}</Text> : null}
          <View style={styles.row}>
            <GradientButton
              title={cancelLabel}
              onPress={onCancel}
              colorsOverride={[colors.bgElevated, colors.bgElevated]}
              style={{ flex: 1 }}
            />
            <GradientButton
              title={confirmLabel}
              onPress={onConfirm}
              colorsOverride={danger ? gradients.danger : gradients.primary}
              style={{ flex: 1 }}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  msg: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
