import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon } from '@/components/navbar/Icon';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/services/useColorScheme';
import { CustomTabBar } from '@/components/navbar/CustomTabBar'

const ICON_SIZE = 26;

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitle: () => null,
        headerTransparent: true,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Icon name="map" size={ICON_SIZE} color={color} />,
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Icon
                    name="user"
                    size={Spacing.lg}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: Spacing.lg, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <Icon name="camera" size={ICON_SIZE} color={color} />,
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Icon
                    name="user"
                    size={Spacing.xl - Spacing.sm}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: Spacing.lg, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Chatbot',
          tabBarIcon: ({ color }) => <Ionicons name="chatbox-outline" size={ICON_SIZE} color={color} />,
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Icon
                    name="user"
                    size={Spacing.xl - Spacing.sm}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: Spacing.lg, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}
