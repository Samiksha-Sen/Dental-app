import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileCheck2,
  ImageOff,
  Layers3,
  ScanEye,
  Microscope,
  Gauge,
} from 'lucide-react-native';
import Container from '../../src/components/site/Container';
import SectionHeader from '../../src/components/site/SectionHeader';
import CTABanner from '../../src/components/site/CTABanner';
import GlassCard from '../../src/components/GlassCard';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const STEPS = [
  {
    icon: FileCheck2,
    title: 'Integrity Check',
    description: 'The file is verified as a valid, non-corrupted image before anything else runs.',
  },
  {
    icon: ImageOff,
    title: 'Blank-Scan Filter',
    description: 'Pixel standard deviation is checked to reject flat or blank images.',
  },
  {
    icon: Layers3,
    title: 'Feature Extraction',
    description: 'MobileNetV2, pretrained on ImageNet weights, extracts a pooled feature vector.',
  },
  {
    icon: ScanEye,
    title: 'X-Ray Validation',
    description:
      'A binary classifier (xray_validator.h5) confirms the upload is a genuine dental X-ray.',
  },
  {
    icon: Microscope,
    title: 'Caries Classification',
    description: 'caries_model1.h5 scores demineralization and caries presence once validated.',
  },
  {
    icon: Gauge,
    title: 'Confidence & Recommendation',
    description:
      "The score is compared against the clinic's threshold, returning condition, confidence %, and next step.",
  },
];

const MODELS = [
  {
    title: 'X-Ray Validator',
    description:
      'A binary classifier trained on MobileNetV2 features that gatekeeps the diagnostic model — nothing reaches the caries classifier until it passes.',
  },
  {
    title: 'Caries Classifier',
    description:
      'caries_model1.h5, a custom-trained model that returns a caries confidence score for every validated image.',
  },
];

export default function AiTechnologyScreen() {
  const router = useRouter();

  return (
    <View>
      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="AI Technology"
            title="What actually happens to an X-ray after you upload it"
            subhead="Every image runs through the same six-stage pipeline, on the mobile app and here on the web portal alike."
          />
        </FadeSlideIn>
        <View style={styles.grid}>
          {STEPS.map((s, i) => (
            <FadeSlideIn key={s.title} delay={i * 80} style={styles.gridItem}>
              <GlassCard style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{i + 1}</Text>
                  </View>
                  <s.icon size={20} color={colors.primary} />
                </View>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.description}</Text>
              </GlassCard>
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="Model Details"
            title="Two purpose-built models, one pipeline"
          />
        </FadeSlideIn>
        <View style={styles.grid}>
          {MODELS.map((m, i) => (
            <FadeSlideIn key={m.title} delay={i * 90} style={styles.gridItemHalf}>
              <GlassCard>
                <Text style={styles.stepTitle}>{m.title}</Text>
                <Text style={styles.stepDesc}>{m.description}</Text>
              </GlassCard>
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader
            eyebrow="Threshold Logic"
            title="Confidence, not a black-box yes/no"
          />
          <Text style={styles.bodyText}>
            Your clinic sets a sensitivity threshold (default 85%). If the caries score clears it,
            the result reads "Caries Found" with a restorative-treatment recommendation; below
            threshold, it reads "No Caries Detected" with a routine check-up recommendation.
          </Text>
        </FadeSlideIn>
      </Container>

      <Container style={styles.section}>
        <FadeSlideIn>
          <CTABanner
            title="Try the pipeline on a real image"
            subtitle="Sign in and upload an X-ray to watch each stage run for real."
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
  gridItemHalf: {
    flexGrow: 1,
    flexBasis: 320,
  },
  stepCard: {
    gap: spacing.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  stepDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bodyText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: 680,
  },
});
