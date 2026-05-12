import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const setPendingImage = useStore((s) => s.setPendingImage);

  const navigateToResults = (base64: string, mediaType = 'image/jpeg') => {
    setPendingImage({ base64, mediaType });
    router.push('/results');
  };

  const handleCapture = async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      if (photo?.base64) {
        navigateToResults(photo.base64);
      }
    } finally {
      setCapturing(false);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      navigateToResults(result.assets[0].base64);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionBody}>
            MenuLens needs camera access to scan restaurant menus and analyze dishes.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryFallback} onPress={handleGallery}>
            <Ionicons name="images-outline" size={18} color={Colors.primary} />
            <Text style={styles.galleryFallbackText}>Choose from library instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* Gradient overlay top */}
      <View style={styles.topOverlay}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
            >
              <Ionicons
                name={flash === 'on' ? 'flash' : 'flash-off'}
                size={22}
                color="white"
              />
            </TouchableOpacity>

            <View style={styles.topCenter}>
              <Text style={styles.topHint}>Point at a restaurant menu</Text>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Viewfinder frame */}
      <View style={styles.frameOuter} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomOverlay}>
        <SafeAreaView edges={['bottom']}>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.sideBtn} onPress={handleGallery}>
              <Ionicons name="images-outline" size={26} color="white" />
              <Text style={styles.sideBtnLabel}>Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shutter, capturing && styles.shutterActive]}
              onPress={handleCapture}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>

            <View style={styles.sideBtn} />
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  permissionScreen: { flex: 1, backgroundColor: Colors.background },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { ...Typography.h2, color: Colors.text },
  permissionBody: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: { ...Typography.h4, color: Colors.background },
  galleryFallback: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  galleryFallbackText: { ...Typography.body, color: Colors.primary },

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topHint: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
  },

  frameOuter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '85%', aspectRatio: 1.6, position: 'relative' },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.xl,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  sideBtn: { width: 60, alignItems: 'center', gap: 4 },
  sideBtnLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterActive: { borderColor: Colors.primary },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
});
