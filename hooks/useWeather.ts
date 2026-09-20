import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { fetchWeather, type Weather } from '@/lib/weather';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; weather: Weather };

export function useWeather() {
  const { locale } = useLocale();
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setState({ status: 'error', message: 'Location permission denied.' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const weather = await fetchWeather(
        pos.coords.latitude,
        pos.coords.longitude,
        locale
      );
      setState({ status: 'ready', weather });
    } catch (e: any) {
      setState({ status: 'error', message: e.message ?? 'Weather unavailable.' });
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
