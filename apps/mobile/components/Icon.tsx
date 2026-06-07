import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

import Colors, { ThemeColorName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

import { useColorScheme } from './useColorScheme';

type IconProps = Omit<ComponentProps<typeof Feather>, 'color'> & {
  color?: string;
  colorName?: ThemeColorName;
};

export function Icon({ color, colorName = 'text', size = Spacing.lg, ...props }: IconProps) {
  const theme = useColorScheme() ?? 'light';

  return <Feather color={color ?? Colors[theme][colorName]} size={size} {...props} />;
}
