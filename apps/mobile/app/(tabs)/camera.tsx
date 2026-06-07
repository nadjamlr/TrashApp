import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Spacing } from '@/constants/Spacing';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <Text variant="heading">Camera Tab</Text>
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
