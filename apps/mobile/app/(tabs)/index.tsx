import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { View } from '@/components/themes/Themed';
import { useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { LocationDetailCard } from '@/components/LocationDetailCard';
import { LocationMarker } from '@/components/LocationMarker';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Abstände zur StatusBAr und HomeIndicator
import Searchbar from '@/components/map/Searchbar';
import Filter from '@/components/map/Filter';
import { Icon } from '@/components/navbar/Icon';
import { ThemedText } from '@/components/themes/ThemedText';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Radius } from '@/constants/Radius';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/services/useColorScheme';
import { useLocation } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSavedLocations } from '@/context/SavedLocationsContext';
import { fetchAllWertstoffhoefe, fetchLocations, Location, LocationType } from '@/services/locationsService';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { lat, lng } = useLocation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [cityHoefe, setCityHoefe] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<LocationType>>(new Set());
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [topContainerHeight, setTopContainerHeight] = useState(0);
  const markerTappedRef = useRef(false);
  const { t } = useLanguage();
  const { savedLocations } = useSavedLocations();

  useEffect(() => {
    fetchLocations({ lat, lng })
      .then(setLocations)
      .catch((e) => console.error('[Locations] Fehler:', e.message));
  }, [lat, lng]);

  // Wenn Wertstoffhöfe-Filter aktiv: gecachte Stadtliste laden (kein wiederholter API-Call)
  useEffect(() => {
    if (!selectedTypes.has('wertstoffhof')) {
      setCityHoefe([]);
      return;
    }
    fetchAllWertstoffhoefe().then(setCityHoefe).catch(() => {});
  }, [selectedTypes]);

  const savedIds = useMemo(() => new Set(savedLocations.map(l => l.id)), [savedLocations]);

  // Nahe Locations + stadtweite Höfe zusammenführen (dedup)
  const allLocations = useMemo(() => {
    const nearbyIds = new Set(locations.map(l => l.id));
    return [...locations, ...cityHoefe.filter(l => !nearbyIds.has(l.id))];
  }, [locations, cityHoefe]);

  const allMaterials = useMemo(() => {
    const seen = new Set<string>();
    allLocations.forEach(loc => loc.materials?.forEach(m => seen.add(m)));
    return Array.from(seen).sort();
  }, [allLocations]);

  const filteredLocations = useMemo(() => allLocations.filter(loc => {
    if (savedIds.has(loc.id)) return false; // saved locations werden separat angezeigt
    if (selectedTypes.size > 0 && !selectedTypes.has(loc.type)) return false;
    if (selectedMaterials.size > 0 && !loc.materials?.some(m => selectedMaterials.has(m))) return false;
    return true;
  }), [allLocations, selectedTypes, selectedMaterials, savedIds]);

  // Region der Karte: bei aktivem Gespeichert-Filter alle gespeicherten Marker einschließen
  const mapRegion = useMemo(() => {
    if (showSavedOnly && savedLocations.length > 0) {
      const lats = savedLocations.map(l => l.lat);
      const lngs = savedLocations.map(l => l.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(maxLat - minLat + 0.02, 0.02),
        longitudeDelta: Math.max(maxLng - minLng + 0.02, 0.02),
      };
    }
    return { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  }, [showSavedOnly, savedLocations, lat, lng]);

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
        region={mapRegion}
        showsUserLocation
        mapPadding={{ top: topContainerHeight, left: 0, right: 0, bottom: 0 }}
        onPress={() => {
          if (markerTappedRef.current) { markerTappedRef.current = false; return; }
          Keyboard.dismiss();
          setSelectedLocation(null);
        }}
      >
        {!showSavedOnly && filteredLocations.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          return (
            <Marker
              key={loc.id}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              tracksViewChanges={isSelected}
              onPress={() => { markerTappedRef.current = true; setSelectedLocation(loc); }}
            >
              <LocationMarker type={loc.type} selected={isSelected} />
            </Marker>
          );
        })}
        {savedLocations.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          return (
            <Marker
              key={`saved-${loc.id}`}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              tracksViewChanges={isSelected}
              onPress={() => { markerTappedRef.current = true; setSelectedLocation(loc); }}
            >
              <LocationMarker type={loc.type} selected={isSelected} saved />
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
        <View
          style={[styles.topContainer, { paddingTop: insets.top + 33 + Spacing.md }]}
          pointerEvents="box-none"
          onLayout={(e) => setTopContainerHeight(e.nativeEvent.layout.height)}
        >
          <Searchbar locations={locations} onSelectLocation={setSelectedLocation} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <Pressable
              onPress={() => setShowSavedOnly(prev => !prev)}
              style={[styles.bookmarkChip, { backgroundColor: showSavedOnly ? theme.primary : theme.surface }]}
            >
              <Icon name="bookmark" size={16} color={theme.text} />
            </Pressable>
            <Filter
              label={t.filterWertstoffhoefe}
              isActive={selectedTypes.has('wertstoffhof')}
              onPress={() => toggleType('wertstoffhof')}
            />
            <Filter
              label={t.filterWertstoffinseln}
              isActive={selectedTypes.has('wertstoffinsel')}
              onPress={() => toggleType('wertstoffinsel')}
            />
            <Filter
              label={selectedMaterials.size > 0 ? t.filterMaterialActive(selectedMaterials.size) : t.filterMaterial}
              isActive={selectedMaterials.size > 0}
              overlayTitle={t.filterMaterialTitle}
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

      {showSavedOnly && savedLocations.length === 0 && (
        <RNView style={styles.emptyState} pointerEvents="none">
          <ThemedText variant="p1" style={{ color: theme.muted, textAlign: 'center' }}>
            {t.filterSavedEmpty}
          </ThemedText>
        </RNView>
      )}

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
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  bookmarkChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  emptyState: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: TAB_BAR_OFFSET + Spacing.md,
    alignItems: 'center',
  },
});
