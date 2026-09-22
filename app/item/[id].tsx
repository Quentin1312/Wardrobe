import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LaundryDrop } from '@/components/LaundryDrop';
import { categoryKey } from '@/constants/categories';
import { colorName } from '@/lib/color';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import {
  deleteClothing,
  fetchClothing,
  removeBackground,
  renameClothing,
  setClothingDirty,
  setClothingFavorite,
} from '@/lib/clothes';
import type { Clothing } from '@/lib/types';
import { daysSince, fetchWearStats, wornLabel, type WearStat } from '@/lib/wear';

export default function ItemSheet() {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<Clothing | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [showBasket, setShowBasket] = useState(false);
  const [wear, setWear] = useState<WearStat | undefined>(undefined);
  const [wearLoaded, setWearLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const found = await fetchClothing(id);
      setItem(found);
      setName(found?.name ?? '');
      if (found) {
        fetchWearStats(found.user_id)
          .then((stats) => setWear(stats.get(found.id)))
          .catch(() => {})
          .finally(() => setWearLoaded(true));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function onSaveName() {
    if (!item) return;
    const value = name;
    setItem({ ...item, name: value.trim() || null });
    try {
      await renameClothing(item.id, value);
      // Visible confirmation — otherwise the tap feels like it did nothing.
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1800);
    } catch (e: any) {
      setMsg(e?.message ?? null);
    }
  }

  async function onToggleFavorite() {
    if (!item) return;
    const next = !item.favorite;
    setItem({ ...item, favorite: next });
    try {
      await setClothingFavorite(item.id, next);
    } catch {
      load();
    }
  }

  async function onToggleDirty() {
    if (!item) return;
    const next = !item.dirty;
    setItem({ ...item, dirty: next });
    // Only the "into the basket" direction gets the animation.
    if (next) setShowBasket(true);
    try {
      await setClothingDirty(item.id, next);
    } catch {
      load();
    }
  }

  async function onDetour() {
    if (!item) return;
    setMsg(null);
    setBusy(true);
    const res = await removeBackground(item.id);
    setBusy(false);
    if (res.error) setMsg(res.error);
    else load();
  }

  async function onDelete() {
    if (!item) return;
    try {
      await deleteClothing(item.id);
    } catch {
      // still leave the screen; the list will refetch
    }
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: colors.textMuted }]}>—</Text>
      </SafeAreaView>
    );
  }

  const added = new Date(item.created_at).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.screen,
          paddingVertical: spacing.md,
        }}
      >
        <Text style={[typography.h2, { color: colors.text }]}>{t('item.title')}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 620,
          alignSelf: 'center',
          paddingHorizontal: spacing.screen,
          paddingBottom: 140,
          gap: spacing.lg,
        }}
      >
        {/* Photo */}
        <View
          style={{
            borderRadius: 28,
            backgroundColor: '#EFEEE9',
            padding: spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={{ uri: item.photo_clean_url ?? item.photo_url }}
            style={{ width: '100%', aspectRatio: 1 }}
            contentFit="contain"
            transition={180}
            cachePolicy="memory-disk"
          />
          {busy ? (
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.65)',
                borderRadius: 28,
              }}
            >
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        </View>

        {msg ? (
          <Pressable
            onPress={() => setMsg(null)}
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
            <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{msg}</Text>
          </Pressable>
        ) : null}

        {/* Name */}
        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.eyebrow, { color: colors.textMuted }]}>{t('item.name')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={onSaveName}
              onSubmitEditing={onSaveName}
              placeholder={t('wardrobe.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={[
                typography.body,
                {
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 13,
                  color: colors.text,
                  backgroundColor: colors.surface,
                },
              ]}
            />
            <Pressable
              onPress={onSaveName}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.md,
                backgroundColor: nameSaved ? colors.success : colors.accent,
              }}
            >
              {nameSaved ? <Ionicons name="checkmark" size={17} color={colors.accentText} /> : null}
              <Text style={[typography.button, { color: colors.accentText }]}>
                {nameSaved ? t('common.saved') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Meta */}
        <View style={{ gap: spacing.sm }}>
          <Row label={t('item.category')} value={t(categoryKey(item.category))} />
          {item.dominant_color ? (
            <Row
              label={t('item.color')}
              value={colorName(item.dominant_color, locale) ?? item.dominant_color}
              swatch={item.dominant_color}
            />
          ) : null}
          {wearLoaded ? (
            <>
              <Row
                label={t('item.lastWorn')}
                value={
                  wear && daysSince(wear.last) > 1
                    ? `${wornLabel(wear, t)} · ${new Date(wear.last).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}`
                    : wornLabel(wear, t)
                }
              />
              {wear ? <Row label={t('item.wornCount')} value={t('item.wornTimes', { count: wear.count })} /> : null}
            </>
          ) : null}
          <Row label={t('item.addedOn')} value={added} />
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.sm }}>
          <ActionRow
            icon={item.favorite ? 'heart' : 'heart-outline'}
            label={item.favorite ? t('wardrobe.unfavorite') : t('wardrobe.favorite')}
            onPress={onToggleFavorite}
            tint={item.favorite ? colors.energy : undefined}
          />
          <ActionRow
            icon={item.dirty ? 'checkmark-circle-outline' : 'water-outline'}
            label={item.dirty ? t('laundry.markClean') : t('laundry.markDirty')}
            onPress={onToggleDirty}
          />
          {item.photo_clean_url ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[typography.bodyStrong, { color: colors.success }]}>
                {t('wardrobe.backgroundReady')}
              </Text>
            </View>
          ) : (
            <ActionRow icon="cut-outline" label={t('wardrobe.removeBg')} onPress={onDetour} />
          )}
          <ActionRow icon="trash-outline" label={t('common.delete')} onPress={onDelete} danger />
        </View>
      </ScrollView>

      <LaundryDrop
        visible={showBasket}
        items={item ? [item] : []}
        onDone={() => setShowBasket(false)}
      />
    </SafeAreaView>
  );
}

function Row({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
      }}
    >
      <Text style={[typography.small, { color: colors.textMuted }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {swatch ? (
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: swatch, borderWidth: 1, borderColor: colors.border }} />
        ) : null}
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  tint?: string;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : tint ?? colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      })}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[typography.bodyStrong, { color }]}>{label}</Text>
    </Pressable>
  );
}
