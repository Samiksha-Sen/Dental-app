import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Cpu, Users } from 'lucide-react-native';
import Container from '../../src/components/site/Container';
import SectionHeader from '../../src/components/site/SectionHeader';
import CTABanner from '../../src/components/site/CTABanner';
import GlassCard from '../../src/components/GlassCard';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import { colors, spacing, typography } from '../../src/theme/tokens';

const PILLARS = [
  {
    icon: Target,
    title: 'Our Mission',
    description:
      'Reduce missed and delayed caries diagnoses by putting the model directly in the clinical workflow, not in a separate research tool.',
  },
  {
    icon: Cpu,
    title: 'The Technology',
    description:
      'A dual-model pipeline — MobileNetV2 feature extraction feeding an X-ray validity check and a caries classifier — served via a Flask API to mobile and web clients.',
  },
  {
    icon: Users,
    title: "Who It's For",
    description:
      "General dentists, clinic directors, and dental students wanting a fast second opinion — not a replacement for professional judgment.",
  },
];

const TEAM = [
  { initials: 'SS', name: 'Dr. Samiksha Sen', role: 'Clinical Lead' },
  { initials: 'EN', name: 'Engineering Team', role: 'ML & Platform' },
  { initials: 'CA', name: 'Clinical Advisors', role: 'Dental Practice Network' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View>
      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="Research / About"
            title="Building a second pair of eyes for every dental clinic"
          />
          <Text style={styles.bodyText}>
            DentalAI started as a diagnostic-support tool for practices without in-house radiology
            support — a way to give any clinician a fast, confidence-scored read on a dental
            X-ray before committing to treatment.
          </Text>
        </FadeSlideIn>

        <View style={styles.grid}>
          {PILLARS.map((p, i) => (
            <FadeSlideIn key={p.title} delay={i * 90} style={styles.gridItem}>
              <GlassCard style={styles.pillarCard}>
                <View style={styles.iconWrap}>
                  <p.icon size={20} color={colors.primary} />
                </View>
                <Text style={styles.pillarTitle}>{p.title}</Text>
                <Text style={styles.pillarDesc}>{p.description}</Text>
              </GlassCard>
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="Team"
            title="Clinicians and engineers, building together"
            center
          />
        </FadeSlideIn>
        <View style={styles.teamRow}>
          {TEAM.map((t, i) => (
            <FadeSlideIn key={t.name} delay={i * 90} style={styles.teamItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{t.initials}</Text>
              </View>
              <Text style={styles.teamName}>{t.name}</Text>
              <Text style={styles.teamRole}>{t.role}</Text>
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      <Container style={styles.section}>
        <FadeSlideIn>
          <CTABanner
            title="Have questions about how it works?"
            subtitle="Reach out — we're happy to walk through the model or the data handling in detail."
            buttonLabel="Contact Us"
            onPress={() => router.push('/(marketing)/contact')}
          />
        </FadeSlideIn>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: spacing.xxl,
  },
  bodyText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: 680,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: 260,
  },
  pillarCard: {
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  pillarTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  pillarDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  teamRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  teamItem: {
    alignItems: 'center',
    width: 160,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  teamName: {
    ...typography.h3,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  teamRole: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
