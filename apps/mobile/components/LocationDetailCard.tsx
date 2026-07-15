import { Linking, Platform, Pressable, Share, StyleSheet, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themes/ThemedText';
import { useColorScheme } from '@/services/useColorScheme';
import Colors from '@/constants/Colors';
import { Radius } from '@/constants/Radius';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import type { Location, OpeningHours } from '@/services/locationsService';
import { useSavedLocations } from '@/context/SavedLocationsContext';
import { useLanguage } from '@/context/LanguageContext';

const WALKING_SPEED_M_PER_MIN = 70;


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

function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALKING_SPEED_M_PER_MIN));
}

function todayOpeningHours(hours: OpeningHours | null): string | null {
  if (!hours) return null;
  return hours[WEEKDAY_KEYS[new Date().getDay()]] || null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function openRoute(lat: number, lng: number) {
  const nativeUrl = Platform.OS === 'ios'
    ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
    : `google.navigation:q=${lat},${lng}&mode=w`;

  const webUrl = Platform.OS === 'ios'
    ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

  Linking.openURL(nativeUrl).catch(() => Linking.openURL(webUrl));
}

function shareLocation(name: string, address: string, lat: number, lng: number) {
  const mapsUrl = Platform.OS === 'ios'
    ? `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Share.share({ message: `${name}\n${address}\n${mapsUrl}` });
}

type Props = {
  location: Location;
  style?: ViewStyle;
};

export function LocationDetailCard({ location, style }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isSaved, toggleSaved } = useSavedLocations();
  const { t } = useLanguage();
  const bookmarked = isSaved(location.id);
  const hoursToday = todayOpeningHours(location.opening_hours);

  return (
    <View style={[styles.card, { backgroundColor: theme.background }, style]}>
      <View style={styles.chips}>
        {location.materials?.map((material) => (
          <View key={material} style={[styles.chip, { backgroundColor: theme.surface }]}>
            <ThemedText variant="c1">{capitalize(material)}</ThemedText>
          </View>
        ))}
      </View>

      <ThemedText variant="h2">{location.name}</ThemedText>
      <ThemedText variant="c2" colorName="muted">
        {t.typeLabels[location.type]}
      </ThemedText>

      <View style={styles.rows}>
        <View style={styles.row}>
          <ThemedText variant="p1" style={styles.rowLabel}>
            {t.openingHours}
          </ThemedText>
          <ThemedText variant="p2" style={styles.rowValue}>
            {hoursToday ?? t.closed}
          </ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText variant="p1" style={styles.rowLabel}>
            {t.distance}
          </ThemedText>
          <ThemedText variant="p2" style={styles.rowValue}>
            {formatDistance(location.distance_m)}
            {'\n'}
            {t.walkingTime(walkingMinutes(location.distance_m))}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.routeButton, { backgroundColor: theme.text, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => openRoute(location.lat, location.lng)}
        >
          <ThemedText variant="p1" colorName="background">
            {t.route}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.text, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => shareLocation(location.name, location.address, location.lat, location.lng)}
        >
          <Ionicons name="share-outline" size={20} color={theme.background} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.text, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => toggleSaved(location)}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={theme.background}
          />
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
