import { Text as DefaultText } from 'react-native';

import Colors, { ThemeColorName } from '@/constants/Colors';
import { Typography, TypographyVariant } from '@/constants/Typography';

import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ThemedTextProps = ThemeProps &
  DefaultText['props'] & {
    variant?: TypographyVariant;
    colorName?: ThemeColorName;
  };

export function ThemedText({
  style,
  lightColor,
  darkColor,
  variant = 'body',
  colorName = 'text',
  ...otherProps
}: ThemedTextProps) {
  const theme = useColorScheme() ?? 'light';
  const color = theme === 'dark' ? darkColor ?? Colors.dark[colorName] : lightColor ?? Colors.light[colorName];

  return <DefaultText style={[Typography[variant], { color }, style]} {...otherProps} />;
}
