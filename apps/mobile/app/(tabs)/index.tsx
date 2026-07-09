import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Abstände zur StatusBAr und HomeIndicator
import { useState } from 'react';
import MapView from 'react-native-maps';
import Searchbar from '@/components/map/Searchbar';
import Filter from '@/components/map/Filter';
import { View } from '@/components/themes/Themed';
import { ThemedText } from '@/components/themes/ThemedText';
import { Toggle } from '@/components/Toggle';
import { Layout } from '@/constants/Layout';
import { Spacing } from '@/constants/Spacing';
import { useLocation } from '@/context/LocationContext';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [showProducts, setShowProducts] = useState(false); // Toggle
  const { lat, lng } = useLocation();

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
      />

      <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />

      <KeyboardAvoidingView // Overlay
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
