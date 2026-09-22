import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeeklyPlanner } from '@/components/WeeklyPlanner';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useWeather } from '@/hooks/useWeather';
import { CompanionCard } from '@/components/companion/CompanionCard';
import type { Weather } from '@/lib/weather';
import type { Locale } from '@/lib/i18n';
import { clothesMap, fetchWeeklyOutfits, generateWeeklyOutfits, type SuggestedOutfit } from '@/lib/outfits';
import type { Clothing } from '@/lib/types';
import { nextSevenDays } from '@/lib/week';

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'today.greetingMorning';
  if (h < 18) return 'today.greetingAfternoon';
  return 'today.greetingEvening';
}

function todayLabel(locale: Locale): string {
  return new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function Today() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { t, locale } = useLocale();
  const { state } = useWeather();
  const router = useRouter();
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState('');
  const [weekOutfits, setWeekOutfits] = useState<SuggestedOutfit[]>([]);
  const [clothes, setClothes] = useState<Map<string, Clothing>>(() => new Map());
  const [generatingWeek, setGeneratingWeek] = useState(false);
  const [weekError, setWeekError] = useState<string | null>(null);
  const userId = profile?.id ?? null;
  const weekDays = useMemo(
    () => nextSevenDays(
      locale,
      state.status === 'ready' ? state.weather : null,
      state.status === 'ready' ? state.forecast : []
    ),
    [locale, state]
  );
  const dateList = weekDays.map((day) => day.date).join(',');

  const loadWeek = useCallback(async () => {
    if (!userId) return;
    try {
      const dates = dateList.split(',').filter(Boolean);
      const [saved, map] = await Promise.all([
        fetchWeeklyOutfits(userId, dates),
        clothesMap(userId),
      ]);
      setWeekOutfits(saved);
      setClothes(map);
      setWeekError(null);
      setSelectedDate((current) => current || dates[0] || '');
    } catch {
      setWeekError(t('week.loadError'));
    }
  }, [dateList, userId, t]);

  useFocusEffect(useCallback(() => { loadWeek(); }, [loadWeek]));

  async function generateWeek() {
    setGeneratingWeek(true);
    setWeekError(null);
    try {
      const { outfits, error } = await generateWeeklyOutfits(
        weekDays.map((day) => ({
          date: day.date,
          weather: day.weather ? { temp: day.weather.temp, condition: day.weather.condition } : null,
        }))
      );
      if (error) {
        setWeekError(
          error === 'not_enough_items'
            ? t('today.tooFewBody')
            : `${t('week.generateError')} (${error})`
        );
        return;
      }
      setWeekOutfits(outfits);
      // Pieces may have been added since the list was loaded.
      if (userId) setClothes(await clothesMap(userId));
      if (outfits[0]?.planned_for) setSelectedDate(outfits[0].planned_for);
    } catch {
      setWeekError(t('week.generateError'));
    } finally {
      setGeneratingWeek(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: spacing.screen,
          gap: spacing.lg,
          paddingBottom: 132,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Text style={[typography.eyebrow, { color: colors.accent }]}>WARDROBE / TODAY</Text>
            <Text style={[typography.h1, { color: colors.text }]}>
              {t(greetingKey())}{profile?.first_name ? ` ${profile.first_name}` : ''}
            </Text>
            <Text style={[typography.small, { color: colors.textMuted, textTransform: 'capitalize' }]}>
              {todayLabel(locale)}
            </Text>
          </View>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 20,
              backgroundColor: colors.surfaceAlt,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {profile?.profile_photo_clean_url || profile?.profile_photo_url ? (
              <Image
                source={{ uri: profile.profile_photo_clean_url ?? profile.profile_photo_url ?? '' }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                contentPosition="top"
                cachePolicy="memory-disk"
              />
            ) : (
              <Ionicons name="person" size={22} color={colors.textMuted} />
            )}
          </View>
        </View>

        {/* Companion greets you and comments on the day */}
        <CompanionCard
          temp={state.status === 'ready' ? state.weather.temp : null}
          weatherMain={state.status === 'ready' ? state.weather.main : null}
        />

        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ModeButton label={t('today.dayTab')} selected={mode === 'day'} onPress={() => setMode('day')} />
          <ModeButton label={t('today.weekTab')} selected={mode === 'week'} onPress={() => setMode('week')} />
        </View>

        {mode === 'day' ? (
          <>
        {/* Weather */}
        {state.status === 'loading' ? (
          <View
            style={{
              backgroundColor: colors.hero,
              borderRadius: radius.xl,
              padding: spacing.lg,
              alignItems: 'center',
              paddingVertical: spacing.xl,
            }}
          >
            <ActivityIndicator color={colors.heroText} />
          </View>
        ) : state.status === 'ready' ? (
          <WeatherCard weather={state.weather} />
        ) : (
          <View style={{ backgroundColor: colors.hero, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="cloud-offline-outline" size={22} color={colors.heroText} />
              <Text style={[typography.bodyStrong, { color: colors.heroText }]}>
                {t('today.weatherUnavailable')}
              </Text>
            </View>
            <Text style={[typography.small, { color: colors.heroMuted }]}>{state.message}</Text>
          </View>
        )}

        {/* Single clear action: go build today's look */}
        <Pressable
          onPress={() => router.push('/(tabs)/outfit')}
          style={({ pressed }) => ({
            borderRadius: radius.xl,
            backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.sm,
          })}
        >
          <Text style={[typography.eyebrow, { color: colors.textMuted }]}>{t('today.lookEyebrow')}</Text>
          <Text style={[typography.h2, { color: colors.text }]}>{t('today.lookTitle')}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('today.lookBody')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs }}>
            <Text style={[typography.button, { color: colors.accent }]}>{t('today.lookCta')}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.accent} />
          </View>
        </Pressable>
          </>
        ) : (
          <WeeklyPlanner
            days={weekDays}
            selectedDate={selectedDate || weekDays[0]?.date || ''}
            outfits={weekOutfits}
            clothes={clothes}
            generating={generatingWeek}
            error={weekError}
            onSelectDate={setSelectedDate}
            onGenerate={generateWeek}
            onOpenToday={() => router.push('/(tabs)/outfit')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.text : 'transparent',
      }}
    >
      <Text style={[typography.button, { color: selected ? colors.bg : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function WeatherCard({ weather }: { weather: Weather }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <View style={{ backgroundColor: colors.hero, borderRadius: radius.xl, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="location-outline" size={16} color={colors.heroMuted} />
        <Text style={[typography.caption, { color: colors.heroMuted }]}>{weather.city}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.sm,
        }}
      >
        <View>
          <Text style={[typography.display, { color: colors.heroText }]}>{weather.temp}°</Text>
          <Text style={[typography.body, { color: colors.heroMuted, textTransform: 'capitalize' }]}>
            {weather.condition}
          </Text>
        </View>
        <Ionicons name={weather.icon} size={76} color={colors.heroAccent} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.lg,
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.heroMuted + '33',
        }}
      >
        <WeatherStat label={t('today.feelsLike')} value={`${weather.feelsLike}°`} />
        <WeatherStat label={t('today.min')} value={`${weather.tempMin}°`} />
        <WeatherStat label={t('today.max')} value={`${weather.tempMax}°`} />
      </View>
    </View>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[typography.caption, { color: colors.heroMuted }]}>{label}</Text>
      <Text style={[typography.h3, { color: colors.heroText }]}>{value}</Text>
    </View>
  );
}
