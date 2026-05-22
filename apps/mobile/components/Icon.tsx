import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';

import Colors, { ThemeColorName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

import { useColorScheme } from './useColorScheme';

type IconProps = Omit<ComponentProps<typeof FontAwesome>, 'color'> & {
  color?: string;
  colorName?: ThemeColorName;
};

export function Icon({ color, colorName = 'text', size = Spacing.lg, ...props }: IconProps) {
  const theme = useColorScheme() ?? 'light';

  return <FontAwesome color={color ?? Colors[theme][colorName]} size={size} {...props} />;
}
