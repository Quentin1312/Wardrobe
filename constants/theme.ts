// Wardrobe · direction « Digital fitting room · Mode · Jeune »
//
// Polices :
//   npx expo install expo-font @expo-google-fonts/instrument-serif @expo-google-fonts/instrument-sans
// Chargement (app/_layout.tsx) :
//   import { useFonts, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
//   import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans';

import { TextStyle, ViewStyle } from 'react-native';

export const lightColors = {
  bg: '#F2F2EE',
  surface: '#FFFFFF',
  border: '#DFDFD9',
  text: '#101011',
  textMuted: '#6D6D68',
  primary: '#111113',
  primaryText: '#F9F9F5',
  accent: '#635BFF',
  danger: '#DC3F52',
  success: '#16805A',

  surfaceAlt: '#E8E8E2',
  borderStrong: '#B9B9B1',
  primaryPressed: '#2B2B2F',
  accentText: '#FFFFFF',
  accentSoft: '#E7E5FF',
  hero: '#151517',
  heroText: '#F9F9F5',
  heroMuted: '#A8A8A3',
  heroAccent: '#C9FF3F',
  onPrimaryAccent: '#C9FF3F',
  energy: '#C9FF3F',
  energyText: '#111113',
  chrome: '#151517',
  chromeMuted: '#989899',
  overlay: 'rgba(10,10,12,0.62)',
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  bg: '#0B0B0C',
  surface: '#171719',
  border: '#303034',
  text: '#F5F5F0',
  textMuted: '#9C9C98',
  primary: '#F5F5F0',
  primaryText: '#101011',
  accent: '#7B74FF',
  danger: '#FF6A78',
  success: '#5EE0A9',

  surfaceAlt: '#232326',
  borderStrong: '#4A4A50',
  primaryPressed: '#DADAD4',
  accentText: '#FFFFFF',
  accentSoft: '#292653',
  hero: '#171719',
  heroText: '#F5F5F0',
  heroMuted: '#A3A3A0',
  heroAccent: '#C9FF3F',
  onPrimaryAccent: '#6E63FF',
  energy: '#C9FF3F',
  energyText: '#101011',
  chrome: '#151517',
  chromeMuted: '#8D8D92',
  overlay: 'rgba(0,0,0,0.62)',
};

// Compat : `colors` reste l'export historique (clair). Préférer useTheme().
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: 20, // marge horizontale d'écran (375 px → contenu de 335)
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  full: 999, // boutons, chips, tab bar
};

export const hit = { min: 44 }; // cible tactile minimale

export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'InstrumentSans_400Regular',
  sansMedium: 'InstrumentSans_500Medium',
  sansSemi: 'InstrumentSans_600SemiBold',
  sansBold: 'InstrumentSans_700Bold',
};

// Une famille = un poids dans RN : pas de fontWeight.
export const typography = {
  display: { fontFamily: fonts.sansBold, fontSize: 72, lineHeight: 70, letterSpacing: -3.2 },
  h1: { fontFamily: fonts.sansBold, fontSize: 40, lineHeight: 42, letterSpacing: -1.8 },
  h2: { fontFamily: fonts.sansSemi, fontSize: 28, lineHeight: 32, letterSpacing: -0.8 },
  h3: { fontFamily: fonts.sansSemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  button: { fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.8, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export const shadows = {
  floating: (dark: boolean): ViewStyle => ({
    shadowColor: dark ? '#000000' : '#3B2A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: dark ? 0.5 : 0.12,
    shadowRadius: 24,
    elevation: 8,
  }),
  sheet: (dark: boolean): ViewStyle => ({
    shadowColor: dark ? '#000000' : '#3B2A1A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: dark ? 0.5 : 0.14,
    shadowRadius: 32,
    elevation: 16,
  }),
};

// Layout
export const layout = {
  tabBarHeight: 64,
  // bas de contenu scrollable : tabBarHeight + max(insets.bottom, 12) + 16
  tabBarBottom: (insetBottom: number) => Math.max(insetBottom, 12),
  screenTop: (insetTop: number) => insetTop + 8,
};

// useTheme() now lives in context/ThemeContext.tsx (supports manual light/dark toggle).
