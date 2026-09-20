import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
import { LaundryDrop } from '@/components/LaundryDrop';
import { fetchClothes, markOutfitDirty } from '@/lib/clothes';
import { generateOutfits, saveWornOutfit } from '@/lib/outfits';
import { generateTryOn } from '@/lib/tryon';
import type { Clothing, ClothingCategory } from '@/lib/types';
import { weatherContext } from '@/lib/weather';

const REQUIRED: ClothingCategory[] = ['top', 'bottom', 'shoes'];
const TRYON_CATEGORIES: ClothingCategory[] = ['bottom', 'top', 'jacket'];

type Buckets = Record<ClothingCategory, Clothing[]>;
type Indices = Record<ClothingCategory, number>;

function emptyBuckets(): Buckets {
  return { top: [], bottom: [], shoes: [], jacket: [], accessory: [] };
}

const INITIAL_INDICES: Indices = { top: 0, bottom: 0, shoes: 0, jacket: -1, accessory: 0 };

export default function OutfitDay() {
  const { colors, dark } = useTheme();
  const { session, profile } = useAuth();
  const { t } = useLocale();
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
  const [showBasket, setShowBasket] = useState(false);
  const [basketItems, setBasketItems] = useState<Clothing[]>([]);

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
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hasRequired = REQUIRED.every((category) => buckets[category].length > 0);

  const current = useCallback((category: ClothingCategory): Clothing | null => {
    if (category === 'jacket' && idx.jacket < 0) return null;
    return buckets[category][idx[category]] ?? null;
  }, [buckets, idx]);

  // Jackets are excluded from the look for now.
  const selectedIds = useCallback(() => [
    current('top')?.id,
    current('bottom')?.id,
    current('shoes')?.id,
  ].filter((id): id is string => Boolean(id)), [current]);

  function resetSavedState() {
    setSaved(false);
    setSavedOutfitId(null);
  }

  function cycle(category: ClothingCategory, direction: 1 | -1) {
    resetSavedState();
    setIdx((previous) => {
      const list = buckets[category];
      if (list.length === 0) return previous;
      const minimum = category === 'jacket' ? -1 : 0;
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
      jacket: -1,
    }));
  }

  /** Points each slot at the garments the stylist picked. */
  function applyOutfitIds(ids: string[]) {
    setIdx((previous) => {
      const next: Indices = { ...previous, jacket: -1 };
      const wearable: ClothingCategory[] = ['top', 'bottom', 'shoes'];
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

  async function persistCurrentOutfit() {
    if (!session?.user) throw new Error(t('common.error'));
    if (savedOutfitId) return savedOutfitId;
    const outfit = await saveWornOutfit({
      userId: session.user.id,
      clothesIds: selectedIds(),
      weatherContext: weather ? weatherContext(weather) : null,
      liked: true,
    });
    setSavedOutfitId(outfit.id);
    return outfit.id;
  }

  async function validate() {
    const worn = (['top', 'bottom', 'shoes'] as ClothingCategory[])
      .map((category) => current(category))
      .filter((piece): piece is Clothing => Boolean(piece));

    await persistCurrentOutfit();
    setSaved(true);

    // Worn today → straight into the laundry basket.
    try {
      await markOutfitDirty(worn.map((piece) => piece.id));
    } catch {
      // the look is saved either way
    }
    setBasketItems(worn);
    setShowBasket(true);
  }

  async function runTryOn() {
    const outfitId = await persistCurrentOutfit();
    const result = await generateTryOn(outfitId);
    if (!result.url) throw new Error(result.error ?? t('tryon.error'));
    return result.url;
  }

  const counts = {
    top: buckets.top.length,
    bottom: buckets.bottom.length,
    shoes: buckets.shoes.length,
    jacket: buckets.jacket.length,
    accessory: buckets.accessory.length,
  };
  const tryOnCount = TRYON_CATEGORIES.filter((category) => current(category)).length;
  const profilePhoto = profile?.profile_photo_clean_url ?? profile?.profile_photo_url ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !hasRequired ? (
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
            <Text style={[typography.h1, { color: colors.text }]}>{t('outfitDay.title')}</Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>{t('outfitDay.subtitle')}</Text>
          </View>

          <OutfitStudio
            current={current}
            counts={counts}
            onPrevious={(category) => cycle(category, -1)}
            onNext={(category) => cycle(category, 1)}
          />

          {saved ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="checkmark-circle" size={21} color={colors.success} />
              <Text style={[typography.bodyStrong, { color: colors.success }]}>{t('outfitDay.validated')}</Text>
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
                <Ionicons name="sparkles" size={20} color={colors.energy} />
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
        </ScrollView>
      )}

      <StylistLoader visible={styling} />

      <LaundryDrop
        visible={showBasket}
        items={basketItems}
        onDone={() => {
          setShowBasket(false);
          setBasketItems([]);
          load();
        }}
      />

      <TryOnSheet
        visible={tryOnOpen}
        modelPhoto={profilePhoto}
        garmentCount={tryOnCount}
        onClose={() => setTryOnOpen(false)}
        onGenerate={runTryOn}
      />
    </SafeAreaView>
  );
}
