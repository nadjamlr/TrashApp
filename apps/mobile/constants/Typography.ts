import type { TextStyle } from 'react-native';

export const Typography = {
  h1: {
    fontFamily: 'Poppins',
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '900' as TextStyle['fontWeight'],
  },
  h2: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  h3: {
    fontSize: 18,
    lineHeight: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
};

export type TypographyVariant = keyof typeof Typography;
