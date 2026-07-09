import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { View } from '@/components/themes/Themed';
import { useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { LocationDetailCard } from '@/components/LocationDetailCard';
import { LocationMarker } from '@/components/LocationMarker';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Abstände zur StatusBAr und HomeIndicator
import Searchbar from '@/components/map/Searchbar';
import Filter from '@/components/map/Filter';
import { ThemedText } from '@/components/themes/ThemedText';
import { Toggle } from '@/components/Toggle';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/services/useColorScheme';
import { useLocation } from '@/context/LocationContext';
import { fetchLocations, Location, LocationType } from '@/services/locationsService';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { lat, lng } = useLocation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<LocationType>>(new Set());
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const markerTappedRef = useRef(false);

  useEffect(() => {
    fetchLocations({ lat, lng })
      .then(setLocations)
      .catch((e) => console.error('[Locations] Fehler:', e.message));
  }, [lat, lng]);

  const allMaterials = useMemo(() => {
    const seen = new Set<string>();
    locations.forEach(loc => loc.materials.forEach(m => seen.add(m)));
    return Array.from(seen).sort();
  }, [locations]);

  const filteredLocations = useMemo(() => locations.filter(loc => {
    if (selectedTypes.size > 0 && !selectedTypes.has(loc.type)) return false;
    if (selectedMaterials.size > 0 && !loc.materials.some(m => selectedMaterials.has(m))) return false;
    return true;
  }), [locations, selectedTypes, selectedMaterials]);

  function toggleType(type: LocationType) {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function toggleMaterial(mat: string) {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      next.has(mat) ? next.delete(mat) : next.add(mat);
      return next;
    });
  }

  return (
    <View style={styles.container} lightColor="transparent" darkColor="transparent">
      <MapView
        style={StyleSheet.absoluteFill}
        region={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05, // ca. 3km Radius
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        onPress={() => {
          if (markerTappedRef.current) { markerTappedRef.current = false; return; }
          Keyboard.dismiss();
          setSelectedLocation(null);
        }}
      >
        {filteredLocations.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          return (
            <Marker
              key={loc.id}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              tracksViewChanges
              onPress={() => { markerTappedRef.current = true; setSelectedLocation(loc); }}
            >
              <LocationMarker type={loc.type} selected={isSelected} />
            </Marker>
          );
        })}
      </MapView>

      <KeyboardAvoidingView // Overlay
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Layout.keyboardVerticalOffset : 0}
        style={styles.overlay}
        pointerEvents="box-none"
      >
        <View style={[styles.topContainer, { paddingTop: insets.top + 33 + Spacing.md }]} pointerEvents="box-none">
          <Searchbar locations={locations} onSelectLocation={setSelectedLocation} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filters}
          >
            <Filter
              label="Wertstoffhöfe"
              isActive={selectedTypes.has('wertstoffhof')}
              onPress={() => toggleType('wertstoffhof')}
            />
            <Filter
              label="Wertstoffinseln"
              isActive={selectedTypes.has('wertstoffinsel')}
              onPress={() => toggleType('wertstoffinsel')}
            />
            <Filter
              label={selectedMaterials.size > 0 ? `Material (${selectedMaterials.size})` : 'Material'}
              isActive={selectedMaterials.size > 0}
              overlayTitle="Material filtern"
            >
              <RNView style={styles.materialChips}>
                {allMaterials.map(mat => (
                  <Pressable
                    key={mat}
                    onPress={() => toggleMaterial(mat)}
                    style={[
                      styles.materialChip,
                      { backgroundColor: selectedMaterials.has(mat) ? theme.primary : theme.surface },
                    ]}
                  >
                    <ThemedText variant="c1">{mat}</ThemedText>
                  </Pressable>
                ))}
              </RNView>
            </Filter>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {selectedLocation && (
        <LocationDetailCard location={selectedLocation} style={styles.detailCard} />
      )}
    </View>
  );
}

// Keep the card above the floating tab bar (bottom: Spacing.lg, height 72 in (tabs)/_layout.tsx)
const TAB_BAR_OFFSET = Spacing.lg + 72;

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
  detailCard: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: TAB_BAR_OFFSET + Spacing.md,
  },
  materialChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  materialChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
});
