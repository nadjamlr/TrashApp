import { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useColorScheme } from '@/services/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Radius } from '@/constants/Radius';

const FALLBACK_FACT = 'Richtiges Trennen schont Ressourcen und hilft der Umwelt.';

function SkeletonLine({ width, opacity }: { width: string | number; opacity: Animated.Value }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  return (
    <Animated.View
      style={[styles.skeletonLine, { width, backgroundColor: colors.muted, opacity }]}
    />
  );
}

type Props = {
  fact: string | null;
  loading?: boolean;
  error?: boolean;
};

export function FactCard({ fact, loading = false, error = false }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!loading) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loading, pulse]);

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
      {loading ? (
        <View style={styles.skeleton}>
          <SkeletonLine width="90%" opacity={pulse} />
          <SkeletonLine width="75%" opacity={pulse} />
        </View>
      ) : (
        <Text style={[Typography.p2, { color: colors.muted }]}>{displayFact}</Text>
      )}
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
  skeleton: {
    gap: Spacing.xs,
  },
  skeletonLine: {
    height: 14,
    borderRadius: Radius.sm,
  },
});
