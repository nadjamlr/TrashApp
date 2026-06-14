import { View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Radius } from '@/constants/Radius';

type Props = {
  fact: string;
};

export function FactCard({ fact }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Feather name="zap" size={16} color={colors.primary} />
        <Text style={[Typography.p1, styles.title, { color: colors.text }]}>
          Wusstest du?
        </Text>
      </View>
      <Text style={[Typography.p2, { color: colors.muted }]}>{fact}</Text>
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
});
