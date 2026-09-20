import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translate, type Locale } from '@/lib/i18n';

const STORAGE_KEY = 'wardrobe.locale';

interface LocaleContextValue {
  locale: Locale;
  chosen: boolean; // has the user explicitly picked a language?
  ready: boolean; // finished reading persisted choice
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return code === 'fr' ? 'fr' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale());
  const [chosen, setChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'fr' || saved === 'en') {
          setLocaleState(saved);
          setChosen(true);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      chosen,
      ready,
      setLocale: (l) => {
        setLocaleState(l);
        setChosen(true);
        AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
      },
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, chosen, ready]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
