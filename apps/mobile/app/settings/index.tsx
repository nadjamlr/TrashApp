import { Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { Text, View } from '@/components/themes/Themed';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { useAppTheme } from '@/context/ThemeContext';
import { useSavedLocations } from '@/context/SavedLocationsContext';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useState } from 'react';

const MAX_VISIBLE = 3;

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];
  const { savedLocations } = useSavedLocations();
  const [showAll, setShowAll] = useState(false);
  const visibleLocations = showAll ? savedLocations : savedLocations.slice(0, MAX_VISIBLE);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text variant="h1" style={{ color: theme.text }}>Nadja Müller</Text>
      <View style={styles.topics}>

        <SettingsSection heading="Profil-Details">
          <SettingsRow
            topic='Persönliche Informationen'
            details={["name", "adresse", "e-mail", "Telefon", "username"]}
            href="/settings/personal-info"
          />
        </SettingsSection>

        <SettingsSection heading="Gespeicherte Standorte">
          {savedLocations.length === 0
            ? <RNView style={[styles.savedBox, styles.savedItem, { backgroundColor: theme.surface }]}>
                <Text variant="p1" style={{ color: theme.muted }}>Keine gespeicherten Standorte</Text>
              </RNView>
            : <RNView style={[styles.savedBox, { backgroundColor: theme.surface }]}>
                {visibleLocations.map((loc, index) => (
                  <RNView key={loc.id}>
                    {index > 0 && <RNView style={[styles.separator, { backgroundColor: theme.separator }]} />}
                    <RNView style={styles.savedItem}>
                      <Text variant="p2" style={{ color: theme.text }}>{loc.name}</Text>
                      {loc.address ? <Text variant="c2" style={{ color: theme.muted }}>{loc.address}</Text> : null}
                    </RNView>
                  </RNView>
                ))}
                {savedLocations.length > MAX_VISIBLE && (
                  <RNView>
                    <RNView style={[styles.separator, { backgroundColor: theme.separator }]} />
                    <Pressable style={styles.savedItem} onPress={() => setShowAll(prev => !prev)}>
                      <Text variant="c1" style={{ color: theme.muted }}>
                        {showAll ? 'Weniger anzeigen' : `${savedLocations.length - MAX_VISIBLE} weitere anzeigen`}
                      </Text>
                    </Pressable>
                  </RNView>
                )}
              </RNView>
          }
        </SettingsSection>

        <SettingsSection heading="Kollektion">
          <SettingsRow
            topic='Produkte'
            details={["Keine Produkte bisher"]}
            href="/settings/collection"
          />
        </SettingsSection>

        <SettingsSection heading="Sicherheit">
          <SettingsRow topic='Zugriff' details={["Maps", "Fotos"]} href="/settings/access" />
          <SettingsRow topic='Passwörter' details={["Passwort", "PIN"]} href="/settings/safety" />
        </SettingsSection>

        <SettingsSection heading="Allgemeine Einstellungen">
          <SettingsRow
            topic='Benachrichtigungen'
            details={["Push Benachrichtigungen"]}
            hasToggle
          />
          <SettingsRow
            topic='Sprache'
            details={["Wähle eine Sprache für die App"]}
            href="/settings/language"
          />
          <SettingsRow
            topic='Dark Mode'
            details={["Wähle Dark- oder Light-Mode"]}
            hasToggle
            isToggleActive={isDark}
            onToggle={(val) => setColorScheme(val ? 'dark' : 'light')}
          />
        </SettingsSection>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  content: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  heading: {
    marginBottom: Spacing.lg,
  },
  topics: {
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  savedBox: {
    borderRadius: Spacing.sm,
    overflow: 'hidden',
  },
  savedItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.md,
  },
});
