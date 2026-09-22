import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { OutfitStudio } from '@/components/OutfitStudio';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { StylistLoader } from '@/components/StylistLoader';
import { TryOnSheet } from '@/components/TryOnSheet';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { useWeather } from '@/hooks/useWeather';
import { OutfitConfirmed } from '@/components/OutfitConfirmed';
import { ShareLookButton } from '@/components/ShareLookButton';
import { fetchClothes, markOutfitDirty, setClothingDirty } from '@/lib/clothes';
import { fetchTodaysWornOutfit, fetchWeeklyOutfits, generateOutfits, saveWornOutfit, setOutfitLiked, validLook, type Occasion } from '@/lib/outfits';
import { generateTryOn, type TryOnResponse } from '@/lib/tryon';
import type { Clothing, ClothingCategory } from '@/lib/types';
import { weatherContext } from '@/lib/weather';
import { dateKey } from '@/lib/week';

const REQUIRED: ClothingCategory[] = ['top', 'bottom', 'shoes'];
const OUTFIT_ORDER: ClothingCategory[] = ['top', 'mid', 'jacket', 'bottom', 'shoes', 'accessory'];
const OPTIONAL: ClothingCategory[] = ['mid', 'jacket', 'accessory'];
const TRYON_CATEGORIES: ClothingCategory[] = ['bottom', 'top', 'mid', 'jacket', 'shoes', 'accessory'];

type Buckets = Record<ClothingCategory, Clothing[]>;
type Indices = Record<ClothingCategory, number>;

function emptyBuckets(): Buckets {
  return { top: [], mid: [], bottom: [], shoes: [], jacket: [], accessory: [] };
}

function indicesForIds(buckets: Buckets, ids: string[]): Indices {
  const indices = { ...INITIAL_INDICES };
  for (const category of OUTFIT_ORDER) {
    const position = buckets[category].findIndex((piece) => ids.includes(piece.id));
    indices[category] = position >= 0 ? position : OPTIONAL.includes(category) ? -1 : 0;
  }
  return indices;
}

const INITIAL_INDICES: Indices = { top: 0, mid: -1, bottom: 0, shoes: 0, jacket: -1, accessory: -1 };
const draftKey = (userId: string) => `wardrobe:day-draft:${userId}:${dateKey(new Date())}`;

export default function OutfitDay() {
  const { colors, dark } = useTheme();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const { t, locale } = useLocale();
  const router = useRouter();
  const { state } = useWeather();
  const weather = state.status === 'ready' ? state.weather : null;
  const todayForecast =
    state.status === 'ready' ? state.forecast.find((day) => day.date === dateKey(new Date())) ?? null : null;

  const [buckets, setBuckets] = useState<Buckets>(emptyBuckets());
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState<Indices>(INITIAL_INDICES);
  // Accessories are the one slot you can wear several of (cap + glasses).
  const [accessoryIds, setAccessoryIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [savedOutfitId, setSavedOutfitId] = useState<string | null>(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [occasion, setOccasion] = useState<Occasion>('daily');
  // Nothing is shown until the user asks for a look (or one was saved today).
  const [composed, setComposed] = useState(false);
  const [styling, setStyling] = useState(false);
  const [styleMsg, setStyleMsg] = useState<string | null>(null);
  const [styled, setStyled] = useState(false);
  const [rationale, setRationale] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<Clothing[]>([]);
  /** Non-null once today's look is validated: the studio becomes read-only. */
  const [locked, setLocked] = useState<Clothing[] | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setDraftReady(false);
    setLoading(true);
    try {
      const items = await fetchClothes(userId);
      const next = emptyBuckets();
      // Dirty laundry is not wearable today.
      for (const item of items) if (item.category && !item.dirty) next[item.category].push(item);
      setBuckets(next);
      setIdx(INITIAL_INDICES);
      setAccessoryIds([]);
      setSaved(false);
      setSavedOutfitId(null);
      setRationale(null);

      // A look validated today locks the studio until the user changes it.
      try {
        const worn = await fetchTodaysWornOutfit(userId);
        if (worn) {
          const byId = new Map(items.map((piece) => [piece.id, piece]));
          const pieces = worn.clothes_ids
            .map((pieceId) => byId.get(pieceId))
            .filter((piece): piece is Clothing => Boolean(piece));
          setLocked(pieces.length > 0 ? pieces : null);
          setSavedOutfitId(worn.id);
        } else {
          setLocked(null);
          let restored = false;
          try {
            const raw = await AsyncStorage.getItem(draftKey(userId));
            if (raw) {
              const draft = JSON.parse(raw) as { ids: string[]; rationale?: string | null };
              if (validLook(draft.ids, items)) {
                setIdx(indicesForIds(next, draft.ids));
                setAccessoryIds(
                  next.accessory.filter((piece) => draft.ids.includes(piece.id)).map((piece) => piece.id)
                );
                setRationale(draft.rationale ?? null);
                setComposed(true);
                setStyled(Boolean(draft.rationale));
                restored = true;
              }
            }
          } catch { /* A corrupt local draft must not block the studio. */ }
          if (!restored) {
            const [planned] = await fetchWeeklyOutfits(userId, [dateKey(new Date())]);
            if (planned && validLook(planned.clothes_ids, items)) {
              setIdx(indicesForIds(next, planned.clothes_ids));
              setComposed(true);
              setAccessoryIds(
                next.accessory.filter((piece) => planned.clothes_ids.includes(piece.id)).map((piece) => piece.id)
              );
              setRationale(planned.rationale);
            }
          }
        }
      } catch {
        setLocked(null);
      }
    } finally {
      setLoading(false);
      setDraftReady(true);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hasRequired = REQUIRED.every((category) => buckets[category].length > 0);

  const accessories = useMemo(
    () =>
      locked
        ? locked.filter((piece) => piece.category === 'accessory')
        : buckets.accessory.filter((piece) => accessoryIds.includes(piece.id)),
    [buckets.accessory, accessoryIds, locked]
  );

  const current = useCallback((category: ClothingCategory): Clothing | null => {
    if (category === 'accessory') return accessories[0] ?? null;
    if (locked) return locked.find((piece) => piece.category === category) ?? null;
    if (OPTIONAL.includes(category) && idx[category] < 0) return null;
    return buckets[category][idx[category]] ?? null;
  }, [accessories, buckets, idx, locked]);

  function toggleAccessory(item: Clothing) {
    resetSavedState();
    setComposed(true);
    setRationale(null);
    setAccessoryIds((previous) =>
      previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id]
    );
  }

  const selectedIds = useCallback(
    () => [
      ...OUTFIT_ORDER.filter((category) => category !== 'accessory')
        .map((category) => current(category)?.id)
        .filter((id): id is string => Boolean(id)),
      ...accessories.map((piece) => piece.id),
    ],
    [accessories, current]
  );

  useEffect(() => {
    if (!draftReady || !userId || locked || !hasRequired) return;
    const ids = selectedIds();
    if (!validLook(ids, Object.values(buckets).flat())) return;
    void AsyncStorage.setItem(draftKey(userId), JSON.stringify({ ids, rationale }));
  }, [draftReady, userId, locked, hasRequired, idx, accessoryIds, buckets, rationale, selectedIds]);

  function resetSavedState() {
    setSaved(false);
    setSavedOutfitId(null);
  }

  function cycle(category: ClothingCategory, direction: 1 | -1) {
    resetSavedState();
    setComposed(true);
    setRationale(null);
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
    setComposed(true);
    setRationale(null);
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
      mid: pick('mid', true),
      jacket: pick('jacket', true),
    }));
    // None most of the time, one usually, two once in a while.
    const pool = [...buckets.accessory].sort(() => Math.random() - 0.5);
    const howMany = Math.random() < 0.35 ? 0 : Math.random() < 0.8 ? 1 : 2;
    setAccessoryIds(pool.slice(0, Math.min(howMany, pool.length)).map((piece) => piece.id));
  }

  /** Points each slot at the garments the stylist picked. */
  function applyOutfitIds(ids: string[]) {
    setComposed(true);
    setIdx((previous) => {
      const next: Indices = { ...previous, mid: -1, jacket: -1 };
      const wearable: ClothingCategory[] = OUTFIT_ORDER;
      for (const id of ids) {
        for (const category of wearable) {
          const position = buckets[category].findIndex((piece) => piece.id === id);
          if (position >= 0) next[category] = position;
        }
      }
      return next;
    });
    setAccessoryIds(buckets.accessory.filter((piece) => ids.includes(piece.id)).map((piece) => piece.id));
  }

  /** Ask the AI stylist for a weather-aware look. */
  async function styleMe() {
    resetSavedState();
    setStyleMsg(null);
    setStyling(true);
    try {
      const w = weather
        ? {
            temp: weather.temp,
            condition: weather.condition,
            // The day's range: a cold morning shouldn't mean a coat all afternoon.
            min: todayForecast ? Math.min(todayForecast.min, weather.temp) : weather.temp,
            max: todayForecast ? Math.max(todayForecast.max, weather.temp) : weather.temp,
          }
        : null;
      const { outfits, error } = await generateOutfits(w, occasion);
      if (error === 'not_enough_items') {
        setStyleMsg(t('today.tooFewBody'));
      } else if (error === 'empty' || error === 'no_valid_outfit') {
        setStyleMsg(t('today.noOutfitBody'));
      } else if (error) {
        setStyleMsg(error);
      } else if (outfits.length > 0) {
        const selected = outfits.find((outfit) => validLook(outfit.clothes_ids, Object.values(buckets).flat()));
        if (!selected) {
          setStyleMsg(t('today.noOutfitBody'));
          return;
        }
        applyOutfitIds(selected.clothes_ids);
        setRationale(selected.rationale);
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
    const worn = [
      ...OUTFIT_ORDER.filter((category) => category !== 'accessory')
        .map((category) => current(category))
        .filter((piece): piece is Clothing => Boolean(piece)),
      ...accessories,
    ];

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
    if (session?.user) void AsyncStorage.removeItem(draftKey(session.user.id));
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
    mid: buckets.mid.length,
    accessory: buckets.accessory.length,
  };
  const tryOnItems = [
    ...TRYON_CATEGORIES.filter((category) => category !== 'accessory')
      .map((category) => current(category))
      .filter((piece): piece is Clothing => Boolean(piece)),
    ...accessories,
  ];
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

          {composed || locked ? (
          <OutfitStudio
            current={current}
            counts={counts}
            locked={!!locked}
            accessories={buckets.accessory}
            selectedAccessories={accessories}
            onToggleAccessory={toggleAccessory}
            onPrevious={(category) => cycle(category, -1)}
            onNext={(category) => cycle(category, 1)}
          />
          ) : (
            <StartCard />
          )}

          {rationale && !locked ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md,
              borderRadius: radius.md, backgroundColor: colors.surface }}>
              <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[typography.eyebrow, { color: colors.accent }]}>
                  {locale === 'fr' ? 'POURQUOI CE LOOK' : 'WHY THIS LOOK'}
                </Text>
                <Text style={[typography.small, { color: colors.text }]}>{rationale}</Text>
              </View>
            </View>
          ) : null}

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
            <OccasionPicker value={occasion} onChange={setOccasion} />

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

/** What the look is for: sets the tone the stylist should aim at. */
function OccasionPicker({ value, onChange }: { value: Occasion; onChange: (next: Occasion) => void }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const options: { key: Occasion; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'daily', icon: 'sunny-outline' },
    { key: 'work', icon: 'briefcase-outline' },
    { key: 'party', icon: 'wine-outline' },
    { key: 'sport', icon: 'walk-outline' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {options.map((option) => {
        const on = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 42,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: on ? colors.primary : colors.border,
              backgroundColor: on ? colors.primary : pressed ? colors.surfaceAlt : colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            })}
          >
            <Ionicons name={option.icon} size={14} color={on ? colors.primaryText : colors.textMuted} />
            <Text style={[typography.caption, { color: on ? colors.primaryText : colors.textMuted }]}>
              {t(`occasion.${option.key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Before anything is generated: the companion waiting, not a random outfit. */
function StartCard() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { kind } = useCompanion();
  return (
    <View
      style={{
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      {kind ? <CompanionAvatar kind={kind} size={140} /> : null}
      <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>{t('outfitDay.startTitle')}</Text>
      <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>
        {t('outfitDay.startBody')}
      </Text>
    </View>
  );
}
