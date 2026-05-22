import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { Spacing } from '@/constants/Spacing';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text variant="heading">Modal</Text>
      <View style={styles.separator} colorName="separator" />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    marginVertical: Spacing.xl,
    height: 1,
    width: '80%',
  },
});
