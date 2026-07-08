import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { ThemedText } from './ThemedText';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import { Radius } from '@/constants/Radius';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import type { Location, LocationType, OpeningHours } from '@/services/locationsService';

const WALKING_SPEED_M_PER_MIN = 70;

const TYPE_LABELS: Record<LocationType, string> = {
  wertstoffhof: 'Wertstoffhof',
  wertstoffinsel: 'Wertstoffinsel',
};

// Index matches Date.getDay(): 0 = Sunday
const WEEKDAY_KEYS: (keyof OpeningHours)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function formatWalkingTime(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / WALKING_SPEED_M_PER_MIN));
  return `${minutes} Min. zu Fuß`;
}

function todayOpeningHours(hours: OpeningHours | null): string {
  if (!hours) return '24/7';
  return hours[WEEKDAY_KEYS[new Date().getDay()]] || 'Geschlossen';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function openRoute(lat: number, lng: number) {
  const url =
    Platform.OS === 'ios'
      ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
      : `google.navigation:q=${lat},${lng}&mode=w`;

  Linking.openURL(url).catch(() =>
    // Fall back to the maps web URL if no native maps app can handle the deep link
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`),
  );
}

type Props = {
  location: Location;
  style?: ViewStyle;
};

export function LocationDetailCard({ location, style }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: theme.background }, style]}>
      <View style={styles.chips}>
        {location.materials.map((material) => (
          <View key={material} style={[styles.chip, { backgroundColor: theme.surface }]}>
            <ThemedText variant="c1">{capitalize(material)}</ThemedText>
          </View>
        ))}
      </View>

      <ThemedText variant="h2">{location.name}</ThemedText>
      <ThemedText variant="c2" colorName="muted">
        {TYPE_LABELS[location.type]}
      </ThemedText>

      <View style={styles.rows}>
        <View style={styles.row}>
          <ThemedText variant="p1" style={styles.rowLabel}>
            Öffnungszeiten:
          </ThemedText>
          <ThemedText variant="p2" style={styles.rowValue}>
            {todayOpeningHours(location.opening_hours)}
          </ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText variant="p1" style={styles.rowLabel}>
            Entfernung:
          </ThemedText>
          <ThemedText variant="p2" style={styles.rowValue}>
            {formatDistance(location.distance_m)}
            {'\n'}
            {formatWalkingTime(location.distance_m)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.routeButton, { backgroundColor: theme.text, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => openRoute(location.lat, location.lng)}
        >
          <ThemedText variant="p1" colorName="background">
            Route
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.bookmarkButton, { backgroundColor: theme.text, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => setBookmarked((prev) => !prev)}
        >
          <Icon name="bookmark" size={20} colorName="background" style={bookmarked ? { opacity: 0.5 } : undefined} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.action,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  rows: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rowLabel: {
    minWidth: 130,
  },
  rowValue: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  routeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
