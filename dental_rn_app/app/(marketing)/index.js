import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { ArrowRight, PlayCircle, Layers, Activity, ShieldCheck, BarChart3 } from 'lucide-react-native';
import Container from '../../src/components/site/Container';
import SectionHeader from '../../src/components/site/SectionHeader';
import FeatureCard from '../../src/components/site/FeatureCard';
import CTABanner from '../../src/components/site/CTABanner';
import GlassCard from '../../src/components/GlassCard';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import AnimatedCounter from '../../src/animations/AnimatedCounter';
import { colors, gradients, radii, spacing, typography } from '../../src/theme/tokens';

const STATS = [
  { value: 48200, suffix: '+', label: 'X-Rays Scanned' },
  { value: 94.6, suffix: '%', label: 'Model Accuracy', decimals: 1 },
  { value: 120, suffix: '+', label: 'Partner Clinics' },
  { value: 9500, suffix: '+', label: 'Patients Tracked' },
];

const PARTNERS = [
  'APEX DENTAL DIAGNOSTICS',
  'ORAL HEALTH NETWORK',
  'SMILE CARE GROUP',
  'BRIGHT DENTAL PARTNERS',
];

const FEATURES = [
  {
    icon: Layers,
    title: 'Dual-Model Triage',
    description:
      'An X-ray validity classifier filters blanks and non-dental images before the caries model ever runs, cutting false readings.',
  },
  {
    icon: Activity,
    title: 'Live Patient EHR',
    description:
      'Every scan writes to a diagnostic timeline that is searchable, shareable, and kept in sync across the care team.',
  },
  {
    icon: ShieldCheck,
    title: 'Clinic-Grade Security',
    description:
      'Row-level access controls, HIPAA-aligned audit logging, and encrypted transport protect every record.',
  },
  {
    icon: BarChart3,
    title: 'Practice Analytics',
    description:
      'Track caries prevalence, screening volume, and follow-up rates from a single practice dashboard.',
  },
];

const TESTIMONIALS = [
  {
    initials: 'AM',
    name: 'Dr. Anjali Mehta',
    role: 'General Dentist, Mumbai',
    quote:
      '"The validity check alone has saved us from a handful of misfired diagnoses on poorly angled shots — the model simply refuses to score them."',
  },
  {
    initials: 'RK',
    name: 'Dr. Rohan Kapoor',
    role: 'Clinic Director, Apex Dental',
    quote:
      '"Confidence scoring gives our junior associates a second opinion they can actually reason about, not just a yes or no."',
  },
  {
    initials: 'SN',
    name: 'Dr. Sana Noor',
    role: 'Pediatric Dentist, Bright Dental',
    quote:
      '"The EHR timeline replaced three spreadsheets. I can see a child\'s full screening history in one scroll."',
  },
];

function ToothIcon({ size = 72 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c-2.2 0-3.1 1.1-4.4 1.1-1.6 0-2.9-1-3.9 0-1.1 1.1-.9 3.4-.6 5.2.4 2.4 1.2 4.6 2 6.7.5 1.4 1 2.9 1.9 3.4.9.5 1.5-.6 1.9-2 .4-1.4.6-3 1.1-3 .5 0 .7 1.6 1.1 3 .4 1.4 1 2.5 1.9 2 .9-.5 1.4-2 1.9-3.4.8-2.1 1.6-4.3 2-6.7.3-1.8.5-4.1-.6-5.2-1-1-2.3 0-3.9 0C15.1 4.1 14.2 3 12 3z"
        stroke={colors.primary}
        strokeWidth={1.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  return (
    <View>
      {/* Hero */}
      <LinearGradient colors={gradients.bg} style={styles.hero}>
        <Container>
          <FadeSlideIn>
            <View style={styles.heroInner}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Trusted clinical AI, built for dental practices</Text>
              </View>
              <ToothIcon size={64} />
              <Text style={styles.h1}>Detect caries before your patients feel it</Text>
              <Text style={styles.heroBody}>
                DentalAI pairs an X-ray validity check with a trained caries classifier to give
                clinicians a confidence-scored second opinion in seconds — plugged straight into
                your patient EHR.
              </Text>
              <View style={[styles.ctaRow, !isWide && styles.ctaRowNarrow]}>
                <Pressable onPress={() => router.push('/(auth)/login')}>
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtn}
                  >
                    <PlayCircle size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Launch Live Demo</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(marketing)/ai-technology')}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>See How It Works</Text>
                  <ArrowRight size={16} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </FadeSlideIn>

          {/* Stats */}
          <FadeSlideIn delay={120}>
            <View style={[styles.statsRow, !isWide && styles.statsRowNarrow]}>
              {STATS.map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <View style={styles.statNumRow}>
                    <AnimatedCounter
                      value={s.value}
                      style={styles.statNum}
                      formatter={(v) =>
                        s.decimals ? v.toFixed(s.decimals) : Math.round(v).toLocaleString()
                      }
                    />
                    <Text style={styles.statNum}>{s.suffix}</Text>
                  </View>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </FadeSlideIn>

          {/* Partner strip */}
          <FadeSlideIn delay={200}>
            <View style={styles.partnerStrip}>
              {PARTNERS.map((p) => (
                <Text key={p} style={styles.partnerText}>
                  {p}
                </Text>
              ))}
            </View>
          </FadeSlideIn>
        </Container>
      </LinearGradient>

      {/* Why DentalAI */}
      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="Why DentalAI"
            title="Clinical-grade AI, built into your existing workflow"
            subhead="Every scan runs through a two-stage pipeline before a diagnosis ever reaches a patient's chart."
          />
        </FadeSlideIn>
        <View style={styles.grid}>
          {FEATURES.map((f, i) => (
            <FadeSlideIn key={f.title} delay={i * 90} style={styles.gridItem}>
              <FeatureCard icon={f.icon} title={f.title} description={f.description} />
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      {/* Testimonials */}
      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="What clinicians say"
            title="Built alongside dental practitioners"
            center
          />
        </FadeSlideIn>
        <View style={styles.grid}>
          {TESTIMONIALS.map((t, i) => (
            <FadeSlideIn key={t.name} delay={i * 90} style={styles.gridItemThird}>
              <GlassCard style={styles.testimonialCard}>
                <Text style={styles.quote}>{t.quote}</Text>
                <View style={styles.testimonialFooter}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{t.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.testimonialName}>{t.name}</Text>
                    <Text style={styles.testimonialRole}>{t.role}</Text>
                  </View>
                </View>
              </GlassCard>
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      {/* Final CTA */}
      <Container style={styles.section}>
        <FadeSlideIn>
          <CTABanner
            title="See it on a real X-ray in under a minute"
            subtitle="No install required — the live dashboard runs the same models as the production clinical portal."
            buttonLabel="Launch Live Demo"
            onPress={() => router.push('/(auth)/login')}
          />
        </FadeSlideIn>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  heroInner: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  badge: {
    backgroundColor: colors.successBg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  badgeText: {
    ...typography.label,
    color: colors.primary,
  },
  h1: {
    ...typography.h1,
    fontSize: 34,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: 680,
    marginTop: spacing.sm,
  },
  heroBody: {
    ...typography.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 560,
    lineHeight: 23,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  ctaRowNarrow: {
    flexDirection: 'column',
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.fontSize + 1,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.body.fontSize + 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  statsRowNarrow: {
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 120,
  },
  statNumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statNum: {
    ...typography.h1,
    fontSize: 24,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  partnerStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  partnerText: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  section: {
    paddingVertical: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: 240,
  },
  gridItemThird: {
    flexGrow: 1,
    flexBasis: 280,
  },
  testimonialCard: {
    flexGrow: 1,
    gap: spacing.md,
  },
  quote: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  testimonialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  testimonialName: {
    ...typography.h3,
    fontSize: 14,
    color: colors.textPrimary,
  },
  testimonialRole: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
