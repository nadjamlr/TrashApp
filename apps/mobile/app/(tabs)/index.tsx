import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import MapView from 'react-native-maps';
import Searchbar from '@/components/Searchbar';
import Filter from '@/components/Filter';
import { View } from '@/components/Themed';
import { ThemedText } from '@/components/ThemedText';
import { Toggle } from '@/components/Toggle';
import { Layout } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useLocation } from '@/context/LocationContext';
import { fetchLocations, Location } from '@/services/locationsService';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [showProducts, setShowProducts] = useState(false);
  const { lat, lng } = useLocation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations({ lat, lng })
      .then((data) => {
        console.log(`[Locations] ${data.length} geladen`, data[0]);
        setLocations(data);
      })
      .catch((e) => {
        console.error('[Locations] Fehler:', e.message);
        setLocationsError(e.message);
      });
  }, [lat, lng]);

  return (
    <View style={styles.container} lightColor="transparent" darkColor="transparent">
      <MapView
        style={StyleSheet.absoluteFill}
        region={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      />

      <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Layout.keyboardVerticalOffset : 0}
        style={styles.overlay}
        pointerEvents="box-none"
      >
        <View style={[styles.toggleSection, { paddingTop: insets.top + Spacing.md }]} pointerEvents="box-none">
          <ThemedText variant="h3">Locations</ThemedText>
          <Toggle
            size="lg"
            isActive={showProducts}
            onToggle={setShowProducts}
          />
          <ThemedText variant="h3">Products</ThemedText>
        </View>

        <View style={styles.topContainer} pointerEvents="box-none">
          <Searchbar />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filters}
          >
            <Filter label="Distance" />
            <Filter label="Opening hours" />
            <Filter label="Materials" />
            <Filter label="Saved" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  toggleSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  topContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    overflow: 'visible',
  },
  filtersScroll: {
    marginHorizontal: -Spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
