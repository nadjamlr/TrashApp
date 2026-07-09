import { Pressable, StyleSheet, View as RNView } from 'react-native';
import { Text } from '@/components/themes/Themed';
import { Icon } from '@/components/navbar/Icon';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useAppTheme } from '@/context/ThemeContext';

const OPTIONS: { value: Language; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

export default function LanguageScreen() {
  const { colorScheme } = useAppTheme();
  const theme = Colors[colorScheme];
  const { language, setLanguage, t } = useLanguage();

  return (
    <RNView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text variant="h2" style={[styles.heading, { color: theme.text }]}>{t.language}</Text>
      <RNView style={[styles.box, { backgroundColor: theme.surface }]}>
        {OPTIONS.map((option, index) => (
          <RNView key={option.value}>
            {index > 0 && <RNView style={[styles.separator, { backgroundColor: theme.separator }]} />}
            <Pressable
              style={styles.row}
              onPress={() => setLanguage(option.value)}
            >
              <Text variant="p1" style={{ color: theme.text }}>{option.label}</Text>
              {language === option.value && (
                <Icon name="check" colorName="primary" size={20} />
              )}
            </Pressable>
          </RNView>
        ))}
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: Spacing.lg,
  },
  heading: {
    marginBottom: Spacing.md,
  },
  box: {
    borderRadius: Spacing.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.md,
  },
});
