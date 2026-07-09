import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useColorScheme } from '@/services/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Radius } from '@/constants/Radius';

const FALLBACK_FACT = 'Richtiges Trennen schont Ressourcen und hilft der Umwelt.';

type Props = {
  fact: string | null;
  loading?: boolean;
  error?: boolean;
};

export function FactCard({ fact, loading = false, error = false }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const displayFact = fact ?? (error ? FALLBACK_FACT : null);

  if (!loading && displayFact === null) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Feather name="zap" size={16} color={colors.primary} />
        <Text style={[Typography.p1, styles.title, { color: colors.text }]}>
          Wusstest du?
        </Text>
      </View>
      {loading
        ? <ActivityIndicator size="small" color={colors.muted} style={styles.loader} />
        : <Text style={[Typography.p2, { color: colors.muted }]}>{displayFact}</Text>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontWeight: '600',
  },
  loader: {
    alignSelf: 'flex-start',
  },
});
