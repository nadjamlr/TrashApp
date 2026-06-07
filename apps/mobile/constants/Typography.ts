import type { TextStyle } from 'react-native';

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900' as TextStyle['fontWeight'],
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  h3: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  p1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  p2: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  c1: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  c2: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
};

export type TypographyVariant = keyof typeof Typography;
