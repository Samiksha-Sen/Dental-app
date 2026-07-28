import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ScrollView, Platform, Share, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  X, ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize2, RefreshCcw,
  Download, Printer, Share2,
} from 'lucide-react-native';
import AIStatusBadge from './AIStatusBadge';
import { colors, radii, spacing, typography } from '../../theme/tokens';

function InfoLine({ label, value }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    alert('Download failed: ' + e.message);
  }
}

export default function ImageViewerModal({ visible, item, onClose }) {
  const containerRef = useRef(null);
  const [resolution, setResolution] = useState(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible && item?.imageUrl) {
      scale.value = 1; savedScale.value = 1;
      translateX.value = 0; translateY.value = 0;
      savedTranslateX.value = 0; savedTranslateY.value = 0;
      rotation.value = 0;
      setResolution(null);
      Image.getSize(
        item.imageUrl,
        (w, h) => setResolution(`${w} × ${h} px`),
        () => setResolution('Unavailable')
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, item?.imageUrl]);

  if (!item) return null;

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 6)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => { savedTranslateX.value = translateX.value; savedTranslateY.value = translateY.value; });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const zoomBy = (factor) => {
    const next = Math.max(0.5, Math.min(savedScale.value * factor, 6));
    scale.value = withTiming(next, { duration: 200 });
    savedScale.value = next;
  };
  const resetView = () => {
    scale.value = withTiming(1, { duration: 220 }); savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 220 }); savedTranslateX.value = 0;
    translateY.value = withTiming(0, { duration: 220 }); savedTranslateY.value = 0;
    rotation.value = withTiming(0, { duration: 220 });
  };
  const rotateBy = (deg) => { rotation.value = withTiming(rotation.value + deg, { duration: 220 }); };

  const handleFullscreen = () => {
    if (Platform.OS === 'web' && containerRef.current && containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      alert('Fullscreen is available from the web version of the portal.');
    }
  };
  const handleDownload = () => {
    if (Platform.OS === 'web') downloadImage(item.imageUrl, `${item.scanCode}.png`);
    else alert('Downloading is available from the web version of the portal.');
  };
  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.print();
    else alert('Printing is available from the web version of the portal.');
  };
  const handleShare = () => {
    Share.share({ message: `Dental X-ray (${item.scanCode}) for ${item.patientName} — ${item.diagnosis}`, title: 'Dental X-ray' }).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{item.scanCode}</Text>
            <Text style={styles.headerSub}>{item.patientName} · {item.dateKey}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.viewerCol} ref={containerRef} nativeID="xray-viewer-surface">
            <GestureDetector gesture={composed}>
              <Animated.View style={[styles.imageWrap, animatedStyle]}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" />
              </Animated.View>
            </GestureDetector>

            <View style={styles.toolbar}>
              <TouchableOpacity style={styles.toolBtn} onPress={() => zoomBy(1.3)}><ZoomIn color="#fff" size={18} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => zoomBy(1 / 1.3)}><ZoomOut color="#fff" size={18} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => rotateBy(-90)}><RotateCcw color="#fff" size={18} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={() => rotateBy(90)}><RotateCw color="#fff" size={18} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={resetView}><RefreshCcw color="#fff" size={18} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={handleFullscreen}><Maximize2 color="#fff" size={18} /></TouchableOpacity>
              <View style={styles.toolDivider} />
              <TouchableOpacity style={styles.toolBtn} onPress={handleDownload}><Download color="#fff" size={18} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={handlePrint}><Printer color="#fff" size={18} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={handleShare}><Share2 color="#fff" size={18} /></TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.panel} contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={styles.panelTitle}>AI Analysis Summary</Text>
            <AIStatusBadge status={item.aiStatus} style={{ marginBottom: spacing.md }} />
            <InfoLine label="Diagnosis" value={item.diagnosis} />
            <InfoLine label="Confidence" value={item.confidence != null ? `${Math.round(item.confidence)}%` : '—'} />
            <InfoLine label="Clinical Notes" value={item.notes} />

            <View style={styles.divider} />
            <Text style={styles.panelTitle}>Patient Information</Text>
            <InfoLine label="Patient Name" value={item.patientName} />
            <InfoLine label="Patient ID" value={item.patientCode} />
            <InfoLine label="Age" value={`${item.age} yrs`} />
            <InfoLine label="Gender" value={item.gender} />
            <InfoLine label="Doctor" value={item.doctor} />
            <InfoLine label="Treatment" value={item.treatment} />
            <InfoLine label="Scan Type" value={item.scanType} />
            <InfoLine label="Upload Date" value={item.dateKey} />
            <InfoLine label="Image Resolution" value={resolution || 'Loading…'} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0B1220' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: Platform.OS === 'web' ? spacing.lg : 50,
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  viewerCol: { flex: 1, minWidth: 280, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imageWrap: { width: '90%', height: '80%', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  toolbar: {
    position: 'absolute', bottom: spacing.xl, flexDirection: 'row', gap: spacing.sm,
    backgroundColor: 'rgba(15,23,42,0.7)', borderRadius: radii.pill, padding: spacing.sm,
    flexWrap: 'wrap', justifyContent: 'center', maxWidth: '92%',
  },
  toolBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  toolDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
  panel: { width: 320, maxWidth: '100%', backgroundColor: colors.bgCard, borderLeftWidth: 1, borderLeftColor: colors.glassBorder },
  panelTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.lg },
  infoLine: { marginBottom: spacing.md },
  infoLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '600', marginTop: 2 },
});
