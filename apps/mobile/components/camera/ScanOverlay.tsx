import { StyleSheet, View, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Feather from '@expo/vector-icons/Feather';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Spacing } from '@/constants/Spacing';

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const FRAME_SIZE = 240;

// Tab bar height (72) + bottom offset (Spacing.lg = 24) + breathing room (Spacing.md = 16)
const ABOVE_TAB_BAR = 72 + Spacing.lg + Spacing.md;

type Props = {
  onImageSelected: (uri: string) => void;
  onCapture: () => void;
};

export function ScanOverlay({ onImageSelected, onCapture }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      <View style={[styles.controls, { bottom: ABOVE_TAB_BAR }]}>
        <Pressable
          onPress={pickImage}
          style={[styles.galleryButton, { backgroundColor: colors.text }]}
        >
          <Feather name="upload" size={22} color={colors.background} />
        </Pressable>

        <Pressable onPress={onCapture} style={styles.shutterOuter}>
          {({ pressed }) => (
            <View style={[
              styles.shutterInner,
              {
                backgroundColor: pressed ? '#C9A800' : colors.primary,
                borderColor: '#C9A800',
              },
            ]} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    flex: 1,
    width: '100%',
    borderRadius: 999,
    borderWidth: 2,
  },
  galleryButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
