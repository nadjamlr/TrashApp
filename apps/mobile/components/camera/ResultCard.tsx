import { View, Text, StyleSheet, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useColorScheme } from '@/services/useColorScheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Radius } from '@/constants/Radius';
import type { RulesResult } from '@/services/rulesService';

type Props = {
  label: string;
  material: string;
  rules: RulesResult;
  onClose: () => void;
  onShowOnMap?: () => void;
  onAskMore: () => void;
};

export function ResultCard({ label, material, rules, onClose, onShowOnMap, onAskMore }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrapper}>
      <View style={styles.bubbleWrapper}>
        <View style={[styles.bubble, { backgroundColor: colors.text }]}>
          <Text style={[Typography.h2, { color: colors.background }]}>{label}</Text>
        </View>
        <View style={[styles.bubbleTail, { borderTopColor: colors.text }]} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.background }]}>
        <View style={styles.cardActions}>
          <Pressable onPress={onClose} style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.rows}>
          <Row label="Müll:" value={rules.bin} colors={colors} />
          <Row label="Material:" value={material} colors={colors} />
          {rules.deposit && <Row label="Rückgabe:" value="Pfandautomat im Supermarkt" colors={colors} />}
          {rules.deposit && <Row label="Pfand:" value={rules.deposit} colors={colors} />}
          {rules.alternatives.length > 0 && (
            <Row label="Alternativ:" value={rules.alternatives.join(', ')} colors={colors} />
          )}
          {rules.important_notes.length > 0 && (
            <BulletRow label="Wichtig:" items={rules.important_notes} colors={colors} />
          )}
        </View>

        <View style={styles.buttons}>
          {onShowOnMap && (
            <Pressable onPress={onShowOnMap} style={[styles.button, { backgroundColor: colors.text }]}>
              <Text style={[Typography.p1, { color: colors.background }]}>Show on map</Text>
            </Pressable>
          )}
          <Pressable onPress={onAskMore} style={[styles.button, { backgroundColor: colors.text }]}>
            <Text style={[Typography.p1, { color: colors.background }]}>Ask more</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.row}>
      <Text style={[Typography.p1, { color: colors.text, flex: 1 }]}>{label}</Text>
      <Text style={[Typography.p2, { color: colors.text, flex: 2 }]}>{value}</Text>
    </View>
  );
}

function BulletRow({ label, items, colors }: { label: string; items: string[]; colors: typeof Colors.light }) {
  return (
    <View style={styles.row}>
      <Text style={[Typography.p1, { color: colors.text, flex: 1 }]}>{label}</Text>
      <View style={{ flex: 2 }}>
        {items.map((item, i) => (
          <Text key={i} style={[Typography.p2, { color: colors.text }]}>• {item}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubbleWrapper: {
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  card: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
});
