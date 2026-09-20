import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutfitCard } from '@/components/OutfitCard';
import { radius, spacing, typography, useTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useWeather } from '@/hooks/useWeather';
import {
  clothesMap,
  fetchTodayOutfits,
  generateOutfits,
  setOutfitLiked,
  type SuggestedOutfit,
} from '@/lib/outfits';
import type { Clothing } from '@/lib/types';
import type { Weather } from '@/lib/weather';
import type { Locale } from '@/lib/i18n';

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
  const { session } = useAuth();
  const { t, locale } = useLocale();
  const { state } = useWeather();
  const [outfits, setOutfits] = useState<SuggestedOutfit[]>([]);
  const [clothes, setClothes] = useState<Map<string, Clothing>>(new Map());
  const [generating, setGenerating] = useState(false);

  const weather = state.status === 'ready' ? state.weather : null;

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      try {
        const [today, map] = await Promise.all([
          fetchTodayOutfits(session.user.id),
          clothesMap(session.user.id),
        ]);
        setOutfits(today);
        setClothes(map);
      } catch {
        // non-fatal
      }
    })();
  }, [session]);

  const onGenerate = useCallback(async () => {
    if (!session?.user) return;
    setGenerating(true);
    try {
      const map = await clothesMap(session.user.id);
      setClothes(map);
      const w = weather ? { temp: weather.temp, condition: weather.condition } : null;
      const { outfits: fresh, error } = await generateOutfits(w);
      if (error === 'not_enough_items') {
        Alert.alert(t('today.tooFewTitle'), t('today.tooFewBody'));
      } else if (error) {
        Alert.alert(t('common.error'), error);
      } else {
        setOutfits((prev) => [...fresh, ...prev]);
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  }, [session, weather, t]);

  async function rate(id: string, liked: boolean) {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    try {
      await setOutfitLiked(id, liked);
    } catch {
      // optimistic
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.screen, gap: spacing.lg, paddingBottom: 110 }}>
        <View style={{ gap: 2 }}>
          <Text style={[typography.eyebrow, { color: colors.textMuted }]}>
            {todayLabel(locale)}
          </Text>
          <Text style={[typography.h1, { color: colors.text }]}>{t(greetingKey())}</Text>
        </View>

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

        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.h2, { color: colors.text }]}>{t('today.outfits')}</Text>
            <Pressable
              onPress={onGenerate}
              disabled={generating}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingVertical: 8,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                opacity: generating ? 0.5 : 1,
              })}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Ionicons name="color-wand-outline" size={16} color={colors.primaryText} />
              )}
              <Text style={[typography.caption, { color: colors.primaryText }]}>
                {generating ? t('today.generating') : t('today.generate')}
              </Text>
            </Pressable>
          </View>

          {outfits.length === 0 ? (
            <EmptySuggestions />
          ) : (
            outfits.map((o) => (
              <OutfitCard
                key={o.id}
                outfit={o}
                clothes={clothes}
                onLike={() => rate(o.id, true)}
                onSkip={() => rate(o.id, false)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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

function EmptySuggestions() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="color-wand-outline" size={36} color={colors.textMuted} />
      <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>
        {t('today.noOutfitsTitle')}
      </Text>
      <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>
        {t('today.noOutfitsBody')}
      </Text>
      <Pressable
        onPress={() => router.push('/(tabs)/wardrobe')}
        style={({ pressed }) => ({
          marginTop: spacing.xs,
          paddingVertical: 10,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
        })}
      >
        <Text style={[typography.button, { color: colors.text }]}>{t('today.myWardrobe')}</Text>
      </Pressable>
    </View>
  );
}
