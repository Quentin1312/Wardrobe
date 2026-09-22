import type { Ionicons } from '@expo/vector-icons';

export interface Weather {
  city: string;
  temp: number; // °C, rounded
  feelsLike: number; // °C, rounded
  tempMin: number;
  tempMax: number;
  condition: string; // localized description
  main: string; // e.g. "Clouds", "Rain"
  icon: keyof typeof Ionicons.glyphMap;
}

export interface DailyForecast {
  date: string;
  temp: number;
  /** Coldest and warmest readings of that day. */
  min: number;
  max: number;
  condition: string;
  main: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OWM_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;

// Map OpenWeatherMap "main" groups to Ionicons.
function iconFor(main: string): keyof typeof Ionicons.glyphMap {
  switch (main) {
    case 'Clear':
      return 'sunny-outline';
    case 'Clouds':
      return 'cloudy-outline';
    case 'Rain':
    case 'Drizzle':
      return 'rainy-outline';
    case 'Thunderstorm':
      return 'thunderstorm-outline';
    case 'Snow':
      return 'snow-outline';
    case 'Mist':
    case 'Fog':
    case 'Haze':
    case 'Smoke':
      return 'reorder-four-outline';
    default:
      return 'partly-sunny-outline';
  }
}

export async function fetchWeather(
  lat: number,
  lon: number,
  lang = 'en'
): Promise<Weather> {
  if (!OWM_KEY) {
    throw new Error('OpenWeatherMap key missing (EXPO_PUBLIC_OPENWEATHER_KEY).');
  }
  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}&lon=${lon}&units=metric&lang=${lang}&appid=${OWM_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Météo indisponible (${res.status}).`);
  }
  const data = await res.json();
  const main = data.weather?.[0]?.main ?? 'Clouds';

  return {
    city: data.name ?? '—',
    temp: Math.round(data.main?.temp ?? 0),
    feelsLike: Math.round(data.main?.feels_like ?? 0),
    tempMin: Math.round(data.main?.temp_min ?? 0),
    tempMax: Math.round(data.main?.temp_max ?? 0),
    condition: data.weather?.[0]?.description ?? '',
    main,
    icon: iconFor(main),
  };
}

/** OpenWeather's free five-day forecast, reduced to one midday reading per day. */
export async function fetchForecast(
  lat: number,
  lon: number,
  lang = 'en'
): Promise<DailyForecast[]> {
  if (!OWM_KEY) return [];
  const url =
    `https://api.openweathermap.org/data/2.5/forecast` +
    `?lat=${lat}&lon=${lon}&units=metric&lang=${lang}&appid=${OWM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const offsetSeconds = Number(data.city?.timezone ?? 0);
  const best = new Map<string, { distance: number; forecast: DailyForecast }>();
  const range = new Map<string, { min: number; max: number }>();

  for (const reading of data.list ?? []) {
    const local = new Date((Number(reading.dt) + offsetSeconds) * 1000);
    const date = local.toISOString().slice(0, 10);
    const hour = local.getUTCHours();
    const main = reading.weather?.[0]?.main ?? 'Clouds';
    const temp = Math.round(reading.main?.temp ?? 0);
    const seen = range.get(date);
    range.set(date, {
      min: Math.min(seen?.min ?? temp, temp),
      max: Math.max(seen?.max ?? temp, temp),
    });
    const candidate = {
      distance: Math.abs(hour - 12),
      forecast: {
        date,
        temp,
        min: temp,
        max: temp,
        condition: reading.weather?.[0]?.description ?? '',
        main,
        icon: iconFor(main),
      },
    };
    if (!best.has(date) || candidate.distance < best.get(date)!.distance) best.set(date, candidate);
  }

  return [...best.values()]
    .map((entry) => ({ ...entry.forecast, ...(range.get(entry.forecast.date) ?? {}) }))
    .slice(0, 5);
}

/** Short human summary used later as outfit-suggestion context. */
export function weatherContext(w: Weather): string {
  return `${w.temp}°C, ${w.condition}`;
}
