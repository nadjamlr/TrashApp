import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';

type City = {
  id: string;
  name: string;
  available: boolean;
};

const CITIES: City[] = [
  { id: 'münchen', name: 'München', available: true },
  { id: 'berlin', name: 'Berlin', available: false },
  { id: 'hamburg', name: 'Hamburg', available: false },
  { id: 'köln', name: 'Köln', available: false },
  { id: 'frankfurt', name: 'Frankfurt', available: false },
  { id: 'stuttgart', name: 'Stuttgart', available: false },
  { id: 'düsseldorf', name: 'Düsseldorf', available: false },
  { id: 'leipzig', name: 'Leipzig', available: false },
];

export default function CitySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useUser();
  const [selectedCity, setSelectedCity] = useState<string>('münchen');
  const [query, setQuery] = useState('');

  const filteredCities = CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  async function handleConfirm() {
    await completeOnboarding(selectedCity);
    router.replace('/(tabs)');
  }

  async function handleSkip() {
    await completeOnboarding(null);
    router.replace('/(tabs)');
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wähle deine Stadt</Text>
        <Text style={styles.subtitle}>
          TrashApp kennt die Trennungsregeln in deiner Stadt.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Stadt suchen…"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {filteredCities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Keine Stadt gefunden</Text>
          </View>
        ) : (
          filteredCities.map((city) => (
            <Pressable
              key={city.id}
              style={[
                styles.cityCard,
                !city.available && styles.cityCardDisabled,
                city.available && selectedCity === city.id && styles.cityCardSelected,
              ]}
              onPress={() => city.available && setSelectedCity(city.id)}
              disabled={!city.available}
            >
              <View style={styles.cityCardLeft}>
                <View style={[
                  styles.cityIcon,
                  !city.available && styles.cityIconDisabled,
                  city.available && selectedCity === city.id && styles.cityIconSelected,
                ]}>
                  <FontAwesome
                    name="map-marker"
                    size={18}
                    color={
                      !city.available
                        ? '#9CA3AF'
                        : selectedCity === city.id
                        ? '#FFFFFF'
                        : '#38632E'
                    }
                  />
                </View>
                <View>
                  <Text style={[styles.cityName, !city.available && styles.cityNameDisabled]}>
                    {city.name}
                  </Text>
                  {!city.available && (
                    <Text style={styles.comingSoon}>Bald verfügbar</Text>
                  )}
                </View>
              </View>

              {city.available && selectedCity === city.id && (
                <FontAwesome name="check-circle" size={22} color="#38632E" />
              )}
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Stadt auswählen</Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Später</Text>
        </Pressable>
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#21242C',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#21242C',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cityCardDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  cityCardSelected: {
    borderColor: '#38632E',
    backgroundColor: '#F0F7EE',
  },
  cityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityIconDisabled: {
    backgroundColor: '#F3F4F6',
  },
  cityIconSelected: {
    backgroundColor: '#38632E',
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#21242C',
  },
  cityNameDisabled: {
    color: '#9CA3AF',
  },
  comingSoon: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  confirmButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#38632E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
