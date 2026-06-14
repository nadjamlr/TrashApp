import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

export default function ResultScreen() {
  const { label, material, confidence } = useLocalSearchParams<{
    label: string;
    material: string;
    confidence: string;
  }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[Typography.h2, { color: colors.text }]}>{label}</Text>
      <Text style={[Typography.p2, { color: colors.muted }]}>{material}</Text>
      <Text style={[Typography.c2, { color: colors.muted }]}>
        Confidence: {(parseFloat(confidence ?? '0') * 100).toFixed(0)}%
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Text style={[Typography.p1, { color: colors.text }]}>Zurück</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  button: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
  },
});
