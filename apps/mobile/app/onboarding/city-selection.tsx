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
      <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Wähle deine Stadt.</Text>
          <Text style={styles.subtitle}>TrashApp kennt die Trennungsregeln in deiner Stadt.</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Stadt suchen…"
            placeholderTextColor="#ADADAD"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCities.length === 0 ? (
            <Text style={styles.emptyText}>Keine Stadt gefunden</Text>
          ) : (
            filteredCities.map((city) => (
              <Pressable
                key={city.id}
                style={({ pressed }) => [
                  styles.cityRow,
                  !city.available && styles.cityRowDisabled,
                  pressed && city.available && styles.cityRowPressed,
                ]}
                onPress={() => city.available && setSelectedCity(city.id)}
                disabled={!city.available}
              >
                <Text style={[
                  styles.cityName,
                  !city.available && styles.cityNameDisabled,
                  city.available && selectedCity === city.id && styles.cityNameSelected,
                ]}>
                  {city.name}
                </Text>
                <View style={styles.cityRowRight}>
                  {!city.available && <Text style={styles.comingSoon}>Bald</Text>}
                  {city.available && selectedCity === city.id && <View style={styles.selectedDot} />}
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Los geht's</Text>
          </Pressable>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Später</Text>
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F0',
    paddingHorizontal: 28,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#21242C',
    lineHeight: 38,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#ADADAD',
    lineHeight: 22,
  },
  searchRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#21242C',
    marginBottom: 8,
    paddingBottom: 10,
  },
  searchInput: {
    fontSize: 16,
    color: '#21242C',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
  },
  emptyText: {
    fontSize: 15,
    color: '#ADADAD',
    paddingTop: 24,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E7E3',
  },
  cityRowDisabled: {
    opacity: 0.4,
  },
  cityRowPressed: {
    opacity: 0.6,
  },
  cityName: {
    fontSize: 20,
    fontWeight: '400',
    color: '#21242C',
  },
  cityNameSelected: {
    fontWeight: '700',
  },
  cityNameDisabled: {
    color: '#21242C',
  },
  cityRowRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FEDA10',
  },
  comingSoon: {
    fontSize: 12,
    color: '#ADADAD',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  actions: {
    gap: 8,
    marginTop: 24,
  },
  confirmButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#21242C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FEDA10',
  },
  skipButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 15,
    color: '#ADADAD',
  },
});
