import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/services/useColorScheme';
import { ResultCard } from '@/components/camera/ResultCard';
import { FactCard } from '@/components/camera/FactCard';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { classifyItem, type RulesResult } from '@/services/rulesService';
import { generateInsight, type InsightResult } from '@/services/insightService';

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
  const [insight, setInsight] = useState<InsightResult | null>(null);

  useEffect(() => {
    if (!label || !material) return;
    classifyItem(label, material).then((r) => {
      setRules(r);
      generateInsight(label, material, r.bin).then(setInsight);
    });
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
        onShowOnMap={() => router.push('/(tabs)/')}
        onAskMore={() => router.push('/(tabs)/chatbot')}
      />
      {insight && (
        <View style={styles.factWrapper}>
          <FactCard fact={insight.fact} />
        </View>
      )}
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
    gap: Spacing.md,
    justifyContent: 'center',
  },
  factWrapper: {
    width: '100%',
  },
});
