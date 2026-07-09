import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useColorScheme } from '@/services/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Icon } from '@/components/navbar/Icon';
import { Spacing } from '@/constants/Spacing';

export default function SettingsLayout() {
    const colorScheme = useColorScheme();
    const pageBg = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
    const iconColor = Colors[colorScheme ?? 'light'].text;
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                title: '',
                headerTransparent: true,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: pageBg },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} hitSlop={8}>
                            {({ pressed }) => (
                                <Icon
                                    name="chevron-left"
                                    size={Spacing.xl}
                                    color={iconColor}
                                    style={{ opacity: pressed ? 0.5 : 1 }}
                                />
                            )}
                        </Pressable>
                    ),
                }}
            />
        </Stack>
    );
}
