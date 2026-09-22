import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { OutfitStudio } from '@/components/OutfitStudio';
import { StylistLoader } from '@/components/StylistLoader';
import { TryOnSheet } from '@/components/TryOnSheet';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { useWeather } from '@/hooks/useWeather';
import { OutfitConfirmed } from '@/components/OutfitConfirmed';
import { ShareLookButton } from '@/components/ShareLookButton';
import { fetchClothes, markOutfitDirty, setClothingDirty } from '@/lib/clothes';
import { fetchTodaysWornOutfit, fetchWeeklyOutfits, generateOutfits, saveWornOutfit, setOutfitLiked } from '@/lib/outfits';
import { generateTryOn, type TryOnResponse } from '@/lib/tryon';
import type { Clothing, ClothingCategory } from '@/lib/types';
import { weatherContext } from '@/lib/weather';
import { dateKey } from '@/lib/week';

const REQUIRED: ClothingCategory[] = ['top', 'bottom', 'shoes'];
const OUTFIT_ORDER: ClothingCategory[] = ['top', 'jacket', 'bottom', 'shoes', 'accessory'];
const OPTIONAL: ClothingCategory[] = ['jacket', 'accessory'];
const TRYON_CATEGORIES: ClothingCategory[] = ['bottom', 'top', 'jacket', 'shoes'];

type Buckets = Record<ClothingCategory, Clothing[]>;
type Indices = Record<ClothingCategory, number>;

function emptyBuckets(): Buckets {
  return { top: [], bottom: [], shoes: [], jacket: [], accessory: [] };
}

function indicesForIds(buckets: Buckets, ids: string[]): Indices {
  const indices = { ...INITIAL_INDICES };
  for (const category of OUTFIT_ORDER) {
    const position = buckets[category].findIndex((piece) => ids.includes(piece.id));
    indices[category] = position >= 0 ? position : OPTIONAL.includes(category) ? -1 : 0;
  }
  return indices;
}

const INITIAL_INDICES: Indices = { top: 0, bottom: 0, shoes: 0, jacket: -1, accessory: -1 };

export default function OutfitDay() {
  const { colors, dark } = useTheme();
  const { session, profile } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const { state } = useWeather();
  const weather = state.status === 'ready' ? state.weather : null;

  const [buckets, setBuckets] = useState<Buckets>(emptyBuckets());
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState<Indices>(INITIAL_INDICES);
  const [saved, setSaved] = useState(false);
  const [savedOutfitId, setSavedOutfitId] = useState<string | null>(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [styling, setStyling] = useState(false);
  const [styleMsg, setStyleMsg] = useState<string | null>(null);
  const [styled, setStyled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<Clothing[]>([]);
  /** Non-null once today's look is validated: the studio becomes read-only. */
  const [locked, setLocked] = useState<Clothing[] | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const items = await fetchClothes(session.user.id);
      const next = emptyBuckets();
      // Dirty laundry is not wearable today.
      for (const item of items) if (item.category && !item.dirty) next[item.category].push(item);
      setBuckets(next);
      setIdx(INITIAL_INDICES);
      setSaved(false);
      setSavedOutfitId(null);

      // A look validated today locks the studio until the user changes it.
      try {
        const worn = await fetchTodaysWornOutfit(session.user.id);
        if (worn) {
          const byId = new Map(items.map((piece) => [piece.id, piece]));
          const pieces = worn.clothes_ids
            .map((pieceId) => byId.get(pieceId))
            .filter((piece): piece is Clothing => Boolean(piece));
          setLocked(pieces.length > 0 ? pieces : null);
          setSavedOutfitId(worn.id);
        } else {
          setLocked(null);
          const [planned] = await fetchWeeklyOutfits(session.user.id, [dateKey(new Date())]);
          if (planned) setIdx(indicesForIds(next, planned.clothes_ids));
        }
      } catch {
        setLocked(null);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hasRequired = REQUIRED.every((category) => buckets[category].length > 0);

  const current = useCallback((category: ClothingCategory): Clothing | null => {
    if (locked) return locked.find((piece) => piece.category === category) ?? null;
    if (OPTIONAL.includes(category) && idx[category] < 0) return null;
    return buckets[category][idx[category]] ?? null;
  }, [buckets, idx, locked]);

  const selectedIds = useCallback(
    () => OUTFIT_ORDER.map((category) => current(category)?.id).filter((id): id is string => Boolean(id)),
    [current]
  );

  function resetSavedState() {
    setSaved(false);
    setSavedOutfitId(null);
  }

  function cycle(category: ClothingCategory, direction: 1 | -1) {
    resetSavedState();
    setIdx((previous) => {
      const list = buckets[category];
      if (list.length === 0) return previous;
      const minimum = OPTIONAL.includes(category) ? -1 : 0;
      const stateCount = list.length - minimum;
      const offset = previous[category] - minimum;
      const next = ((offset + direction) % stateCount + stateCount) % stateCount + minimum;
      return { ...previous, [category]: next };
    });
  }

  function shuffle() {
    resetSavedState();
    const pick = (category: ClothingCategory, optional = false) => {
      const count = buckets[category].length;
      if (count === 0) return optional ? -1 : 0;
      if (optional && Math.random() < 0.25) return -1;
      return Math.floor(Math.random() * count);
    };
    setIdx((previous) => ({
      ...previous,
      top: pick('top'),
      bottom: pick('bottom'),
      shoes: pick('shoes'),
      jacket: pick('jacket', true),
      accessory: pick('accessory', true),
    }));
  }

  /** Points each slot at the garments the stylist picked. */
  function applyOutfitIds(ids: string[]) {
    setIdx((previous) => {
      const next: Indices = { ...previous, jacket: -1, accessory: -1 };
      const wearable: ClothingCategory[] = OUTFIT_ORDER;
      for (const id of ids) {
        for (const category of wearable) {
          const position = buckets[category].findIndex((piece) => piece.id === id);
          if (position >= 0) next[category] = position;
        }
      }
      return next;
    });
  }

  /** Ask the AI stylist for a weather-aware look. */
  async function styleMe() {
    resetSavedState();
    setStyleMsg(null);
    setStyling(true);
    try {
      const w = weather ? { temp: weather.temp, condition: weather.condition } : null;
      const { outfits, error } = await generateOutfits(w);
      if (error === 'not_enough_items') {
        setStyleMsg(t('today.tooFewBody'));
      } else if (error === 'empty' || error === 'no_valid_outfit') {
        setStyleMsg(t('today.noOutfitBody'));
      } else if (error) {
        setStyleMsg(error);
      } else if (outfits.length > 0) {
        applyOutfitIds(outfits[0].clothes_ids);
        setStyled(true);
      }
    } catch (e: any) {
      setStyleMsg(e?.message ?? t('common.error'));
    } finally {
      setStyling(false);
    }
  }

  async function persistCurrentOutfit(liked: boolean) {
    if (!session?.user) throw new Error(t('common.error'));
    if (savedOutfitId) {
      // A try-on draft only becomes today's worn look after the explicit
      // "Wear it" action.
      if (liked) await setOutfitLiked(savedOutfitId, true);
      return savedOutfitId;
    }
    const outfit = await saveWornOutfit({
      userId: session.user.id,
      clothesIds: selectedIds(),
      weatherContext: weather ? weatherContext(weather) : null,
      liked,
    });
    setSavedOutfitId(outfit.id);
    return outfit.id;
  }

  /** Undo today's validation: the look was not worn after all. */
  async function unlock() {
    const pieces = locked ?? [];
    const outfitId = savedOutfitId;
    setLocked(null);
    resetSavedState();
    try {
      if (outfitId) await setOutfitLiked(outfitId, false);
      await Promise.all(pieces.map((piece) => setClothingDirty(piece.id, false)));
    } catch {
      // best effort
    }
    load();
  }

  async function validate() {
    const worn = OUTFIT_ORDER
      .map((category) => current(category))
      .filter((piece): piece is Clothing => Boolean(piece));

    await persistCurrentOutfit(true);
    setSaved(true);

    // Worn today: quietly flag the pieces in the wardrobe. They only reach the
    // laundry basket view — no basket animation here, this is a validation.
    try {
      await markOutfitDirty(worn.map((piece) => piece.id));
    } catch {
      // the look is saved either way
    }
    setConfirmedItems(worn);
    setShowConfirm(true);
    setLocked(worn);
  }

  async function runTryOn(): Promise<TryOnResponse> {
    // The rendering service needs an outfit row, but this is only a draft:
    // trying clothes on must never lock them as today's worn look.
    const outfitId = await persistCurrentOutfit(false);
    const result = await generateTryOn(outfitId);
    if (!result.url) throw new Error(result.error ?? t('tryon.error'));
    return result;
  }

  const counts = {
    top: buckets.top.length,
    bottom: buckets.bottom.length,
    shoes: buckets.shoes.length,
    jacket: buckets.jacket.length,
    accessory: buckets.accessory.length,
  };
  const tryOnItems = TRYON_CATEGORIES.map((category) => current(category)).filter(
    (piece): piece is Clothing => Boolean(piece)
  );
  const profilePhoto = profile?.profile_photo_clean_url ?? profile?.profile_photo_url ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !locked && !hasRequired ? (
        <EmptyState
          icon="shirt-outline"
          title={t('outfitDay.needMoreTitle')}
          subtitle={t('outfitDay.needMoreBody')}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: '100%',
            maxWidth: 760,
            alignSelf: 'center',
            paddingHorizontal: spacing.screen,
            paddingTop: spacing.sm,
            paddingBottom: 128,
            gap: spacing.lg,
          }}
        >
          <View style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[typography.eyebrow, { color: colors.accent }]}>FITTING ROOM / 01</Text>
              {weather ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={weather.icon} size={17} color={colors.textMuted} />
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {weather.temp}° · {weather.condition}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[typography.h1, { color: colors.text }]}>
              {locked ? t('outfitDay.lockedTitle') : t('outfitDay.title')}
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              {locked ? t('outfitDay.lockedBody') : t('outfitDay.subtitle')}
            </Text>
          </View>

          <OutfitStudio
            current={current}
            counts={counts}
            locked={!!locked}
            onPrevious={(category) => cycle(category, -1)}
            onNext={(category) => cycle(category, 1)}
          />

          {locked ? (
            <View style={{ gap: spacing.md, alignItems: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: 10,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.full,
                  backgroundColor: colors.surface,
                }}
              >
                <Ionicons name="lock-closed" size={16} color={colors.success} />
                <Text style={[typography.bodyStrong, { color: colors.success }]}>{t('outfitDay.wornToday')}</Text>
              </View>
              <ShareLookButton items={locked} weather={weather} />
              <Pressable
                onPress={unlock}
                hitSlop={8}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                })}
              >
                <Ionicons name="refresh" size={16} color={colors.textMuted} />
                <Text style={[typography.caption, { color: colors.textMuted }]}>{t('outfitDay.change')}</Text>
              </Pressable>
            </View>
          ) : (
          <>
          {saved ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="checkmark-circle" size={21} color={colors.success} />
              <Text style={[typography.bodyStrong, { color: colors.success }]}>{t('outfitDay.wornToday')}</Text>
            </View>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            {/* Primary: let the stylist decide, based on the weather */}
            <Pressable
              onPress={styleMe}
              style={({ pressed }) => ({
                minHeight: 64,
                borderRadius: radius.full,
                backgroundColor: pressed ? colors.accentSoft : colors.energy,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                ...shadows.floating(dark),
              })}
            >
              <Ionicons name="color-wand-outline" size={22} color={colors.energyText} />
              <Text style={[typography.button, { color: colors.energyText, fontSize: 17 }]}>
                {styled ? t('outfitDay.aiRetry') : t('outfitDay.aiCta')}
              </Text>
            </Pressable>

            {styleMsg ? (
              <Pressable
                onPress={() => setStyleMsg(null)}
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
                <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{styleMsg}</Text>
              </Pressable>
            ) : null}

            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
              {t('outfitDay.manual')}
            </Text>

            <Pressable
              onPress={() => setTryOnOpen(true)}
              style={({ pressed }) => ({
                minHeight: 60,
                borderRadius: radius.full,
                backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                ...shadows.floating(dark),
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="body-outline" size={20} color={colors.energy} />
                <Text style={[typography.button, { color: colors.primaryText }]}>{t('tryon.cta')}</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.primaryText} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={shuffle}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 52,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                })}
              >
                <Ionicons name="shuffle" size={18} color={colors.text} />
                <Text style={[typography.button, { color: colors.text }]}>{t('outfitDay.skip')}</Text>
              </Pressable>
              <Pressable
                onPress={validate}
                style={({ pressed }) => ({
                  flex: 1.25,
                  minHeight: 52,
                  borderRadius: radius.full,
                  backgroundColor: pressed ? colors.accentSoft : colors.accent,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                })}
              >
                <Ionicons name="checkmark" size={19} color={colors.accentText} />
                <Text style={[typography.button, { color: colors.accentText }]}>{t('outfitDay.validate')}</Text>
              </Pressable>
            </View>
          </View>
          </>
          )}
        </ScrollView>
      )}

      <StylistLoader visible={styling} />

      {/* Keep the look on screen after validating — no reload. */}
      <OutfitConfirmed
        visible={showConfirm}
        items={confirmedItems}
        weather={weather}
        onClose={() => setShowConfirm(false)}
      />

      <TryOnSheet
        visible={tryOnOpen}
        modelPhoto={profilePhoto}
        items={tryOnItems}
        onClose={() => setTryOnOpen(false)}
        onGenerate={runTryOn}
        onAddPhoto={() => {
          setTryOnOpen(false);
          router.push('/body-photo');
        }}
      />
    </SafeAreaView>
  );
}
