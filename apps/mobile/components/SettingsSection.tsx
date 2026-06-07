import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

type SettingsSectionProps = {
    heading: string;
    children: ReactNode;
};

export function SettingsSection({ heading, children }: SettingsSectionProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    return (
        <View lightColor="transparent" darkColor="transparent" style={styles.section}>
            <Text variant="h2" style={{ color: theme.muted }}>{heading}</Text>
            <View lightColor="transparent" darkColor="transparent" style={styles.rows}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        width: '100%',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    rows: {
        gap: Spacing.sm,
        flexDirection: 'column',
        width: '100%',
    },
});
