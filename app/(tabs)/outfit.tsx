import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { categoryKey } from '@/constants/categories';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useWeather } from '@/hooks/useWeather';
import { fetchClothes } from '@/lib/clothes';
import { saveWornOutfit } from '@/lib/outfits';
import { weatherContext } from '@/lib/weather';
import type { Clothing, ClothingCategory } from '@/lib/types';

// Slots shown top-to-bottom like a figure. Jacket is optional.
const REQUIRED: ClothingCategory[] = ['top', 'bottom', 'shoes'];

type Buckets = Record<ClothingCategory, Clothing[]>;

function emptyBuckets(): Buckets {
  return { top: [], bottom: [], shoes: [], jacket: [], accessory: [] };
}

export default function OutfitDay() {
  const { colors, dark } = useTheme();
  const { session } = useAuth();
  const { t } = useLocale();
  const { state } = useWeather();
  const weather = state.status === 'ready' ? state.weather : null;

  const [buckets, setBuckets] = useState<Buckets>(emptyBuckets());
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState<Record<ClothingCategory, number>>({
    top: 0, bottom: 0, shoes: 0, jacket: -1, accessory: 0,
  });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    try {
      const items = await fetchClothes(session.user.id);
      const b = emptyBuckets();
      for (const it of items) if (it.category) b[it.category].push(it);
      setBuckets(b);
      // Jacket starts on "none" (-1) if available, else -1.
      setIdx({ top: 0, bottom: 0, shoes: 0, jacket: -1, accessory: 0 });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hasRequired = REQUIRED.every((c) => buckets[c].length > 0);

  function cycle(cat: ClothingCategory, dir: 1 | -1) {
    setSaved(false);
    setIdx((prev) => {
      const list = buckets[cat];
      if (list.length === 0) return prev;
      const optional = cat === 'jacket';
      // Optional slot cycles through -1 (none) .. length-1
      const min = optional ? -1 : 0;
      const span = list.length - min; // number of states
      let next = prev[cat] + dir;
      if (next < min) next = min + ((next - min) % span + span) % span;
      next = ((next - min) % span + span) % span + min;
      return { ...prev, [cat]: next };
    });
  }

  function shuffle() {
    setSaved(false);
    setIdx((prev) => {
      const pick = (cat: ClothingCategory, optional = false) => {
        const n = buckets[cat].length;
        if (n === 0) return optional ? -1 : 0;
        return Math.floor(Math.random() * n);
      };
      return {
        ...prev,
        top: pick('top'),
        bottom: pick('bottom'),
        shoes: pick('shoes'),
        jacket: buckets.jacket.length ? pick('jacket') : -1,
      };
    });
  }

  async function validate() {
    if (!session?.user) return;
    const ids = [
      idx.jacket >= 0 ? buckets.jacket[idx.jacket]?.id : null,
      buckets.top[idx.top]?.id,
      buckets.bottom[idx.bottom]?.id,
      buckets.shoes[idx.shoes]?.id,
    ].filter((x): x is string => !!x);
    if (ids.length < 2) return;
    setSaved(true);
    try {
      await saveWornOutfit({
        userId: session.user.id,
        clothesIds: ids,
        weatherContext: weather ? weatherContext(weather) : null,
        liked: true,
      });
    } catch {
      // keep the celebratory state; sync can be retried later
    }
  }

  const current = (cat: ClothingCategory): Clothing | null => {
    if (cat === 'jacket' && idx.jacket < 0) return null;
    return buckets[cat][idx[cat]] ?? null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm }}>
        <Text style={[typography.h1, { color: colors.text }]}>{t('outfitDay.title')}</Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          {weather ? `${weather.temp}° · ${weather.condition}` : t('outfitDay.subtitle')}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !hasRequired ? (
        <EmptyState
          icon="shirt-outline"
          title={t('outfitDay.needMoreTitle')}
          subtitle={t('outfitDay.needMoreBody')}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.md, gap: spacing.sm, alignItems: 'center' }}
          >
            {buckets.jacket.length > 0 ? (
              <Slot
                item={current('jacket')}
                label={idx.jacket < 0 ? t('outfitDay.none') : t('category.jacket')}
                onPrev={() => cycle('jacket', -1)}
                onNext={() => cycle('jacket', 1)}
              />
            ) : null}
            <Slot item={current('top')} label={t('category.top')} onPrev={() => cycle('top', -1)} onNext={() => cycle('top', 1)} single={buckets.top.length < 2} />
            <Slot item={current('bottom')} label={t('category.bottom')} onPrev={() => cycle('bottom', -1)} onNext={() => cycle('bottom', 1)} single={buckets.bottom.length < 2} />
            <Slot item={current('shoes')} label={t('category.shoes')} onPrev={() => cycle('shoes', -1)} onNext={() => cycle('shoes', 1)} single={buckets.shoes.length < 2} shoes />

            {saved ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[typography.bodyStrong, { color: colors.success }]}>
                  {t('outfitDay.validated')}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.screen }}>
            <Pressable
              onPress={shuffle}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing.xs,
                paddingVertical: 16,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
              })}
            >
              <Ionicons name="shuffle" size={18} color={colors.text} />
              <Text style={[typography.button, { color: colors.text }]}>{t('outfitDay.skip')}</Text>
            </Pressable>
            <Pressable
              onPress={validate}
              style={({ pressed }) => ({
                flex: 1.4,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing.xs,
                paddingVertical: 16,
                borderRadius: radius.full,
                backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                ...shadows.floating(dark),
              })}
            >
              <Ionicons name="checkmark" size={20} color={colors.primaryText} />
              <Text style={[typography.button, { color: colors.primaryText }]}>
                {t('outfitDay.validate')}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function Slot({
  item,
  label,
  onPrev,
  onNext,
  single,
  shoes,
}: {
  item: Clothing | null;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  single?: boolean;
  shoes?: boolean;
}) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Animate on item change.
  useEffect(() => {
    fade.setValue(0.35);
    scale.setValue(0.96);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [item?.id]);

  const size = shoes ? 120 : 150;

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Arrow icon="chevron-back" onPress={onPrev} disabled={single} />
        <Animated.View
          style={{
            width: size + 60,
            height: size,
            borderRadius: radius.lg,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: fade,
            transform: [{ scale }],
          }}
        >
          {item ? (
            <Animated.Image
              source={{ uri: item.photo_clean_url ?? item.photo_url }}
              style={{ width: '100%', height: '100%', padding: spacing.sm }}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="remove-outline" size={28} color={colors.textMuted} />
          )}
        </Animated.View>
        <Arrow icon="chevron-forward" onPress={onNext} disabled={single} />
      </View>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function Arrow({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}
