import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ClipboardEdit } from 'lucide-react-native';
import { router } from 'expo-router';
import GlassCard from '../../src/components/GlassCard';
import GradientButton from '../../src/components/GradientButton';
import FloatingInput from '../../src/components/FloatingInput';
import StepProgress from '../../src/components/StepProgress';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, gradients, radii, spacing, typography } from '../../src/theme/tokens';

export default function Signup() {
  const { signUp } = useAuth();
  const [doctorName, setDoctorName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!doctorName.trim() || !email.trim()) {
      alert('Please enter your name and email.');
      return;
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await signUp(email.trim(), password, doctorName.trim());
      if (error) {
        alert(error.message);
        return;
      }
      router.replace('/(portal)/dashboard');
    } catch (e) {
      alert('Sign up failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <FadeSlideIn>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <ClipboardEdit color={colors.cyanLight} size={24} />
          </View>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Register as a clinician to start using Dental.AI</Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={100}>
        <StepProgress step={1} total={2} label="Step 1 of 2 — Registration Details" />
      </FadeSlideIn>

      <FadeSlideIn delay={160}>
        <GlassCard>
          <FloatingInput testID="signup-fullname-input" label="Full Name" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Jane Doe" />
          <FloatingInput testID="signup-license-input" label="License No." value={licenseNo} onChangeText={setLicenseNo} placeholder="DDS-00000" />
          <FloatingInput testID="signup-clinic-input" label="Clinic Name" value={clinicName} onChangeText={setClinicName} placeholder="Clinic Name" />
          <FloatingInput testID="signup-email-input" label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <FloatingInput testID="signup-password-input" label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
          <FloatingInput testID="signup-confirm-password-input" label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry />
          <GradientButton testID="signup-submit-button" title="Create Account" onPress={onSubmit} loading={loading} colorsOverride={gradients.violet} />
        </GlassCard>
      </FadeSlideIn>

      <FadeSlideIn delay={220}>
        <View style={styles.footerLink}>
          <Text style={styles.footerText} onPress={() => router.push('/(auth)/login')}>
            Already have an account? <Text style={styles.accent}>Log In</Text>
          </Text>
        </View>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: 60, paddingBottom: 40 },
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
  footerLink: { alignItems: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: typography.body.fontSize },
  accent: { color: colors.cyanLight, fontWeight: '700' },
});
