import { StyleSheet, View, Text, Pressable, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Radius } from '@/constants/Radius';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

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
      <CameraView style={styles.fill} facing="back" />
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
});
