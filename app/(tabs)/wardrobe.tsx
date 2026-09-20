import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { CATEGORIES, categoryKey } from '@/constants/categories';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { deleteClothing, fetchClothes, removeBackground } from '@/lib/clothes';
import type { Clothing, ClothingCategory } from '@/lib/types';

export default function Wardrobe() {
  const { colors, dark } = useTheme();
  const { session } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Clothing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<ClothingCategory | 'all'>('all');

  const load = useCallback(async () => {
    if (!session?.user) return;
    try {
      setItems(await fetchClothes(session.user.id));
    } catch {
      // empty state covers it
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onDetour(item: Clothing) {
    setSelectedId(null);
    setMsg(null);
    setBusyId(item.id);
    const res = await removeBackground(item.id);
    setBusyId(null);
    if (res.error) setMsg(res.error);
    else load();
  }

  async function onDelete(item: Clothing) {
    setSelectedId(null);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await deleteClothing(item.id);
    } catch {
      load();
    }
  }

  // Categories that actually have items, in canonical order.
  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => items.some((i) => i.category === c.key)),
    [items]
  );
  const shown = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.sm, gap: 4 }}>
        <Text style={[typography.eyebrow, { color: colors.accent }]}>YOUR ARCHIVE / {String(items.length).padStart(2, '0')}</Text>
        <Text style={[typography.h1, { color: colors.text }]}>{t('wardrobe.title')}</Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          {items.length > 0 ? t('wardrobe.count', { count: items.length }) : t('wardrobe.subtitle')}
        </Text>
        {msg ? (
          <Pressable
            onPress={() => setMsg(null)}
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              marginTop: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.accent,
              backgroundColor: colors.accentSoft,
            }}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{msg}</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.md, gap: spacing.sm }}
          style={{ flexGrow: 0 }}
        >
          <FilterChip label={t('wardrobe.all')} active={filter === 'all'} onPress={() => setFilter('all')} />
          {usedCategories.map((c) => (
            <FilterChip
              key={c.key}
              label={t(`category.${c.key}`)}
              active={filter === c.key}
              onPress={() => setFilter(c.key)}
            />
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
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
          style={{ width: '100%', maxWidth: 760, alignSelf: 'center' }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm, paddingBottom: 128 }}
          columnWrapperStyle={{ gap: spacing.md, justifyContent: 'flex-start' }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <ClothingCard
              item={item}
              busy={busyId === item.id}
              selected={selectedId === item.id}
              onLongPress={() => setSelectedId(item.id)}
              onDismiss={() => setSelectedId(null)}
              onDetour={() => onDetour(item)}
              onDelete={() => onDelete(item)}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => router.push('/add-item')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: spacing.screen,
          bottom: 82 + Math.max(insets.bottom, 8),
          width: 60,
          height: 60,
          borderRadius: 22,
          backgroundColor: pressed ? colors.heroAccent : colors.energy,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: pressed ? '4deg' : '-3deg' }],
          ...shadows.floating(dark),
        })}
      >
        <Ionicons name="add" size={30} color={colors.energyText} />
      </Pressable>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexShrink: 0,
        minHeight: 40,
        paddingVertical: 8,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[typography.caption, { color: active ? colors.primaryText : colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ClothingCard({
  item,
  onLongPress,
  onDismiss,
  onDetour,
  onDelete,
  busy,
  selected,
}: {
  item: Clothing;
  onLongPress: () => void;
  onDismiss: () => void;
  onDetour: () => void;
  onDelete: () => void;
  busy?: boolean;
  selected?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const uri = item.photo_clean_url ?? item.photo_url;
  return (
    <Pressable
      onPress={selected ? onDismiss : undefined}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={{
        width: '47.5%',
        flexGrow: 0,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <View style={{ backgroundColor: '#F1F1EC', padding: spacing.sm }}>
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="contain" />
        {busy ? (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.6)',
            }}
          >
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
        {selected && !busy ? (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              padding: spacing.sm,
              backgroundColor: 'rgba(20,17,13,0.72)',
            }}
          >
            <Pressable
              onPress={onDetour}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.primary }}
            >
              <Ionicons name="cut-outline" size={16} color={colors.primaryText} />
              <Text style={[typography.caption, { color: colors.primaryText }]}>{t('wardrobe.removeBg')}</Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: '#FFFFFF55' }}
            >
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
              <Text style={[typography.caption, { color: '#FFFFFF' }]}>{t('common.delete')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View style={{ minHeight: 54, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {item.dominant_color ? (
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: radius.full,
              backgroundColor: item.dominant_color,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        ) : null}
        <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>
          {t(categoryKey(item.category))}
        </Text>
      </View>
    </Pressable>
  );
}
