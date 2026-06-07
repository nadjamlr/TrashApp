import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Spacing } from '@/constants/Spacing';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text variant="h1">Map Tab</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
