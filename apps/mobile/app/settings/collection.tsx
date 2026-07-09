import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/themes/Themed';

export default function CollectionScreen() {
  return (
    <View style={styles.container}>
      <Text variant="h1">Collection</Text>
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
