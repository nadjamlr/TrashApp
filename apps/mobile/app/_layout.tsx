import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AppThemeProvider } from '@/context/ThemeContext';
import { LocationProvider } from '@/context/LocationContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { Colors } from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <LocationProvider>
        <UserProvider>
          <RootLayoutNav />
        </UserProvider>
      </LocationProvider>
    </AppThemeProvider>
  );
}

const LightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.light.background },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Colors.dark.background },
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { hasCompletedOnboarding, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!hasCompletedOnboarding || __DEV__)) {
      router.replace('/onboarding/welcome');
    }
  }, [isLoading, hasCompletedOnboarding]);

  if (isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === 'light' ? LightTheme : CustomDarkTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
