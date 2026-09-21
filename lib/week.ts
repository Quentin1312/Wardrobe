import type { Locale } from '@/lib/i18n';
import type { DailyForecast, Weather } from '@/lib/weather';

export interface WeekDay {
  date: string;
  dayLabel: string;
  dateLabel: string;
  weather: { temp: number; condition: string; icon: Weather['icon'] } | null;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function nextSevenDays(
  locale: Locale,
  current: Weather | null,
  forecast: DailyForecast[]
): WeekDay[] {
  const language = locale === 'fr' ? 'fr-FR' : 'en-US';
  const forecastByDate = new Map(forecast.map((item) => [item.date, item]));
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const key = dateKey(date);
    const daily = forecastByDate.get(key);
    const weather = index === 0 && current
      ? { temp: current.temp, condition: current.condition, icon: current.icon }
      : daily
        ? { temp: daily.temp, condition: daily.condition, icon: daily.icon }
        : null;

    return {
      date: key,
      dayLabel: index === 0
        ? locale === 'fr' ? "Aujourd’hui" : 'Today'
        : date.toLocaleDateString(language, { weekday: 'short' }).replace('.', ''),
      dateLabel: date.toLocaleDateString(language, { day: 'numeric', month: 'short' }).replace('.', ''),
      weather,
    };
  });
}
