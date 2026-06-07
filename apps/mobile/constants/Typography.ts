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
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800' as TextStyle['fontWeight'],
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  paragraph: {
  captionStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
};

export type TypographyVariant = keyof typeof Typography;
