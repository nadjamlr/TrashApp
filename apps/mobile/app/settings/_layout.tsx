import { Stack } from 'expo-router';
import { useColorScheme } from '@/services/useColorScheme';
import { Colors } from '@/constants/Colors';

// Eigenes Layout für SettingsPages

export default function SettingsLayout() {
    const colorScheme = useColorScheme();
    const pageBg = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

    return (
        <Stack
            screenOptions={{
                title: '',
                headerTransparent: true,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: pageBg },
            }}
        />
    );
}
