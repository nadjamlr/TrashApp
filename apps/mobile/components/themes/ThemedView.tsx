import { View as DefaultView } from 'react-native';

import Colors, { ThemeColorName } from '@/constants/Colors';

import { useColorScheme } from '../../services/useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ThemedViewProps = ThemeProps &
  DefaultView['props'] & {
    colorName?: ThemeColorName;
  };

export function ThemedView({
  style,
  lightColor,
  darkColor,
  colorName = 'background',
  ...otherProps
}: ThemedViewProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor =
    theme === 'dark' ? darkColor ?? Colors.dark[colorName] : lightColor ?? Colors.light[colorName];

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
