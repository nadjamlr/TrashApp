import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/services/useColorScheme';
import { ResultCard } from '@/components/camera/ResultCard';
import { FactCard } from '@/components/camera/FactCard';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Radius } from '@/constants/Radius';
import { Typography } from '@/constants/Typography';
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
  const [rulesError, setRulesError] = useState(false);

  useEffect(() => {
    if (!label || !material) return;
    setRulesError(false);

    const classify = async () => {
      let result: RulesResult | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await classifyItem(label, material);
          break;
        } catch {
          if (attempt === 2) {
            setRulesError(true);
            return;
          }
        }
      }
      setRules(result);
      generateInsight(label, material, result!.bin)
        .then(setInsight)
        .catch(() => {});
    };

    classify();
  }, [label, material]);

  if (rulesError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: Spacing.lg }]}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
          Klassifizierung fehlgeschlagen.
        </Text>
        <Text style={[Typography.p1, { color: colors.text, textAlign: 'center', marginBottom: Spacing.lg }]}>
          Bitte erneut scannen.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[Typography.p1, { color: colors.text }]}>Nochmal scannen</Text>
        </Pressable>
      </View>
    );
  }

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
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
});
