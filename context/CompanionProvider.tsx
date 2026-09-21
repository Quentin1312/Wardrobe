import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { COMPANION_KINDS, type CompanionKind } from '@/lib/companion';

const STORAGE_KEY = 'wardrobe.companion';

interface CompanionValue {
  kind: CompanionKind | null;
  ready: boolean;
  setKind: (kind: CompanionKind) => void;
}

const CompanionCtx = createContext<CompanionValue | undefined>(undefined);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [kind, setKindState] = useState<CompanionKind | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && (COMPANION_KINDS as string[]).includes(saved)) setKindState(saved as CompanionKind);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<CompanionValue>(
    () => ({
      kind,
      ready,
      setKind: (next) => {
        setKindState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      },
    }),
    [kind, ready]
  );

  return <CompanionCtx.Provider value={value}>{children}</CompanionCtx.Provider>;
}

export function useCompanion() {
  const ctx = useContext(CompanionCtx);
  if (!ctx) throw new Error('useCompanion must be used within CompanionProvider');
  return ctx;
}
