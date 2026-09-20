import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { CATEGORIES, categoryKey } from '@/constants/categories';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import {
  deleteClothing,
  fetchClothes,
  removeBackground,
  renameClothing,
  setClothingFavorite,
} from '@/lib/clothes';
import type { Clothing, ClothingCategory } from '@/lib/types';

type Filter = ClothingCategory | 'all' | 'fav';

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
  const [filter, setFilter] = useState<Filter>('all');
  const [renaming, setRenaming] = useState<Clothing | null>(null);
  const [nameDraft, setNameDraft] = useState('');

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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onDetour(item: Clothing) {
    setSelectedId(null);
    setMsg(null);
    setBusyId(item.id);
    const res = await removeBackground(item.id);
    setBusyId(null);
    if (res.error) setMsg(res.error);
    else load();
  }

  async function onToggleFavorite(item: Clothing) {
    setSelectedId(null);
    const next = !item.favorite;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, favorite: next } : i)));
    try {
      await setClothingFavorite(item.id, next);
    } catch {
      load();
    }
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

  function openRename(item: Clothing) {
    setSelectedId(null);
    setNameDraft(item.name ?? '');
    setRenaming(item);
  }

  async function saveRename() {
    if (!renaming) return;
    const target = renaming;
    const value = nameDraft;
    setRenaming(null);
    setItems((prev) =>
      prev.map((i) => (i.id === target.id ? { ...i, name: value.trim() || null } : i))
    );
    try {
      await renameClothing(target.id, value);
    } catch {
      load();
    }
  }

  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => items.some((i) => i.category === c.key)),
    [items]
  );
  const hasFavorites = items.some((i) => i.favorite);

  const shown =
    filter === 'all'
      ? items
      : filter === 'fav'
        ? items.filter((i) => i.favorite)
        : items.filter((i) => i.category === filter);

  // Keep the FAB clear of the floating tab bar.
  const fabBottom = (insets.bottom > 0 ? insets.bottom : 14) + 62 + 16;

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
            paddingBottom: fabBottom + 70,
            gap: spacing.md,
          }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm, gap: 4 }}>
              <Text style={[typography.eyebrow, { color: colors.accent }]}>
                YOUR ARCHIVE / {String(items.length).padStart(2, '0')}
              </Text>
              <Text style={[typography.h1, { color: colors.text }]}>{t('wardrobe.title')}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {t('wardrobe.count', { count: items.length })}
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
                {usedCategories.map((c) => (
                  <Chip
                    key={c.key}
                    label={t(`category.${c.key}`)}
                    active={filter === c.key}
                    onPress={() => setFilter(c.key)}
                  />
                ))}
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => (
            <ClothingCard
              item={item}
              busy={busyId === item.id}
              selected={selectedId === item.id}
              onLongPress={() => setSelectedId(item.id)}
              onDismiss={() => setSelectedId(null)}
              onDetour={() => onDetour(item)}
              onDelete={() => onDelete(item)}
              onRename={() => openRename(item)}
              onToggleFavorite={() => onToggleFavorite(item)}
            />
          )}
        />
      )}

      {/* Add button */}
      <Pressable
        onPress={() => router.push('/add-item')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: spacing.screen,
          bottom: fabBottom,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.floating(dark),
        })}
      >
        <Ionicons name="add" size={30} color={colors.primaryText} />
      </Pressable>

      {/* Rename dialog */}
      <Modal visible={!!renaming} transparent animationType="fade" onRequestClose={() => setRenaming(null)}>
        <Pressable
          onPress={() => setRenaming(null)}
          style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <Text style={[typography.h3, { color: colors.text }]}>{t('wardrobe.rename')}</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder={t('wardrobe.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoFocus
              style={[
                typography.body,
                {
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 12,
                  color: colors.text,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={() => setRenaming(null)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center' }}
              >
                <Text style={[typography.button, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={saveRename}
                style={{ flex: 1, paddingVertical: 13, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center' }}
              >
                <Text style={[typography.button, { color: colors.accentText }]}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

function ClothingCard({
  item,
  onLongPress,
  onDismiss,
  onDetour,
  onDelete,
  onRename,
  onToggleFavorite,
  busy,
  selected,
}: {
  item: Clothing;
  onLongPress: () => void;
  onDismiss: () => void;
  onDetour: () => void;
  onDelete: () => void;
  onRename: () => void;
  onToggleFavorite: () => void;
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
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
      }}
    >
      <View style={{ backgroundColor: '#EFEEE9', padding: spacing.sm }}>
        <Image
          source={{ uri }}
          style={{ width: '100%', aspectRatio: 1 }}
          contentFit="contain"
          transition={180}
          cachePolicy="memory-disk"
        />

        {item.favorite && !selected ? (
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

        {busy ? (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.65)',
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
              gap: 7,
              padding: 6,
              backgroundColor: 'rgba(20,17,13,0.8)',
            }}
          >
            <MenuButton icon="pencil" label={t('wardrobe.rename')} onPress={onRename} />
            <MenuButton
              icon={item.favorite ? 'heart-dislike' : 'heart'}
              label={item.favorite ? t('wardrobe.unfavorite') : t('wardrobe.favorite')}
              onPress={onToggleFavorite}
            />
            <MenuButton icon="cut-outline" label={t('wardrobe.removeBg')} onPress={onDetour} />
            <MenuButton icon="trash-outline" label={t('common.delete')} onPress={onDelete} danger />
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

function MenuButton({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 11,
        borderRadius: radius.full,
        backgroundColor: danger ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
      }}
    >
      <Ionicons name={icon} size={13} color="#FFFFFF" />
      <Text style={[typography.caption, { color: '#FFFFFF', fontSize: 10 }]}>{label}</Text>
    </Pressable>
  );
}
