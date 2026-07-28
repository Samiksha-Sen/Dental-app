import React, { useState } from 'react';
import { View, Text, Image, Pressable, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import {
  Eye, Columns2, Download, Trash2, Heart, MoreVertical, X,
  Printer, Share2, UserRound, RefreshCw,
} from 'lucide-react-native';
import AIStatusBadge from './AIStatusBadge';
import GlassCard from '../GlassCard';
import { colors, radii, spacing, typography } from '../../theme/tokens';

function ActionIcon({ Icon, onPress, active, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
      <Icon color={active ? colors.danger : (color || colors.textSecondary)} size={16} fill={active ? colors.danger : 'none'} />
    </TouchableOpacity>
  );
}

export default function XrayCard({
  item, onView, onCompare, onDownload, onDelete, onToggleFavourite, onPrint, onShare, onOpenPatient, onRerun,
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const diagnosisColor = item.prediction === 'Caries Detected' ? colors.danger : item.prediction === 'No Caries Detected' ? colors.success : colors.textMuted;

  return (
    <MotiView
      animate={{ translateY: hovered ? -4 : 0, scale: hovered ? 1.015 : 1 }}
      transition={{ type: 'timing', duration: 180 }}
    >
      <GlassCard
        glow={hovered ? colors.primary : undefined}
        style={styles.card}
      >
        <Pressable
          onPress={onView}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
        >
          <View style={styles.imageWrap}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            <View style={styles.imageTopRow}>
              <AIStatusBadge status={item.aiStatus} />
              <TouchableOpacity onPress={onToggleFavourite} style={styles.favBtn}>
                <Heart color={item.favourite ? colors.danger : '#fff'} fill={item.favourite ? colors.danger : 'transparent'} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>

        <View style={styles.body}>
          <View style={styles.topLine}>
            <Text style={styles.patientName} numberOfLines={1}>{item.patientName}</Text>
            <Text style={styles.scanCode}>{item.scanCode}</Text>
          </View>
          <Text style={styles.metaLine} numberOfLines={1}>{item.patientCode} · {item.dateKey} · {item.scanType}</Text>
          <Text style={styles.metaLine} numberOfLines={1}>{item.doctor}</Text>

          <View style={styles.diagRow}>
            <Text style={[styles.diagTxt, { color: diagnosisColor }]} numberOfLines={1}>{item.diagnosis}</Text>
            {item.confidence != null && (
              <Text style={styles.confTxt}>{Math.round(item.confidence)}%</Text>
            )}
          </View>

          <View style={styles.actionsRow}>
            <ActionIcon Icon={Eye} onPress={onView} />
            <ActionIcon Icon={Columns2} onPress={onCompare} />
            <ActionIcon Icon={Download} onPress={onDownload} />
            <ActionIcon Icon={Heart} onPress={onToggleFavourite} active={item.favourite} />
            <ActionIcon Icon={Trash2} onPress={onDelete} color={colors.danger} />
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.actionBtn}>
              <MoreVertical color={colors.textMuted} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <MotiView
            from={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 160 }}
            style={styles.menuCard}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>More actions</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}><X color={colors.textMuted} size={18} /></TouchableOpacity>
            </View>
            {[
              { label: 'Print', Icon: Printer, onPress: onPrint },
              { label: 'Share', Icon: Share2, onPress: onShare },
              { label: 'Open Patient Profile', Icon: UserRound, onPress: onOpenPatient },
              { label: 'Run AI Analysis Again', Icon: RefreshCw, onPress: onRerun },
            ].map((opt) => (
              <TouchableOpacity key={opt.label} style={styles.menuRow} onPress={() => { setMenuOpen(false); opt.onPress(); }}>
                <opt.Icon color={colors.textSecondary} size={16} />
                <Text style={styles.menuRowTxt}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </MotiView>
        </Pressable>
      </Modal>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  imageWrap: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.glassFillStrong },
  image: { width: '100%', height: '100%' },
  imageTopRow: {
    position: 'absolute', top: spacing.sm, left: spacing.sm, right: spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  favBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: spacing.md },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  patientName: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize, flexShrink: 1 },
  scanCode: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  metaLine: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  diagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  diagTxt: { fontWeight: '700', fontSize: typography.caption.fontSize, flexShrink: 1 },
  confTxt: { color: colors.textSecondary, fontWeight: '800', fontSize: typography.caption.fontSize },
  actionsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  actionBtn: { padding: 6 },

  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  menuCard: {
    width: '100%', maxWidth: 320, backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg,
  },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  menuTitle: { ...typography.h3, color: colors.textPrimary, fontSize: 15 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  menuRowTxt: { color: colors.textPrimary, fontSize: typography.body.fontSize },
});
