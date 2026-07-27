import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Microscope,
  FileClock,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react-native';
import Container from '../../src/components/site/Container';
import SectionHeader from '../../src/components/site/SectionHeader';
import CTABanner from '../../src/components/site/CTABanner';
import FeatureCard from '../../src/components/site/FeatureCard';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import { spacing } from '../../src/theme/tokens';

const FEATURES = [
  {
    icon: Microscope,
    title: 'AI Caries Diagnosis',
    description:
      'A trained classifier scores an X-ray for demineralization and caries, returning a confidence percentage and a recommendation.',
  },
  {
    icon: FileClock,
    title: 'Electronic Health Records',
    description:
      'A running diagnostic timeline per patient, searchable and shared via a live Supabase-backed record store.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Access Control',
    description:
      'Row-level security policies, HIPAA-aligned audit logging, and encrypted traffic protect every record.',
  },
  {
    icon: BarChart3,
    title: 'Practice Analytics',
    description:
      'Screening volume, caries prevalence by age group, and follow-up completion rate in one dashboard.',
  },
  {
    icon: MessageSquare,
    title: 'AI Clinical Assistant',
    description:
      'An in-app chat companion answers quick clinical questions about a scanned tooth.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Tunable Sensitivity',
    description:
      'An adjustable confidence threshold per clinic, from 95% down to 75%, to match your screening policy.',
  },
];

export default function FeaturesScreen() {
  const router = useRouter();

  return (
    <View>
      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="Features"
            title="Everything a clinical screening workflow needs"
            subhead="From AI diagnosis to electronic health records, security, and practice-level analytics."
          />
        </FadeSlideIn>
        <View style={styles.grid}>
          {FEATURES.map((f, i) => (
            <FadeSlideIn key={f.title} delay={i * 80} style={styles.gridItem}>
              <FeatureCard icon={f.icon} title={f.title} description={f.description} />
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      <Container style={styles.section}>
        <FadeSlideIn>
          <CTABanner
            title="Ready to see it running on a real scan?"
            subtitle="The live portal runs the exact same pipeline described here."
            buttonLabel="Launch Live Demo"
            onPress={() => router.push('/(auth)/login')}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: 280,
  },
});
