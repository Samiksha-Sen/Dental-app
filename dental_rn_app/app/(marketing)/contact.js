import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, CheckCircle2, Stethoscope, Code2 } from 'lucide-react-native';
import Container from '../../src/components/site/Container';
import SectionHeader from '../../src/components/site/SectionHeader';
import GlassCard from '../../src/components/GlassCard';
import GradientButton from '../../src/components/GradientButton';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const INFO_CARDS = [
  {
    icon: Stethoscope,
    title: 'Clinical Support',
    description:
      'For deployment questions or clinic onboarding, reach the clinical support team directly.',
  },
  {
    icon: Code2,
    title: 'Technical / API',
    description:
      'Questions about the /predict endpoint, model thresholds, or the Supabase data schema — see AI Technology for the full pipeline breakdown.',
  },
];

const FAQS = [
  {
    q: "Is DentalAI a replacement for a dentist's diagnosis?",
    a: "No, it's a decision-support tool giving a confidence-scored second read; results should be reviewed by a licensed clinician.",
  },
  {
    q: 'What image formats are supported?',
    a: 'Standard PNG/JPG dental X-rays; the validity check rejects non-dental, blank, or corrupted uploads.',
  },
  {
    q: 'Where is patient data stored?',
    a: "In the clinic's Supabase project, shared between the mobile app and the web portal so records stay in sync.",
  },
  {
    q: 'Can I adjust how sensitive the model is?',
    a: 'Yes, the threshold is configurable per clinic, from 95% (high-sensitivity) down to 75% (broader screening).',
  },
  {
    q: 'Does the web portal use the real model?',
    a: 'Yes, the portal talks to the same Flask /predict endpoint and TensorFlow models as the mobile app.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((v) => !v)} style={styles.faqItem}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{q}</Text>
        <ChevronDown
          size={18}
          color={colors.textMuted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </View>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </Pressable>
  );
}

export default function ContactScreen() {
  const [form, setForm] = useState({ name: '', email: '', org: '', message: '' });
  const [sent, setSent] = useState(false);

  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const submit = () => {
    setSent(true);
  };

  return (
    <View>
      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader eyebrow="Contact" title="Get in touch" />
          <Text style={styles.bodyText}>
            Questions about deployment, the model pipeline, or a partner clinic integration —
            send us a note.
          </Text>
        </FadeSlideIn>

        <FadeSlideIn delay={80}>
          <GlassCard style={styles.formCard}>
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={update('name')}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={form.email}
              onChangeText={update('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              placeholder="Clinic / Organization"
              placeholderTextColor={colors.textMuted}
              value={form.org}
              onChangeText={update('org')}
              style={styles.input}
            />
            <TextInput
              placeholder="Message"
              placeholderTextColor={colors.textMuted}
              value={form.message}
              onChangeText={update('message')}
              multiline
              numberOfLines={5}
              style={[styles.input, styles.textarea]}
            />
            <GradientButton title="Send Message" onPress={submit} />
            {sent ? (
              <View style={styles.confirmRow}>
                <CheckCircle2 size={16} color={colors.success} />
                <Text style={styles.confirmText}>Thanks — your message has been noted.</Text>
              </View>
            ) : null}
          </GlassCard>
        </FadeSlideIn>

        <View style={styles.grid}>
          {INFO_CARDS.map((c, i) => (
            <FadeSlideIn key={c.title} delay={i * 90} style={styles.gridItem}>
              <GlassCard style={styles.infoCard}>
                <View style={styles.iconWrap}>
                  <c.icon size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoTitle}>{c.title}</Text>
                <Text style={styles.infoDesc}>{c.description}</Text>
              </GlassCard>
            </FadeSlideIn>
          ))}
        </View>
      </Container>

      <Container style={styles.section}>
        <FadeSlideIn>
          <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
        </FadeSlideIn>
        <GlassCard style={styles.faqCard}>
          {FAQS.map((f, i) => (
            <FadeSlideIn key={f.q} delay={i * 60}>
              <FAQItem q={f.q} a={f.a} />
            </FadeSlideIn>
          ))}
        </GlassCard>
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
    maxWidth: 640,
    marginBottom: spacing.xl,
  },
  formCard: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    backgroundColor: colors.bg,
  },
  textarea: {
    height: 110,
    textAlignVertical: 'top',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
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
  infoCard: {
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  infoDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  faqCard: {
    gap: 0,
  },
  faqItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  faqQ: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  faqA: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
