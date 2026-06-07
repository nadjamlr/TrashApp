import { ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { SettingsRow } from '@/components/SettingsRow';
import { SettingsSection } from '@/components/SettingsSection';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text variant="h1" style={{ color: theme.text }}>Nadja Müller</Text>
      <View style={styles.topics}>

        <SettingsSection heading="Personal Details">
          <SettingsRow
            topic='Personal Info'
            details={["name", "address", "email", "phone", "username"]}
            href="/settings/personal-info"
          />
        </SettingsSection>

        <SettingsSection heading="Collection">
          <SettingsRow
            topic='Products'
            details={[""]}
            href="/settings/collection"
          />
        </SettingsSection>

        <SettingsSection heading="Security">
          <SettingsRow topic='Access' details={["maps", "photos"]} href="/settings/access" />
          <SettingsRow topic='Safety' details={["password", "PIN"]} href="/settings/safety" />
        </SettingsSection>

        <SettingsSection heading="General Settings">
          <SettingsRow
            topic='Notifications'
            details={["Push notifications"]}
            hasToggle
          />
          <SettingsRow
            topic='Language'
            details={["Choose the language for the app"]}
            href="/settings/language"
          />
          <SettingsRow
            topic='Dark Mode'
            details={["Choose dark or light mode"]}
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
});
