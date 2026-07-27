import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Platform, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import {
  CloudUpload,
  Camera,
  CheckCircle2,
  Save,
  Download,
  Share2,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import GlassCard from '../../src/components/GlassCard';
import GradientButton from '../../src/components/GradientButton';
import CircularGauge from '../../src/components/CircularGauge';
import LaserScanLine from '../../src/animations/LaserScanLine';
import FadeSlideIn from '../../src/animations/FadeSlideIn';
import SuccessCheckmark from '../../src/animations/SuccessCheckmark';
import * as authService from '../../src/services/authService';
import * as storageService from '../../src/services/storageService';
import * as scanService from '../../src/services/scanService';
import * as databaseService from '../../src/services/databaseService';
import { predictXray } from '../../src/services/predictApi';
import { usePatients } from '../../src/hooks/usePatients';
import { useScanHistory } from '../../src/hooks/useScanHistory';
import { useSettings } from '../../src/hooks/useSettings';
import { colors, gradients, radii, spacing, typography } from '../../src/theme/tokens';

function ScannerRing() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2600, easing: Easing.linear }), -1);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return (
    <Animated.View style={[styles.scannerRing, style]}>
      <LinearGradient
        colors={['transparent', colors.cyanLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scannerRingFill}
      />
    </Animated.View>
  );
}

function ImageParticles() {
  const particles = React.useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * 360,
      delay: i * 120,
    })),
    []
  );
  return (
    <>
      {particles.map((p) => (
        <MotiView
          key={p.id}
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: 1 }}
          transition={{ type: 'timing', duration: 1800, delay: p.delay, loop: true }}
          style={[
            styles.particle,
            {
              left: `${50 + 46 * Math.cos((p.angle * Math.PI) / 180)}%`,
              top: `${50 + 46 * Math.sin((p.angle * Math.PI) / 180)}%`,
            },
          ]}
        />
      ))}
    </>
  );
}

export default function Scan() {
  const { patients, saveScanToEHR } = usePatients();
  const { loadScanHistory } = useScanHistory();
  const { apiUrl, confidenceThreshold } = useSettings();

  const [activePatientName, setActivePatientName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Initializing neural network...');
  const [predictionCondition, setPredictionCondition] = useState('');
  const [predictionExtraction, setPredictionExtraction] = useState('');
  const [predictionConfidence, setPredictionConfidence] = useState(0);
  const [saved, setSaved] = useState(false);
  const [lastScanId, setLastScanId] = useState(null);
  const [lastImageUrl, setLastImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!activePatientName && patients.length > 0) {
      setActivePatientName(patients[0].name);
    }
  }, [patients, activePatientName]);

  const resetImageState = () => {
    setIsScanning(false);
    setPredictionCondition('');
    setPredictionExtraction('');
    setPredictionConfidence(0);
    setLastScanId(null);
    setLastImageUrl(null);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access media library is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setSelectedFile(null);
        resetImageState();
      }
    } catch (e) {
      alert('Failed to pick image: ' + e.message);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access camera is required!');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setSelectedFile(null);
        resetImageState();
      }
    } catch (e) {
      alert('Failed to take photo: ' + e.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const uri = URL.createObjectURL(file);
      setSelectedFile(uri);
      setSelectedImage(null);
      resetImageState();
    }
  };

  const triggerUpload = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current && fileInputRef.current.click();
    } else {
      pickImage();
    }
  };

  const startScan = () => {
    const uri = selectedImage || selectedFile;
    if (!uri) {
      alert('Please select an X-Ray image first.');
      return;
    }
    if (!apiUrl) {
      alert('No AI API URL configured. Please set one in Settings before scanning.');
      return;
    }
    setScanProgress(0);
    setScanStatusText('Initializing neural network...');
    setIsScanning(true);
  };

  const handleResetScan = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    resetImageState();
  };

  const handleSaveScanToEHR = async () => {
    const { error } = await saveScanToEHR({
      patientName: activePatientName,
      predictionCondition,
      predictionExtraction,
      predictionConfidence,
      scanId: lastScanId,
      imageUrl: lastImageUrl,
    });
    if (error) {
      alert(`Error: Failed to save diagnostic report — ${error.message}`);
      return;
    }
    alert(`Success: Diagnostic report saved to ${activePatientName}'s EHR timeline!`);
  };

  // Handle scanning: fires when isScanning flips to true
  useEffect(() => {
    if (!isScanning) return;

    let interval;

    const performScan = async () => {
      try {
        const uri = selectedImage || selectedFile;
        if (!uri) {
          throw new Error('No image selected');
        }

        const { user: currentUser } = await authService.getCurrentUser();
        const currentUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';

        let p = 0;
        interval = setInterval(() => {
          p = Math.min(p + 10, 90);
          setScanProgress(p);
          if (p === 20) setScanStatusText('Uploading image to Supabase Storage...');
          if (p === 40) setScanStatusText('Saving initial scan record to database...');
          if (p === 60) setScanStatusText('Running caries_model1.h5 classifier...');
          if (p === 80) setScanStatusText('Updating scan record in Supabase...');
        }, 250);

        const fileName = `xray_${Date.now()}.png`;
        const { publicUrl, error: uploadErr } = await storageService.uploadXray(uri, currentUserId, fileName);
        if (uploadErr) {
          console.warn('Supabase storage upload notice:', uploadErr.message);
        }
        const storageUrl = publicUrl || uri;

        const activePatient = patients.find(p => p.name === activePatientName);

        const { data: scanRow, error: insertScanErr } = await scanService.createScanRecord({
          userId: currentUser?.id || null,
          patientId: activePatient?.dbId || null,
          imageUrl: storageUrl,
          status: 'processing',
        });
        if (insertScanErr) {
          console.warn('Supabase scans insert notice:', insertScanErr.message);
        }
        const createdScanId = scanRow?.id;
        setLastScanId(createdScanId || null);
        setLastImageUrl(storageUrl);

        // Call existing Flask AI API (DO NOT MODIFY AI PREDICTION LOGIC)
        const data = await predictXray(uri, apiUrl, confidenceThreshold / 100);

        const condition = data.condition || '';
        const extraction = data.extraction || '';
        const isCaries = condition.toLowerCase().startsWith('caries');
        const finalPrediction = isCaries ? 'Caries Detected' : 'No Caries Detected';
        const finalConfidence = Number(data.confidence || 0);

        if (createdScanId) {
          const { error: updateScanErr } = await scanService.updateScanPrediction(createdScanId, {
            prediction: finalPrediction,
            confidence: finalConfidence,
            status: 'completed',
          });
          if (updateScanErr) {
            console.warn('Supabase scans update notice:', updateScanErr.message);
          }

          await databaseService.createReport({
            scan_id: createdScanId,
            severity: isCaries ? 'high' : 'normal',
            recommendation: extraction || 'Routine clinical monitoring',
          });
        }

        loadScanHistory();

        clearInterval(interval);
        setScanProgress(100);
        setScanStatusText('Diagnosis complete!');

        setTimeout(() => {
          setIsScanning(false);

          if (data.error) {
            alert(data.error);
            return;
          }

          setPredictionCondition(finalPrediction);
          setPredictionExtraction(extraction);
          setPredictionConfidence(finalConfidence);
        }, 800);

      } catch (error) {
        console.log('Scan error:', error.message);
        clearInterval(interval);
        setIsScanning(false);
        setPredictionConfidence(0);
        setPredictionCondition('');
        setPredictionExtraction('');
        alert('Scan failed.\n\nError: ' + error.message);
      }
    };

    performScan();

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const imageUri = selectedImage || selectedFile;
  const isCaries = predictionCondition === 'Caries Detected';

  const onSave = async () => {
    await handleSaveScanToEHR();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const reportText = predictionCondition
    ? `DentalAI Diagnostic Report\nPatient: ${activePatientName}\nResult: ${predictionCondition}\nConfidence: ${predictionConfidence.toFixed(1)}%\nRecommendation: ${predictionExtraction}`
    : '';

  const onShare = () => {
    Share.share({ message: reportText, title: 'DentalAI Diagnostic Report' }).catch(() => {});
  };

  // --- Scanning state ---
  if (isScanning) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.title}>AI Model Analysing X-Ray...</Text>
        <View style={styles.scanStage}>
          {imageUri && <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" blurRadius={1} />}
          <View style={styles.scanGridOverlay} />
          <LaserScanLine active />
          <ScannerRing />
        </View>
        <GlassCard style={{ alignItems: 'center' }}>
          <Sparkles color={colors.cyanLight} size={22} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.statusTxt}>{scanStatusText}</Text>
          <View style={styles.progressTrack}>
            <MotiView
              animate={{ width: `${scanProgress}%` }}
              transition={{ type: 'timing', duration: 200 }}
              style={styles.progressFill}
            >
              <LinearGradient colors={gradients.cyan} style={StyleSheet.absoluteFillObject} />
            </MotiView>
          </View>
          <Text style={styles.progressPct}>{scanProgress}% Complete</Text>
        </GlassCard>
      </View>
    );
  }

  // --- Result state ---
  if (predictionCondition) {
    const accent = isCaries ? colors.danger : colors.success;
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeSlideIn>
          <Text style={styles.title}>AI Diagnostics Report</Text>
          <Text style={styles.patientLine}>
            Patient: <Text style={styles.patientLineName}>{activePatientName}</Text>
          </Text>
        </FadeSlideIn>

        <FadeSlideIn delay={80}>
          <View style={styles.imageFrame}>
            {imageUri && <Image source={{ uri: imageUri }} style={styles.resultImage} resizeMode="contain" />}
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={140}>
          <GlassCard>
            <Text style={styles.label}>AI Diagnostic Outcome</Text>
            <View style={[styles.outcomeBadge, { backgroundColor: isCaries ? colors.dangerBg : colors.successBg }]}>
              {isCaries ? <Sparkles color={accent} size={14} /> : <CheckCircle2 color={accent} size={14} />}
              <Text style={[styles.outcomeTxt, { color: accent }]}>
                {isCaries ? 'Caries Found' : 'No Caries Detected'}
              </Text>
            </View>

            <Text style={styles.explainTxt}>
              {isCaries
                ? 'The AI model has detected demineralization layers on the crown surface. Urgent restoration or extraction is recommended.'
                : 'No significant demineralization or enamel erosion was detected. The tooth structural integrity is within standard parameters.'}
            </Text>

            <View style={styles.divider} />

            <View style={styles.statGrid}>
              <CircularGauge size={90} value={predictionConfidence} color={accent} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={styles.label}>Clinical Recommendation</Text>
                <Text style={[styles.recTxt, { color: accent }]}>{predictionExtraction}</Text>
              </View>
            </View>
          </GlassCard>
        </FadeSlideIn>

        <FadeSlideIn delay={200}>
          {saved ? (
            <View style={styles.savedWrap}>
              <SuccessCheckmark size={56} />
              <Text style={styles.savedTxt}>Saved to Patient EHR</Text>
            </View>
          ) : (
            <GradientButton
              title="Save to Patient EHR"
              icon={<Save color="#fff" size={17} />}
              onPress={onSave}
              colorsOverride={gradients.success}
              style={{ marginBottom: spacing.md }}
            />
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={onShare}>
              <Share2 color={colors.cyanLight} size={16} />
              <Text style={styles.ghostBtnTxt}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={onShare}>
              <Download color={colors.cyanLight} size={16} />
              <Text style={styles.ghostBtnTxt}>Download Report</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetScan}>
            <RotateCcw color={colors.primary} size={16} />
            <Text style={styles.resetBtnTxt}>Scan Another X-Ray</Text>
          </TouchableOpacity>
        </FadeSlideIn>
      </ScrollView>
    );
  }

  // --- Upload state ---
  return (
    <View style={styles.centerWrap}>
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingVertical: 10 }}>
        <FadeSlideIn>
          <Text style={styles.title}>Upload Dental X-Ray for AI Analysis</Text>
        </FadeSlideIn>

        <FadeSlideIn delay={60}>
          <GlassCard style={{ paddingVertical: spacing.md }}>
            <Text style={styles.label}>Select Patient for Scan</Text>
            <View style={styles.chipRow}>
              {patients.map((p) => {
                const active = activePatientName === p.name;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setActivePatientName(p.name)}
                  >
                    <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </FadeSlideIn>

        <FadeSlideIn delay={120}>
          <TouchableOpacity style={styles.dropzone} onPress={triggerUpload}>
            <View style={styles.dropzoneIconWrap}>
              {(selectedImage || selectedFile) ? (
                <CheckCircle2 color={colors.success} size={30} />
              ) : (
                <CloudUpload color={colors.primary} size={30} />
              )}
            </View>
            <Text style={styles.dropzoneTitle}>
              {(selectedImage || selectedFile) ? 'X-Ray Selected — tap to change' : 'Select X-Ray Image'}
            </Text>
            <Text style={styles.dropzoneDesc}>
              {(selectedImage || selectedFile)
                ? 'Ready to analyse. Press the button below.'
                : 'Tap here to select PNG/JPG file from your device'}
            </Text>
            {(selectedImage || selectedFile) && (
              <View style={styles.previewWrap}>
                <Image source={{ uri: selectedImage || selectedFile }} style={styles.previewImg} />
                <ImageParticles />
              </View>
            )}
          </TouchableOpacity>
        </FadeSlideIn>

        {Platform.OS !== 'web' && (
          <FadeSlideIn delay={160}>
            <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
              <Camera color="#fff" size={18} />
              <Text style={styles.cameraBtnTxt}>Take Live Photo of X-Ray</Text>
            </TouchableOpacity>
          </FadeSlideIn>
        )}

        {Platform.OS === 'web' && (
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
        )}

        <FadeSlideIn delay={200}>
          {(selectedImage || selectedFile) ? (
            <GradientButton
              title="Analyse X-Ray with AI Model"
              icon={<Sparkles color="#fff" size={17} />}
              onPress={startScan}
              style={{ marginBottom: spacing.lg }}
            />
          ) : (
            <GlassCard style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <Text style={{ color: colors.textMuted, fontSize: typography.caption.fontSize }}>
                Select an X-Ray image above to enable analysis
              </Text>
            </GlassCard>
          )}
        </FadeSlideIn>

        <FadeSlideIn delay={240}>
          <GlassCard>
            <Text style={styles.label}>Model info</Text>
            <Text style={styles.specItem}>✓ Model: caries_model1.h5 (256×256 RGB)</Text>
            <Text style={styles.specItem}>✓ Output: Binary caries classification</Text>
            <Text style={styles.specItem}>✓ Recommendation: Surgical / Manual extraction</Text>
          </GlassCard>
        </FadeSlideIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, padding: spacing.xl, paddingTop: 50 },
  scroll: { padding: spacing.lg, paddingTop: 50, paddingBottom: 24 },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  patientLine: { color: colors.textSecondary, fontSize: typography.body.fontSize, marginBottom: spacing.lg },
  patientLineName: { fontWeight: '700', color: colors.textPrimary },

  scanStage: {
    height: 240,
    borderRadius: radii.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  scannerRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerRingFill: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 45,
    opacity: 0.6,
  },
  statusTxt: { color: colors.textSecondary, fontSize: typography.body.fontSize, textAlign: 'center', marginBottom: spacing.md },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.glassFillStrong, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  progressPct: { color: colors.cyanLight, fontSize: typography.caption.fontSize, fontWeight: '700' },

  imageFrame: { alignItems: 'center', marginBottom: spacing.lg },
  resultImage: { width: '100%', height: 240, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder },

  label: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
  outcomeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.sm, marginBottom: spacing.md,
  },
  outcomeTxt: { fontWeight: '800', fontSize: typography.body.fontSize },
  explainTxt: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: spacing.lg },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginBottom: spacing.lg },
  statGrid: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  recTxt: { fontWeight: '800', fontSize: 16, marginTop: 2 },

  savedWrap: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
  savedTxt: { color: colors.success, fontWeight: '700', marginTop: spacing.sm },

  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  ghostBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassFill,
    borderRadius: radii.sm, paddingVertical: 12,
  },
  ghostBtnTxt: { color: colors.cyanLight, fontWeight: '700', fontSize: 13 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(15,118,110,0.35)', backgroundColor: 'rgba(15,118,110,0.08)',
    borderRadius: radii.md, paddingVertical: 14, marginBottom: 30,
  },
  resetBtnTxt: { color: colors.primary, fontWeight: '700', fontSize: 15 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { color: colors.textSecondary, fontSize: 12 },
  chipTxtActive: { color: '#fff', fontWeight: '700' },

  dropzone: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.glassBorder,
    borderRadius: radii.lg, alignItems: 'center', padding: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  dropzoneIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.glassFillStrong,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  dropzoneTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.body.fontSize, marginBottom: 4, textAlign: 'center' },
  dropzoneDesc: { color: colors.textMuted, fontSize: typography.caption.fontSize, textAlign: 'center' },
  previewWrap: { marginTop: spacing.md, width: 140, height: 140 },
  previewImg: { width: 140, height: 140, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.primary },
  particle: {
    position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.cyanLight,
  },

  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radii.md, paddingVertical: 14, marginBottom: spacing.lg,
  },
  cameraBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  specItem: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
});
