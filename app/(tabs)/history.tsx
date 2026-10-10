import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { clothesMap, fetchWornOutfits, setOutfitFavorite } from '@/lib/outfits';
import type { Clothing, Outfit } from '@/lib/types';

/**
 * A month of looks you actually wore. Hearting one tells the stylist to lean
 * that way; the hearts are read back when it composes the next outfit.
 */
export default function History() {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [monthOffset, setMonthOffset] = useState(0);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothes, setClothes] = useState<Map<string, Clothing>>(new Map());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  const start = new Date();
  start.setMonth(start.getMonth() - monthOffset, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [worn, map] = await Promise.all([fetchWornOutfits(userId, start, end), clothesMap(userId)]);
      setOutfits(worn);
      setClothes(map);
    } catch {
      setOutfits([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, monthOffset]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleFavorite(outfit: Outfit) {
    const next = !outfit.favorite;
    setFailed(null);
    setOutfits((previous) => previous.map((o) => (o.id === outfit.id ? { ...o, favorite: next } : o)));
    try {
      await setOutfitFavorite(outfit.id, next);
    } catch (e: any) {
      setFailed(e?.message ?? t('common.error'));
      load();
    }
  }

  const monthLabel = start.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
  const hearted = outfits.filter((outfit) => outfit.favorite).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: spacing.screen,
          paddingBottom: 132,
          gap: spacing.md,
        }}
      >
        <View style={{ gap: 4 }}>
          <Text style={[typography.eyebrow, { color: colors.accent }]}>{t('history.eyebrow')}</Text>
          <Text style={[typography.h1, { color: colors.text }]}>{t('history.title')}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('history.subtitle')}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <MonthArrow icon="chevron-back" onPress={() => setMonthOffset((m) => m + 1)} />
          <View style={{ alignItems: 'center' }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {t('history.count', { count: outfits.length, hearted })}
            </Text>
          </View>
          <MonthArrow
            icon="chevron-forward"
            disabled={monthOffset === 0}
            onPress={() => setMonthOffset((m) => Math.max(0, m - 1))}
          />
        </View>

        {failed ? (
          <Text style={[typography.small, { color: colors.danger }]}>{failed}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : outfits.length === 0 ? (
          <EmptyState icon="time-outline" title={t('history.emptyTitle')} subtitle={t('history.emptyBody')} />
        ) : (
          outfits.map((outfit) => (
            <WornCard
              key={outfit.id}
              outfit={outfit}
              clothes={clothes}
              onToggleFavorite={() => toggleFavorite(outfit)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MonthArrow({
  icon,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
        opacity: disabled ? 0.3 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

/** One worn look: its pieces, the day, the weather, and the heart. */
function WornCard({
  outfit,
  clothes,
  onToggleFavorite,
}: {
  outfit: Outfit;
  clothes: Map<string, Clothing>;
  onToggleFavorite: () => void;
}) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const pieces = outfit.clothes_ids
    .map((id) => clothes.get(id))
    .filter((piece): piece is Clothing => Boolean(piece));
  const day = new Date(outfit.generated_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
  });

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: outfit.favorite ? colors.accent : colors.border,
        backgroundColor: colors.surface,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </Text>
          {outfit.weather_context ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>{outfit.weather_context}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t(outfit.favorite ? 'history.unheart' : 'history.heart')}
          accessibilityState={{ selected: Boolean(outfit.favorite) }}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
          })}
        >
          <Ionicons
            name={outfit.favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={outfit.favorite ? colors.energy : colors.textMuted}
          />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {pieces.map((piece) => (
          <View
            key={piece.id}
            style={{
              flex: 1,
              aspectRatio: 1,
              maxWidth: 96,
              borderRadius: radius.md,
              backgroundColor: '#EFEEE9',
              padding: 5,
            }}
          >
            <Image
              source={{ uri: piece.photo_clean_url ?? piece.photo_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              cachePolicy="memory-disk"
              recyclingKey={piece.id}
            />
          </View>
        ))}
      </View>

      {outfit.favorite ? (
        <Text style={[typography.caption, { color: colors.accent }]}>{t('history.favoriteHint')}</Text>
      ) : null}
    </View>
  );
}
