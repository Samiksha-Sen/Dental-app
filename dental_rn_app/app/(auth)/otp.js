import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Mail } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import GlassCard from '../../src/components/GlassCard';
import GradientButton from '../../src/components/GradientButton';
import StepProgress from '../../src/components/StepProgress';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import * as authService from '../../src/services/authService';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const RESEND_SECONDS = 45;

export default function Otp() {
  const { email } = useLocalSearchParams();
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const onChangeDigit = (idx, value) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    setCodes((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < codes.length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const onSubmit = async () => {
    const token = codes.join('');
    if (token.length !== 6) {
      alert('Please enter the full 6-digit code.');
      return;
    }
    if (!email) {
      alert('Missing email — please restart sign up.');
      return;
    }
    try {
      setVerifying(true);
      const { error } = await authService.verifyOtp(email, token);
      if (error) {
        alert(error.message);
        return;
      }
      router.replace('/(portal)/dashboard');
    } catch (e) {
      alert('Verification failed: ' + e.message);
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (!email || secondsLeft > 0) return;
    try {
      setResending(true);
      const { error } = await authService.resendOtp(email);
      if (error) {
        alert(error.message);
        return;
      }
      setSecondsLeft(RESEND_SECONDS);
    } catch (e) {
      alert('Failed to resend code: ' + e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <FadeSlideIn>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Mail color={colors.cyanLight} size={24} />
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            {email ? `Enter the 6-digit code sent to ${email}` : 'Enter the 6-digit code sent to your email'}
          </Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={100}>
        <StepProgress step={2} total={2} label="Step 2 of 2 — Verification" />
      </FadeSlideIn>

      <FadeSlideIn delay={160}>
        <GlassCard>
          <View style={styles.otpRow}>
            {codes.map((code, idx) => (
              <MotiView
                key={idx}
                from={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 180, delay: idx * 60 }}
              >
                <TextInput
                  ref={(r) => { inputRefs.current[idx] = r; }}
                  style={styles.otpBox}
                  value={code}
                  maxLength={1}
                  keyboardType="numeric"
                  onChangeText={(v) => onChangeDigit(idx, v)}
                />
              </MotiView>
            ))}
          </View>
          <Text style={styles.timer}>
            {secondsLeft > 0 ? (
              <>Resend code in <Text style={styles.timerVal}>{mm}:{ss}</Text></>
            ) : (
              <Text style={styles.resendLink} onPress={onResend}>
                {resending ? 'Resending…' : 'Resend code'}
              </Text>
            )}
          </Text>
          <GradientButton title="Verify" onPress={onSubmit} loading={verifying} />
        </GlassCard>
      </FadeSlideIn>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.xl, paddingTop: 60, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { color: colors.textMuted, fontSize: typography.body.fontSize, marginTop: 6, textAlign: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  timer: { textAlign: 'center', color: colors.textMuted, fontSize: typography.body.fontSize, marginBottom: spacing.lg },
  timerVal: { color: colors.textSecondary, fontWeight: '700' },
  resendLink: { color: colors.cyanLight, fontWeight: '700' },
});
