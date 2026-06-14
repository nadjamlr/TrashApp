import { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Linking, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraView as CameraViewType } from 'expo-camera';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import { ScanOverlay } from '@/components/camera/ScanOverlay';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Radius } from '@/constants/Radius';
import { identifyImage } from '@/services/visionService';

const LOADING_STEPS = [
  'Bild wird geladen...',
  'Objekt wird erkannt...',
  'Material wird analysiert...',
  'Ergebnis wird aufbereitet...',
];

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const cameraRef = useRef<CameraViewType>(null);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  useEffect(() => {
    if (!isLoading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading]);

  async function handleImage(uri: string) {
    setCapturedUri(uri);
    setIsLoading(true);
    try {
      const visionResult = await identifyImage(uri);
      setCapturedUri(null);
      router.push({
        pathname: '/camera/result',
        params: {
          label: visionResult.label,
          material: visionResult.material,
          confidence: String(visionResult.confidence),
        },
      });
    } catch (e) {
      console.error(e);
      setCapturedUri(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) {
      await handleImage(photo.uri);
    }
  }

  if (!permission) {
    return <View style={styles.fill} />;
  }

  if (!permission.granted) {
    if (permission.canAskAgain) {
      requestPermission();
      return <View style={styles.fill} />;
    }
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[Typography.p1, { color: colors.text, marginBottom: Spacing.md, textAlign: 'center', paddingHorizontal: Spacing.lg }]}>
          Camera access was denied. Please enable it in Settings.
        </Text>
        <Pressable onPress={() => Linking.openSettings()} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={[Typography.p1, { color: colors.text }]}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {capturedUri ? (
        <Image source={{ uri: capturedUri }} style={styles.fill} resizeMode="cover" />
      ) : (
        <>
          <CameraView ref={cameraRef} style={styles.fill} facing="back" />
          <ScanOverlay
            onImageSelected={handleImage}
            onCapture={handleCapture}
          />
        </>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[Typography.p1, { color: '#fff', marginTop: Spacing.md, textAlign: 'center' }]}>
            {LOADING_STEPS[loadingStep]}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
