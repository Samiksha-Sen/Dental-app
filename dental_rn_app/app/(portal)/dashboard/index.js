import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Layers, ShieldAlert, Users as UsersIcon, ScanLine, Users, Sparkles, CalendarDays } from 'lucide-react-native';
import { router } from 'expo-router';
import GlassCard from '../../../src/components/GlassCard';
import ClickableStatCard from '../../../src/components/dashboard/ClickableStatCard';
import Badge from '../../../src/components/Badge';
import PressableScale from '../../../src/components/PressableScale';
import FadeSlideIn from '../../../src/animations/FadeSlideIn';
import ShimmerSweep from '../../../src/animations/ShimmerSweep';
import { useAuth } from '../../../src/hooks/useAuth';
import { usePatients } from '../../../src/hooks/usePatients';
import { useScanHistory } from '../../../src/hooks/useScanHistory';
import { colors, gradients, radii, spacing, typography } from '../../../src/theme/tokens';

const QUICK_ACTIONS = [
  { key: 'scan', label: 'Scan X-Ray', Icon: ScanLine, color: colors.primary },
  { key: 'appointments', label: 'Appointments', Icon: CalendarDays, color: colors.cyanLight },
  { key: 'patients', label: 'Patients', Icon: Users, color: colors.success },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { patients } = usePatients();
  const { scanHistory } = useScanHistory();

  const doctorName = user?.user_metadata?.full_name || user?.email || 'Clinician';
  const initials = doctorName.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const urgentPatients = patients.filter((p) => p.badge === 'urgent').slice(0, 5);

  const goto = (tab) => router.push(`/(portal)/${tab}`);
  const selectPatient = (name) => router.push({ pathname: '/(portal)/patients', params: { name } });

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.orbA} pointerEvents="none" />
      <View style={styles.orbB} pointerEvents="none" />

      <FadeSlideIn>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>OVERVIEW</Text>
            <Text style={styles.title}>Clinical Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, {doctorName}</Text>
          </View>
          <PressableScale onPress={() => router.push('/(portal)/settings')} scaleTo={0.92}>
            <LinearGradient colors={gradients.primary} style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials || 'DR'}</Text>
            </LinearGradient>
          </PressableScale>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={80}>
        <View style={styles.statsRow}>
          <ClickableStatCard
            testID="dashboard-stat-total-scans"
            icon={<Layers color={colors.primary} size={19} />}
            label="Total AI Scans"
            value={scanHistory.length}
            color={colors.primary}
            onPress={() => router.push('/(portal)/dashboard/ai-scans')}
          />
          <ClickableStatCard
            testID="dashboard-stat-severe-caries"
            icon={<ShieldAlert color={colors.danger} size={19} />}
            label="Severe Caries"
            value={patients.filter((p) => p.badge === 'urgent').length}
            color={colors.danger}
            onPress={() => router.push('/(portal)/dashboard/severe-caries')}
          />
          <ClickableStatCard
            testID="dashboard-stat-patients-tracked"
            icon={<UsersIcon color={colors.cyanLight} size={19} />}
            label="Patients Tracked"
            value={patients.length}
            color={colors.cyanLight}
            onPress={() => router.push('/(portal)/dashboard/patients')}
          />
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={140}>
        <GlassCard style={styles.heroCard}>
          <ShimmerSweep />
          <LinearGradient colors={['#6366f1', '#7c3aed', '#06b6d4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroFill} />
          <View style={styles.heroGlyph} pointerEvents="none">
            <Sparkles color="rgba(255,255,255,0.14)" size={140} strokeWidth={1} />
          </View>
          <View style={styles.heroBadge}>
            <Sparkles color="#fff" size={12} />
            <Text style={styles.heroBadgeTxt}>AI DUAL-MODEL TRIAGE</Text>
          </View>
          <Text style={styles.heroTitle}>Start Oral Screening</Text>
          <Text style={styles.heroDesc}>
            Dual-model triage: X-ray validity check, then caries confidence scoring — results save straight to the patient EHR.
          </Text>
          <PressableScale onPress={() => goto('scan')} style={styles.heroBtnPressable} innerStyle={styles.heroBtn}>
            <ScanLine color="#4338ca" size={17} />
            <Text style={styles.heroBtnTxt}>Scan Patient X-Ray</Text>
          </PressableScale>
        </GlassCard>
      </FadeSlideIn>

      <FadeSlideIn delay={200}>
        <Text style={styles.eyebrow}>QUICK ACTIONS</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(({ key, label, Icon, color }) => (
            <PressableScale
              key={key}
              onPress={() => goto(key)}
              scaleTo={0.95}
              style={styles.quickCardPressable}
              innerStyle={[styles.quickCard, { borderColor: `${color}40` }]}
            >
              <LinearGradient colors={[`${color}26`, 'transparent']} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.quickIconWrap, { backgroundColor: `${color}26`, shadowColor: color }]}>
                <Icon color={color} size={20} />
              </View>
              <Text style={styles.quickLabel}>{label}</Text>
            </PressableScale>
          ))}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={260}>
        <Text style={styles.eyebrow}>PATIENT ROSTER</Text>
        <GlassCard>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Urgent Attention Required</Text>
            {patients.filter((p) => p.badge === 'urgent').length > 5 && (
              <Text style={styles.viewAll} onPress={() => goto('patients')}>View all</Text>
            )}
          </View>
          {urgentPatients.length === 0 ? (
            <Text style={styles.emptyTxt}>No patients currently flagged as urgent.</Text>
          ) : (
            urgentPatients.map((p, idx) => (
              <PressableScale
                key={p.dbId}
                onPress={() => selectPatient(p.name)}
                scaleTo={0.98}
                innerStyle={[styles.patientRow, idx === urgentPatients.length - 1 && { marginBottom: 0 }]}
              >
                <View style={[styles.patientAccent, { backgroundColor: colors.danger }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientMeta}>ID: {p.id} | {p.desc}</Text>
                </View>
                <Badge badge={p.badge} label={p.status} />
              </PressableScale>
            ))
          )}
        </GlassCard>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 50, paddingBottom: 24 },
  orbA: {
    position: 'absolute', top: -40, right: -60, width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(99,102,241,0.10)',
  },
  orbB: {
    position: 'absolute', top: 160, left: -80, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(6,182,212,0.08)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  eyebrow: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: colors.cyanLight,
    marginBottom: spacing.sm, textTransform: 'uppercase',
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { color: colors.textMuted, fontSize: typography.body.fontSize, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  heroCard: { overflow: 'hidden', position: 'relative', padding: spacing.xl, marginBottom: spacing.xl },
  heroFill: { ...StyleSheet.absoluteFillObject },
  heroGlyph: { position: 'absolute', right: -20, bottom: -30 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radii.pill,
    paddingHorizontal: spacing.md, paddingVertical: 5, marginBottom: spacing.md,
  },
  heroBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  heroDesc: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body.fontSize, lineHeight: 20, marginBottom: spacing.xl, maxWidth: '85%' },
  heroBtnPressable: { alignSelf: 'flex-start' },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
  },
  heroBtnTxt: { color: '#4338ca', fontWeight: '800', fontSize: typography.body.fontSize },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  quickCardPressable: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 150,
  },
  quickCard: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: colors.glassFill,
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  quickLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  viewAll: { color: colors.cyanLight, fontWeight: '700', fontSize: typography.caption.fontSize },
  emptyTxt: { color: colors.textMuted, fontSize: typography.body.fontSize },
  patientRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glassFillStrong,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  patientAccent: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  patientName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  patientMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
});
