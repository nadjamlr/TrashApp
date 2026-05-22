import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { Spacing } from '@/constants/Spacing';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text variant="heading">Tab Two</Text>
      <View style={styles.separator} colorName="separator" />
      <EditScreenInfo path="app/(tabs)/two.tsx" />
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
