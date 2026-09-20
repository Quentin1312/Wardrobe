// constants/theme.ts — Wardrobe · direction « Éditorial · Tactile · Chaleureux »
// Mêmes clés qu'avant (colors, spacing, radius) + nouvelles clés et exports.
//
// Polices :
//   npx expo install expo-font @expo-google-fonts/instrument-serif @expo-google-fonts/instrument-sans
// Chargement (app/_layout.tsx) :
//   import { useFonts, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
//   import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans';

import { TextStyle, ViewStyle } from 'react-native';

export const lightColors = {
  // --- clés existantes ---
  bg: '#F5EFE4',
  surface: '#FFFBF3',
  border: '#E0D4C0',
  text: '#241A14',
  textMuted: '#6B5E51',
  primary: '#2C3A2E',
  primaryText: '#F8F3E8',
  accent: '#B04824',
  danger: '#B3362B',
  success: '#2A7453',

  // --- nouvelles clés ---
  surfaceAlt: '#ECE3D3', // fond enfoncé : vignettes, état pressé, segments
  borderStrong: '#CDBFA6', // bouton ghost, repères
  primaryPressed: '#1F2A21',
  accentText: '#FFF8F0', // texte sur accent
  accentSoft: '#F3DACB', // pastille « Léger · 25° »
  hero: '#2C3A2E', // carte météo
  heroText: '#F8F3E8',
  heroMuted: '#B9C2AF',
  heroAccent: '#F0B27A', // soleil du glyphe météo
  onPrimaryAccent: '#F0B27A', // cœur du bouton J'aime
  overlay: 'rgba(36,26,20,0.48)', // voile derrière les feuilles modales
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  bg: '#14110D',
  surface: '#1E1914',
  border: '#382F25',
  text: '#F3EBDD',
  textMuted: '#A99C8B',
  primary: '#D9E1C7',
  primaryText: '#172016',
  accent: '#E58A63',
  danger: '#F0766A',
  success: '#78C79A',

  surfaceAlt: '#29231C',
  borderStrong: '#54483A',
  primaryPressed: '#C3CEAF',
  accentText: '#1F110A',
  accentSoft: '#3A231A',
  hero: '#253128',
  heroText: '#F3EBDD',
  heroMuted: '#A9B6A2',
  heroAccent: '#F0B27A',
  onPrimaryAccent: '#A8421F',
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
  sm: 12,
  md: 16, // champs, vignettes
  lg: 24, // cartes, photos
  xl: 32, // carte météo, feuille modale, cadre photo
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
  display: { fontFamily: fonts.serif, fontSize: 80, lineHeight: 70, letterSpacing: -2.4 }, // température
  h1: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 46, letterSpacing: -0.9 }, // titre d'écran
  h2: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, letterSpacing: -0.5 }, // section, feuille (32/36)
  h3: { fontFamily: fonts.sansSemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  button: { fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  eyebrow: { fontFamily: fonts.sansSemi, fontSize: 11, lineHeight: 14, letterSpacing: 1.4, textTransform: 'uppercase' },
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
