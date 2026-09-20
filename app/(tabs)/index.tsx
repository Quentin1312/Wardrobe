import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutfitCard } from '@/components/OutfitCard';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
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
  const { session, profile } = useAuth();
  const { t, locale } = useLocale();
  const { state } = useWeather();
  const [outfits, setOutfits] = useState<SuggestedOutfit[]>([]);
  const [clothes, setClothes] = useState<Map<string, Clothing>>(new Map());
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

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
    setGenMessage(null);
    try {
      const map = await clothesMap(session.user.id);
      setClothes(map);
      const w = weather ? { temp: weather.temp, condition: weather.condition } : null;
      const { outfits: fresh, error } = await generateOutfits(w);
      if (error === 'not_enough_items') {
        setGenMessage(t('today.tooFewBody'));
      } else if (error === 'empty' || error === 'no_valid_outfit') {
        setGenMessage(t('today.noOutfitBody'));
      } else if (error) {
        // Show the raw error so the real cause is visible (works on web too).
        setGenMessage(error);
      } else {
        setOutfits((prev) => [...fresh, ...prev]);
      }
    } catch (e: any) {
      setGenMessage(e?.message ?? 'Generation failed.');
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
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: spacing.screen,
          gap: spacing.lg,
          paddingBottom: 128,
        }}
      >
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
              transform: [{ rotate: '3deg' }],
            }}
          >
            {profile?.profile_photo_clean_url || profile?.profile_photo_url ? (
              <Image
                source={{ uri: profile.profile_photo_clean_url ?? profile.profile_photo_url ?? '' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={22} color={colors.textMuted} />
            )}
          </View>
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
            <View style={{ gap: 2 }}>
              <Text style={[typography.eyebrow, { color: colors.textMuted }]}>AI STYLIST</Text>
              <Text style={[typography.h2, { color: colors.text }]}>{t('today.outfits')}</Text>
            </View>
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

          {genMessage ? (
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.accent,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{genMessage}</Text>
            </View>
          ) : null}

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
    <View style={{ backgroundColor: colors.hero, borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 170,
          height: 170,
          borderRadius: 85,
          right: -52,
          top: -62,
          backgroundColor: colors.accent,
          opacity: 0.35,
        }}
      />
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
        <View style={{ width: 82, height: 82, borderRadius: 28, backgroundColor: colors.heroAccent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '6deg' }] }}>
          <Ionicons name={weather.icon} size={48} color={colors.energyText} />
        </View>
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
