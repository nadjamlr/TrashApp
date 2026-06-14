import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import { ResultCard } from '@/components/camera/ResultCard';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { classifyItem, type RulesResult } from '@/services/rulesService';

export default function ResultScreen() {
  const { label, material } = useLocalSearchParams<{
    label: string;
    material: string;
    confidence: string;
  }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [rules, setRules] = useState<RulesResult | null>(null);

  useEffect(() => {
    if (!label || !material) return;
    classifyItem(label, material).then(setRules);
  }, [label, material]);

  if (!rules) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.surface }}
      contentContainerStyle={styles.content}
    >
      <ResultCard
        label={label ?? ''}
        material={material ?? ''}
        rules={rules}
        onClose={() => router.back()}
        onSave={() => {}}
        onShowOnMap={() => router.push('/(tabs)/')}
        onAskMore={() => router.push('/(tabs)/chatbot')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
});
