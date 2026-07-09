import Colors, { ThemeColorName } from '@/constants/Colors';

import { ThemedText, ThemedTextProps } from './ThemedText';
import { ThemedView, ThemedViewProps } from './ThemedView';
import { useColorScheme } from '../../services/useColorScheme';

export type TextProps = ThemedTextProps;
export type ViewProps = ThemedViewProps;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  return colorFromProps ?? Colors[theme][colorName];
}

export const Text = ThemedText;
export const View = ThemedView;
