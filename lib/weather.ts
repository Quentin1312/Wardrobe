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

/**
 * WMO weather codes (Open-Meteo) → the groups the rest of the app already
 * speaks, plus a human label.
 */
const WMO: { max: number; main: string; fr: string; en: string }[] = [
  { max: 0, main: 'Clear', fr: 'ciel dégagé', en: 'clear sky' },
  { max: 2, main: 'Clouds', fr: 'partiellement nuageux', en: 'partly cloudy' },
  { max: 3, main: 'Clouds', fr: 'couvert', en: 'overcast' },
  { max: 48, main: 'Fog', fr: 'brouillard', en: 'fog' },
  { max: 57, main: 'Drizzle', fr: 'bruine', en: 'drizzle' },
  { max: 67, main: 'Rain', fr: 'pluie', en: 'rain' },
  { max: 77, main: 'Snow', fr: 'neige', en: 'snow' },
  { max: 82, main: 'Rain', fr: 'averses', en: 'rain showers' },
  { max: 86, main: 'Snow', fr: 'averses de neige', en: 'snow showers' },
  { max: 99, main: 'Thunderstorm', fr: 'orage', en: 'thunderstorm' },
];

function fromCode(code: number, lang: string) {
  const entry = WMO.find((item) => code <= item.max) ?? WMO[WMO.length - 1];
  return { main: entry.main, condition: lang.startsWith('fr') ? entry.fr : entry.en };
}

/**
 * Seven-day forecast from Open-Meteo: free, no key, and it reaches further than
 * OpenWeather's five days, with a real daily minimum and maximum.
 */
export async function fetchForecast(
  lat: number,
  lon: number,
  lang = 'en'
): Promise<DailyForecast[]> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat}&longitude=${lon}` +
    '&daily=temperature_2m_min,temperature_2m_max,weather_code&forecast_days=7&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const dates: string[] = data.daily?.time ?? [];
  return dates.map((date, i) => {
    const min = Math.round(data.daily?.temperature_2m_min?.[i] ?? 0);
    const max = Math.round(data.daily?.temperature_2m_max?.[i] ?? 0);
    const { main, condition } = fromCode(Number(data.daily?.weather_code?.[i] ?? 3), lang);
    return {
      date,
      // Headline temperature of a day: what it reaches in the afternoon.
      temp: max,
      min,
      max,
      condition,
      main,
      icon: iconFor(main),
    };
  });
}

/** Short human summary used later as outfit-suggestion context. */
export function weatherContext(w: Weather): string {
  return `${w.temp}°C, ${w.condition}`;
}
