import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Activity } from 'lucide-react-native';
import { router } from 'expo-router';
import GlassCard from '../../src/components/GlassCard';
import GradientButton from '../../src/components/GradientButton';
import FloatingInput from '../../src/components/FloatingInput';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import ShimmerSweep from '../../src/animations/ShimmerSweep';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, gradients, radii, spacing, typography } from '../../src/theme/tokens';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      alert('Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await signIn(email.trim(), password);
      if (error) {
        alert(error.message);
        return;
      }
      router.replace('/(portal)/dashboard');
    } catch (e) {
      alert('Login failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <FadeSlideIn>
          <View style={styles.header}>
            <MotiView
              from={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 9, stiffness: 120 }}
              style={styles.logoBadge}
            >
              <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFillObject} />
              <Activity color="#fff" size={28} />
            </MotiView>
            <Text style={styles.brand}>DENTAL.AI</Text>
            <Text style={styles.subtitle}>AI-Assisted Dental Diagnostics</Text>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={120}>
          <GlassCard style={styles.card}>
            <ShimmerSweep />
            <FloatingInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <FloatingInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
            <GradientButton title="Sign In" onPress={onSubmit} loading={loading} />
          </GlassCard>
        </FadeSlideIn>

        <FadeSlideIn delay={200}>
          <View style={styles.footerLink}>
            <Text style={styles.footerText} onPress={() => router.push('/(auth)/signup')}>
              Need an account? <Text style={styles.accent}>Sign Up</Text>
            </Text>
          </View>
        </FadeSlideIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  brand: { ...typography.h1, color: colors.textPrimary, letterSpacing: 2 },
  subtitle: { color: colors.textMuted, fontSize: typography.body.fontSize, marginTop: 6, textAlign: 'center' },
  card: { overflow: 'hidden' },
  footerLink: { alignItems: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: typography.body.fontSize },
  accent: { color: colors.cyanLight, fontWeight: '700' },
});
