const light = {
  primary: '#FEDA10',
  secondary: '#38632E',
  background: '#FFFFFF',
  surface: '#E6E6E6',
  text: '#21242C',
  muted: '#6B7280',
  tint: '#38632E',
  tabIconDefault: '#6B7280',
  tabIconSelected: '#38632E',
  separator: '#E5E7EB',
  codeBackground: 'rgba(33, 36, 44, 0.05)',
  statusBar: 'dark' as const,
};

const dark = {
  primary: '#FEDA10',
  secondary: '#7BA66F',
  background: '#21242C',
  surface: '#2E323C',
  text: '#FFFFFF',
  muted: '#D1D5DB',
  tint: '#FEDA10',
  tabIconDefault: '#D1D5DB',
  tabIconSelected: '#FEDA10',
  separator: 'rgba(255, 255, 255, 0.16)',
  codeBackground: 'rgba(255, 255, 255, 0.08)',
  statusBar: 'light' as const,
};

export const Colors = {
  primary: light.primary,
  secondary: light.secondary,
  background: light.background,
  surface: light.surface,
  text: light.text,
  muted: light.muted,
  separator: light.separator,
  codeBackground: light.codeBackground,
  tint: light.tint,
  light: {
    ...light,
  },
  dark: {
    ...dark,
  },
};

export type ColorSchemeName = 'light' | 'dark';
export type ThemeColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

export default Colors;
