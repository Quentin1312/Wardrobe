import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { WashCycle } from '@/components/WashCycle';
import { CATEGORIES, categoryKey } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { cleanMissingBackgrounds, fetchClothes, washAll } from '@/lib/clothes';
import type { Clothing, ClothingCategory } from '@/lib/types';

type Filter = ClothingCategory | 'all' | 'fav' | 'dirty';

export default function Wardrobe() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const userId = session?.user?.id;

  const [items, setItems] = useState<Clothing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [washing, setWashing] = useState(false);
  const [laundryError, setLaundryError] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanProgress, setCleanProgress] = useState({ done: 0, total: 0 });
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setItems(await fetchClothes(userId));
    } catch {
      // empty state covers it
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => items.some((i) => i.category === c.key)),
    [items]
  );
  const hasFavorites = items.some((i) => i.favorite);
  const dirtyCount = items.filter((i) => i.dirty).length;
  const pendingCleanCount = items.filter((i) => !i.photo_clean_url).length;

  const shown =
    filter === 'all'
      ? items
      : filter === 'fav'
        ? items.filter((i) => i.favorite)
        : filter === 'dirty'
          ? items.filter((i) => i.dirty)
          : items.filter((i) => i.category === filter);

  function onWashAll() {
    if (!userId || dirtyCount === 0) return;
    setLaundryError(null);
    setWashing(true);
  }

  const performWash = useCallback(async () => {
    if (!userId) throw new Error('missing_user');
    await washAll(userId);
  }, [userId]);

  const finishWash = useCallback(() => {
    setWashing(false);
    setFilter('all');
    load();
  }, [load]);

  const failWash = useCallback(() => {
    setWashing(false);
    setLaundryError(t('laundry.failed'));
    load();
  }, [load, t]);

  async function onCleanLegacy() {
    if (cleaning || pendingCleanCount === 0) return;
    setCleaning(true);
    setCleanMessage(null);
    setCleanProgress({ done: 0, total: pendingCleanCount });
    try {
      const result = await cleanMissingBackgrounds(items, (done, total) => {
        setCleanProgress({ done, total });
      });
      setCleanMessage(
        result.failed > 0
          ? t('wardrobe.cleanLegacyPartial', { cleaned: result.cleaned, failed: result.failed })
          : t('wardrobe.cleanLegacyDone', { count: result.cleaned })
      );
      await load();
    } finally {
      setCleaning(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="shirt-outline"
          title={t('wardrobe.emptyTitle')}
          subtitle={t('wardrobe.emptyBody')}
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(i) => i.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.screen }}
          contentContainerStyle={{
            width: '100%',
            maxWidth: 760,
            alignSelf: 'center',
            paddingBottom: 132,
            gap: spacing.md,
          }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[typography.eyebrow, { color: colors.accent }]}>
                    YOUR ARCHIVE / {String(items.length).padStart(2, '0')}
                  </Text>
                  <Text style={[typography.h1, { color: colors.text }]}>{t('wardrobe.title')}</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>
                    {t('wardrobe.count', { count: items.length })}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('add.title')}
                  onPress={() => router.push('/add-item')}
                  style={({ pressed }) => ({
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: pressed ? colors.accentSoft : colors.energy,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}
                >
                  <Ionicons name="add" size={27} color={colors.energyText} />
                </Pressable>
              </View>

              {pendingCleanCount > 0 || cleaning || cleanMessage ? (
                <Pressable
                  disabled={cleaning || pendingCleanCount === 0}
                  onPress={onCleanLegacy}
                  style={({ pressed }) => ({
                    marginTop: spacing.md,
                    minHeight: 48,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                    paddingHorizontal: spacing.md,
                  })}
                >
                  {cleaning ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons
                      name={pendingCleanCount > 0 ? 'sparkles-outline' : 'checkmark-circle'}
                      size={18}
                      color={pendingCleanCount > 0 ? colors.accent : colors.success}
                    />
                  )}
                  <Text style={[typography.bodyStrong, { color: colors.text, textAlign: 'center' }]}>
                    {cleaning
                      ? t('wardrobe.cleaningLegacy', cleanProgress)
                      : cleanMessage ?? t('wardrobe.cleanLegacy', { count: pendingCleanCount })}
                  </Text>
                </Pressable>
              ) : null}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: spacing.md, marginHorizontal: -spacing.screen }}
                contentContainerStyle={{ paddingHorizontal: spacing.screen, gap: spacing.sm }}
              >
                <Chip label={t('wardrobe.all')} active={filter === 'all'} onPress={() => setFilter('all')} />
                {hasFavorites ? (
                  <Chip
                    label={t('wardrobe.favorites')}
                    icon="heart"
                    active={filter === 'fav'}
                    onPress={() => setFilter('fav')}
                  />
                ) : null}
                {dirtyCount > 0 ? (
                  <Chip
                    label={`${t('laundry.dirty')} · ${dirtyCount}`}
                    icon="water-outline"
                    active={filter === 'dirty'}
                    onPress={() => setFilter('dirty')}
                  />
                ) : null}
                {usedCategories.map((c) => (
                  <Chip
                    key={c.key}
                    label={t(`category.${c.key}`)}
                    active={filter === c.key}
                    onPress={() => setFilter(c.key)}
                  />
                ))}
              </ScrollView>

              {dirtyCount > 0 ? (
                <Pressable
                  onPress={onWashAll}
                  style={({ pressed }) => ({
                    marginTop: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                    paddingVertical: 14,
                    borderRadius: radius.full,
                    backgroundColor: pressed ? colors.accentSoft : colors.energy,
                  })}
                >
                  <Ionicons name="water" size={18} color={colors.energyText} />
                  <Text style={[typography.button, { color: colors.energyText }]}>
                    {t('laundry.washAll')}
                  </Text>
                </Pressable>
              ) : null}

              {laundryError ? (
                <Pressable
                  onPress={() => setLaundryError(null)}
                  style={{
                    marginTop: spacing.sm,
                    flexDirection: 'row',
                    gap: spacing.sm,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.danger,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
                  <Text style={[typography.small, { color: colors.text, flex: 1 }]}>
                    {laundryError}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ClothingCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
          )}
        />
      )}

      <WashCycle
        visible={washing}
        onWash={performWash}
        onDone={finishWash}
        onError={failWash}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 9,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : colors.surface,
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={13} color={active ? colors.primaryText : colors.textMuted} />
      ) : null}
      <Text style={[typography.caption, { color: active ? colors.primaryText : colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ClothingCard({ item, onPress }: { item: Clothing; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const uri = item.photo_clean_url ?? item.photo_url;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ backgroundColor: '#EFEEE9', padding: spacing.sm }}>
        <Image
          source={{ uri }}
          style={{ width: '100%', aspectRatio: 1, opacity: item.dirty ? 0.45 : 1 }}
          contentFit="contain"
          transition={180}
          cachePolicy="memory-disk"
        />
        {item.dirty ? (
          <View
            style={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: radius.full,
              backgroundColor: 'rgba(21,21,23,0.85)',
            }}
          >
            <Ionicons name="water" size={11} color="#9BB7E8" />
            <Text style={[typography.caption, { color: '#FFFFFF', fontSize: 9 }]}>
              {t('laundry.badge')}
            </Text>
          </View>
        ) : null}
        {item.favorite ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: 'rgba(21,21,23,0.85)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="heart" size={14} color={colors.energy} />
          </View>
        ) : null}
      </View>

      <View style={{ minHeight: 52, paddingHorizontal: 11, paddingVertical: 9, gap: 2 }}>
        <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text }]}>
          {item.name ?? t(categoryKey(item.category))}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted }]}>
          {t(categoryKey(item.category))}
        </Text>
      </View>
    </Pressable>
  );
}
