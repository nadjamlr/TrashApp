import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function PersonalScreen() {
  return (
    <View style={styles.container}>
      <Text variant="h1">Personal</Text>
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
