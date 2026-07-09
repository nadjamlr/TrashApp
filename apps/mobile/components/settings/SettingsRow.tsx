import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/themes/Themed';
import { Toggle } from '@/components/Toggle';
import { router } from 'expo-router';
import { useColorScheme } from '@/services/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

type SettingsRowProps = {
    topic: string;
    details: string[];
    href?: string;
    hasToggle?: boolean;
    isToggleActive?: boolean;
    onToggle?: (value: boolean) => void;
};

export function SettingsRow({ topic, details, href, hasToggle = false, isToggleActive = false, onToggle }: SettingsRowProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const content = (
        <View style={[styles.row, { backgroundColor: theme.surface }]}>
            <View lightColor="transparent" darkColor="transparent" style={styles.left}>
                <Text variant="h3" style={{ color: theme.text }}>{topic}</Text>
                <Text variant="p1" style={{ color: theme.muted, textTransform: 'capitalize' }}>{details.join(', ')}</Text>
            </View>
            {hasToggle
                ? <Toggle size="sm" isActive={isToggleActive} onToggle={onToggle} />
                : href && <Text variant="h3" style={[styles.arrowLink, { color: theme.muted }]}>›</Text>
            }
        </View>
    );

    if (href && !hasToggle) {
        return (
            <Pressable onPress={() => router.push(href as any)} style={styles.pressable}>
                {content}
            </Pressable>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    pressable: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: Spacing.sm,
        width: '100%',
    },
    left: {
        flex: 1,
        gap: 2,
    },
    arrowLink: {
        marginLeft: Spacing.sm,
    },
});
