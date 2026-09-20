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

/** Short human summary used later as outfit-suggestion context. */
export function weatherContext(w: Weather): string {
  return `${w.temp}°C, ${w.condition}`;
}
