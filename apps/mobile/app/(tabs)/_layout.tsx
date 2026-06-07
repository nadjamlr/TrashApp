import { Link, Tabs } from 'expo-router';
import { useRef, useEffect, useState } from 'react';
import { Animated, Pressable, TouchableOpacity, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Icon } from '@/components/Icon';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

const ICON_SIZE = 26;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / state.routes.length;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      damping: 20,
      mass: 1,
      stiffness: 150,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Spacing.lg,
        left: Spacing.lg,
        right: Spacing.lg,
        height: 72,
        borderRadius: 100,
        backgroundColor: theme.surface,
        flexDirection: 'row',
        overflow: 'hidden',
      }}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: tabWidth,
          height: '100%',
          backgroundColor: theme.text,
          borderRadius: 100,
          transform: [{ translateX: slideAnim }],
        }}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? theme.background : theme.text;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              gap: Spacing.xs,
            }}
          >
            {options.tabBarIcon?.({ focused: isFocused, color, size: ICON_SIZE })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
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
