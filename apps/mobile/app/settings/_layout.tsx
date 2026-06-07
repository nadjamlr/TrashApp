import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

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
