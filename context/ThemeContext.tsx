import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  darkColors,
  lightColors,
  shadows,
  spacing,
  radius,
  fonts,
  typography,
  type Colors,
} from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'wardrobe.themeMode';

interface ThemeValue {
  dark: boolean;
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  typography: typeof typography;
  shadows: { floating: ReturnType<typeof shadows.floating>; sheet: ReturnType<typeof shadows.sheet> };
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const dark = mode === 'system' ? system === 'dark' : mode === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      dark,
      colors: dark ? darkColors : lightColors,
      spacing,
      radius,
      fonts,
      typography,
      shadows: { floating: shadows.floating(dark), sheet: shadows.sheet(dark) },
      mode,
      setMode: (m) => {
        setModeState(m);
        AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
      },
    }),
    [dark, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
