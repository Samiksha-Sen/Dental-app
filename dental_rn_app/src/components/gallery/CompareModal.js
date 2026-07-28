import React, { useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, Switch, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { X, ArrowLeftRight, Columns2, MoveHorizontal, TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

// Holds the shared values driving one comparison pane's zoom/pan transform.
// The actual Gesture objects are built separately by buildGesture() below,
// so the `mirrorRef` wiring (set right before render, per the Sync toggle)
// is always current instead of being frozen at first render.
function useZoomPan() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return { scale, savedScale, tx, ty, savedTx, savedTy, style, mirrorRef: null };
}

function ComparePane({ item, zoom, label }) {
  return (
    <View style={styles.pane}>
      <View style={styles.paneHeader}>
        <Text style={styles.paneLabel}>{label}</Text>
        {item && <Text style={styles.paneDate}>{item.dateKey}</Text>}
      </View>
      {item ? (
        <GestureDetector gesture={zoom.gesture}>
          <Animated.View style={[styles.paneImageWrap, zoom.style]}>
            <Image source={{ uri: item.imageUrl }} style={styles.paneImage} resizeMode="contain" />
          </Animated.View>
        </GestureDetector>
      ) : (
        <View style={styles.panePlaceholder}>
          <Text style={styles.panePlaceholderTxt}>Select an X-ray</Text>
        </View>
      )}
    </View>
  );
}

function SwipeCompare({ itemA, itemB }) {
  const { width: winWidth } = useWindowDimensions();
  const frameWidth = Math.min(winWidth - 64, 640);
  const dividerX = useSharedValue(frameWidth / 2);

  const pan = Gesture.Pan().onUpdate((e) => {
    dividerX.value = Math.max(0, Math.min(frameWidth, e.x));
  });

  const clipStyle = useAnimatedStyle(() => ({ width: dividerX.value }));
  const handleStyle = useAnimatedStyle(() => ({ left: dividerX.value - 14 }));

  return (
    <View style={[styles.swipeFrame, { width: frameWidth }]}>
      <Image source={{ uri: itemA.imageUrl }} style={styles.swipeImage} resizeMode="contain" />
      <Animated.View style={[styles.swipeClip, clipStyle]}>
        <Image source={{ uri: itemB.imageUrl }} style={[styles.swipeImage, { width: frameWidth }]} resizeMode="contain" />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.swipeHandle, handleStyle]}>
          <MoveHorizontal color="#fff" size={16} />
        </Animated.View>
      </GestureDetector>
      <Text style={styles.swipeCaptionL}>{itemA.dateKey}</Text>
      <Text style={styles.swipeCaptionR}>{itemB.dateKey}</Text>
    </View>
  );
}

function CompareRow({ label, a, b, deltaGoodDown }) {
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={styles.compareVal} numberOfLines={1}>{a ?? '—'}</Text>
      <Text style={styles.compareVal} numberOfLines={1}>{b ?? '—'}</Text>
    </View>
  );
}

export default function CompareModal({ visible, slotA, slotB, allItems, onClose, onChangeSlot }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [mode, setMode] = useState('side'); // 'side' | 'swipe'
  const [sync, setSync] = useState(true);
  const [pickerFor, setPickerFor] = useState(null); // 'A' | 'B' | null

  const zoomA = useZoomPan();
  const zoomB = useZoomPan();
  // Wire mirroring only when sync is enabled, without re-creating the gesture objects each render.
  zoomA.mirrorRef = sync ? zoomB : null;
  zoomB.mirrorRef = sync ? zoomA : null;

  const timeline = useMemo(() => {
    if (!slotA?.patientId || slotA.patientId !== slotB?.patientId) return [];
    return allItems
      .filter((i) => i.patientId === slotA.patientId && i.id !== slotA.id && i.id !== slotB.id)
      .sort((x, y) => new Date(x.uploadedAt) - new Date(y.uploadedAt));
  }, [allItems, slotA, slotB]);

  if (!visible) return null;

  const confDelta = slotA?.confidence != null && slotB?.confidence != null ? Math.round(slotB.confidence - slotA.confidence) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Compare X-rays</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X color="#fff" size={20} /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody}>
          <View style={styles.slotPickerRow}>
            {[{ key: 'A', item: slotA }, { key: 'B', item: slotB }].map(({ key, item }) => (
              <TouchableOpacity key={key} style={styles.slotPickerBtn} onPress={() => setPickerFor(key)}>
                {item ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.slotThumb} />
                ) : (
                  <View style={styles.slotThumbEmpty} />
                )}
                <Text style={styles.slotPickerTxt} numberOfLines={1}>
                  {item ? `${key}: ${item.patientName} (${item.dateKey})` : `Select Scan ${key}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {slotA && slotB && (
            <>
              <View style={styles.modeRow}>
                <TouchableOpacity style={[styles.modeChip, mode === 'side' && styles.modeChipActive]} onPress={() => setMode('side')}>
                  <Columns2 color={mode === 'side' ? '#fff' : colors.textSecondary} size={14} />
                  <Text style={[styles.modeChipTxt, mode === 'side' && styles.modeChipTxtActive]}>Side by Side</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeChip, mode === 'swipe' && styles.modeChipActive]} onPress={() => setMode('swipe')}>
                  <ArrowLeftRight color={mode === 'swipe' ? '#fff' : colors.textSecondary} size={14} />
                  <Text style={[styles.modeChipTxt, mode === 'swipe' && styles.modeChipTxtActive]}>Swipe Compare</Text>
                </TouchableOpacity>
                {mode === 'side' && (
                  <View style={styles.syncRow}>
                    <Text style={styles.syncTxt}>Sync Zoom & Pan</Text>
                    <Switch value={sync} onValueChange={setSync} trackColor={{ false: colors.glassBorder, true: colors.primary }} thumbColor="#fff" />
                  </View>
                )}
              </View>

              {mode === 'side' ? (
                <View style={[styles.paneRow, !isDesktop && styles.paneRowStacked]}>
                  <ComparePane item={slotA} zoom={{ gesture: buildGesture(zoomA), style: zoomA.style }} label="Before · Scan A" />
                  <ComparePane item={slotB} zoom={{ gesture: buildGesture(zoomB), style: zoomB.style }} label="After · Scan B" />
                </View>
              ) : (
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                  <SwipeCompare itemA={slotA} itemB={slotB} />
                </View>
              )}

              <View style={styles.compareTable}>
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel} />
                  <Text style={styles.compareColHeader}>Scan A</Text>
                  <Text style={styles.compareColHeader}>Scan B</Text>
                </View>
                <CompareRow label="Patient" a={slotA.patientName} b={slotB.patientName} />
                <CompareRow label="Scan Date" a={slotA.dateKey} b={slotB.dateKey} />
                <CompareRow label="Scan Type" a={slotA.scanType} b={slotB.scanType} />
                <CompareRow label="Doctor" a={slotA.doctor} b={slotB.doctor} />
                <CompareRow label="AI Diagnosis" a={slotA.diagnosis} b={slotB.diagnosis} />
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel}>Confidence</Text>
                  <Text style={styles.compareVal}>{slotA.confidence != null ? `${Math.round(slotA.confidence)}%` : '—'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                    <Text style={styles.compareVal}>{slotB.confidence != null ? `${Math.round(slotB.confidence)}%` : '—'}</Text>
                    {confDelta != null && confDelta !== 0 && (
                      confDelta > 0
                        ? <TrendingUp color={colors.success} size={14} />
                        : <TrendingDown color={colors.danger} size={14} />
                    )}
                  </View>
                </View>
              </View>

              {timeline.length > 0 && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={styles.timelineTitle}>Scan Progression Timeline</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                    {timeline.map((t) => (
                      <View key={t.id} style={styles.timelineItem}>
                        <Image source={{ uri: t.imageUrl }} style={styles.timelineThumb} />
                        <Text style={styles.timelineDate}>{t.dateKey}</Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <TouchableOpacity style={styles.timelineBtn} onPress={() => onChangeSlot('A', t)}>
                            <Text style={styles.timelineBtnTxt}>Set A</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.timelineBtn} onPress={() => onChangeSlot('B', t)}>
                            <Text style={styles.timelineBtnTxt}>Set B</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>

      <Modal visible={!!pickerFor} transparent animationType="fade" onRequestClose={() => setPickerFor(null)}>
        <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setPickerFor(null)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Scan {pickerFor}</Text>
              <TouchableOpacity onPress={() => setPickerFor(null)}><X color={colors.textMuted} size={18} /></TouchableOpacity>
            </View>
            <ScrollView>
              {allItems.map((it) => (
                <TouchableOpacity
                  key={it.id}
                  style={styles.pickerRow}
                  onPress={() => { onChangeSlot(pickerFor, it); setPickerFor(null); }}
                >
                  <Image source={{ uri: it.imageUrl }} style={styles.pickerThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerRowTitle} numberOfLines={1}>{it.patientName}</Text>
                    <Text style={styles.pickerRowSub}>{it.dateKey} · {it.scanCode}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

function buildGesture(zoom) {
  // Rebuilds the Simultaneous(pinch, pan) gesture each render bound to the
  // current mirrorRef so the Sync toggle takes effect without recreating shared values.
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.max(0.5, Math.min(zoom.savedScale.value * e.scale, 6));
      zoom.scale.value = next;
      if (zoom.mirrorRef) { zoom.mirrorRef.scale.value = next; zoom.mirrorRef.savedScale.value = next; }
    })
    .onEnd(() => { zoom.savedScale.value = zoom.scale.value; });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const nx = zoom.savedTx.value + e.translationX;
      const ny = zoom.savedTy.value + e.translationY;
      zoom.tx.value = nx; zoom.ty.value = ny;
      if (zoom.mirrorRef) { zoom.mirrorRef.tx.value = nx; zoom.mirrorRef.ty.value = ny; zoom.mirrorRef.savedTx.value = nx; zoom.mirrorRef.savedTy.value = ny; }
    })
    .onEnd(() => { zoom.savedTx.value = zoom.tx.value; zoom.savedTy.value = zoom.ty.value; });

  return Gesture.Simultaneous(pinch, pan);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0B1220' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: Platform.OS === 'web' ? spacing.lg : 50 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  scrollBody: { padding: spacing.lg, paddingBottom: spacing.xxl },

  slotPickerRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' },
  slotPickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: radii.sm, padding: spacing.sm, flex: 1, minWidth: 220,
  },
  slotThumb: { width: 44, height: 44, borderRadius: radii.sm },
  slotThumbEmpty: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: 'rgba(255,255,255,0.1)' },
  slotPickerTxt: { color: '#fff', fontSize: 12, fontWeight: '600', flexShrink: 1 },

  modeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  modeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeChipTxt: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  modeChipTxtActive: { color: '#fff' },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: 'auto' },
  syncTxt: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  paneRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  paneRowStacked: { flexDirection: 'column' },
  pane: { flex: 1, minWidth: 260, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.md, overflow: 'hidden', height: 360 },
  paneHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.sm },
  paneLabel: { color: '#fff', fontSize: 11, fontWeight: '700' },
  paneDate: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  paneImageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  paneImage: { width: '100%', height: '100%' },
  panePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  panePlaceholderTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  swipeFrame: { height: 360, position: 'relative', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.md, overflow: 'hidden' },
  swipeImage: { width: '100%', height: '100%' },
  swipeClip: { position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden' },
  swipeHandle: {
    position: 'absolute', top: '50%', marginTop: -14, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  swipeCaptionL: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, color: '#fff', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, borderRadius: 4 },
  swipeCaptionR: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, color: '#fff', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, borderRadius: 4 },

  compareTable: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radii.md, padding: spacing.md },
  compareRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', gap: spacing.sm },
  compareLabel: { width: 100, color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  compareColHeader: { flex: 1, color: '#fff', fontSize: 11, fontWeight: '800' },
  compareVal: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '600' },

  timelineTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: spacing.sm },
  timelineItem: { width: 100, alignItems: 'center' },
  timelineThumb: { width: 80, height: 80, borderRadius: radii.sm, marginBottom: 4 },
  timelineDate: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 4 },
  timelineBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  timelineBtnTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },

  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg,
    borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg, maxHeight: '75%',
  },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  pickerTitle: { ...typography.h3, color: colors.textPrimary },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  pickerThumb: { width: 48, height: 48, borderRadius: radii.sm },
  pickerRowTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize },
  pickerRowSub: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
});
