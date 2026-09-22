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
import { GarmentStylingFields } from '@/components/GarmentStylingFields';
import { StudioSheet } from '@/components/StudioSheet';
import { CATEGORIES, categoryKey } from '@/constants/categories';
import { extractGarmentPalette } from '@/lib/color';
import { colorsFromHexes, primaryColorHex, readGarmentMeta, writeGarmentMeta, type GarmentColor } from '@/lib/garmentMeta';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import {
  analyzeClothing,
  deleteClothing,
  fetchClothing,
  removeBackground,
  renameClothing,
  setClothingDirty,
  setClothingFavorite,
  updateClothingStyling,
} from '@/lib/clothes';
import type { Clothing, ClothingCategory } from '@/lib/types';
import { optimizeLegacyCleanPhotos } from '@/lib/images';
import { daysSince, fetchWearStats, wornLabel, type WearStat } from '@/lib/wear';

export default function ItemSheet() {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<Clothing | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory | null>(null);
  const [garmentColors, setGarmentColors] = useState<GarmentColor[]>([]);
  const [description, setDescription] = useState('');
  const [stylingBusy, setStylingBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [showBasket, setShowBasket] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [wear, setWear] = useState<WearStat | undefined>(undefined);
  const [wearLoaded, setWearLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const found = await fetchClothing(id);
      setItem(found);
      setName(found?.name ?? '');
      setCategory(found?.category ?? null);
      const meta = found ? readGarmentMeta(found) : { colors: [] as GarmentColor[], description: '' };
      setGarmentColors(meta.colors);
      setDescription(meta.description);
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

  async function onSaveStyling() {
    if (!item) return;
    setStylingBusy(true);
    setMsg(null);
    const values = { name: name.trim() || null, category, dominant_color: primaryColorHex(garmentColors),
      style_tags: writeGarmentMeta(item.style_tags, garmentColors, description) };
    try {
      await updateClothingStyling(item.id, values);
      setItem({ ...item, ...values });
      setMsg(locale === 'fr' ? 'Informations transmises au styliste.' : 'Details saved for the stylist.');
    } catch (e: any) {
      setMsg(e?.message ?? t('common.error'));
    } finally {
      setStylingBusy(false);
    }
  }

  async function onAnalyzePhoto() {
    if (!item) return;
    setStylingBusy(true);
    setMsg(null);
    try {
      const { suggestion, error } = await analyzeClothing(item.id, locale);
      if (error || !suggestion) {
        setMsg(error === 'not_clothing'
          ? (locale === 'fr' ? 'La photo ne semble pas montrer un vêtement. Vérifie-la.' : 'This photo does not appear to show clothing.')
          : error ?? t('common.error'));
        return;
      }
      setCategory(suggestion.category);
      setGarmentColors(suggestion.colors);
      setDescription(suggestion.description);
      if (suggestion.name) setName(suggestion.name);
      setMsg(locale === 'fr'
        ? 'Proposition IA prête : vérifie la fiche puis appuie sur Enregistrer.'
        : 'AI suggestion ready: review it, then tap Save.');
    } catch (e: any) {
      setMsg(e?.message ?? t('common.error'));
    } finally {
      setStylingBusy(false);
    }
  }

  async function onReanalyse() {
    if (!item) return;
    setStylingBusy(true);
    const palette = await extractGarmentPalette(item.photo_url, item.id);
    setGarmentColors(colorsFromHexes(palette));
    setStylingBusy(false);
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
    if (res.url) {
      await optimizeLegacyCleanPhotos([{ ...item, photo_clean_url: res.url }]);
    }
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
            recyclingKey={item.id}
            priority="high"
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
          {garmentColors.length ? (
            <Row
              label={t('item.color')}
              value={garmentColors.join(' + ')}
              swatch={primaryColorHex(garmentColors) ?? undefined}
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

        <View style={{ gap: spacing.md }}>
          <Text style={[typography.h3, { color: colors.text }]}>
            {locale === 'fr' ? 'Fiche styliste' : 'Stylist details'}
          </Text>
          <Pressable disabled={stylingBusy} onPress={onAnalyzePhoto}
            style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: spacing.sm, borderRadius: radius.full,
              backgroundColor: colors.energy }}>
            {stylingBusy ? <ActivityIndicator color={colors.energyText} /> :
              <Ionicons name="sparkles-outline" size={19} color={colors.energyText} />}
            <Text style={[typography.button, { color: colors.energyText }]}>
              {locale === 'fr' ? 'Analyser cette photo avec l’IA' : 'Analyse this photo with AI'}
            </Text>
          </Pressable>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {locale === 'fr'
              ? 'En appuyant, cette photo est envoyée à OpenAI. Nom, catégorie, couleurs et détails sont proposés, jamais enregistrés sans ta validation.'
              : 'Tapping sends this photo to OpenAI. Name, category, colours and details are suggested, never saved without your confirmation.'}
          </Text>
          <Text style={[typography.eyebrow, { color: colors.textMuted }]}>{t('item.category')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {CATEGORIES.map((choice) => (
              <Pressable key={choice.key} onPress={() => setCategory(choice.key)}
                style={{ paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: radius.full,
                  borderWidth: 1, borderColor: category === choice.key ? colors.accent : colors.border,
                  backgroundColor: category === choice.key ? colors.accentSoft : colors.surface }}>
                <Text style={[typography.caption, { color: colors.text }]}>{t(`category.${choice.key}`)}</Text>
              </Pressable>
            ))}
          </View>
          <GarmentStylingFields colors={garmentColors} onColors={setGarmentColors}
            description={description} onDescription={setDescription} />
          <Pressable disabled={stylingBusy} onPress={onReanalyse}
            style={{ paddingVertical: 10, alignItems: 'center' }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {locale === 'fr' ? 'Réanalyser les couleurs de la photo' : 'Reanalyse photo colours'}
            </Text>
          </Pressable>
          <Pressable disabled={stylingBusy} onPress={onSaveStyling}
            style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center',
              borderRadius: radius.full, backgroundColor: colors.accent }}>
            {stylingBusy ? <ActivityIndicator color={colors.accentText} /> :
              <Text style={[typography.button, { color: colors.accentText }]}>{t('common.save')}</Text>}
          </Pressable>
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
          <ActionRow icon="color-wand-outline" label={t('studio.action')} onPress={() => setShowStudio(true)} />
          <ActionRow icon="trash-outline" label={t('common.delete')} onPress={onDelete} danger />
        </View>
      </ScrollView>

      <StudioSheet
        visible={showStudio}
        item={item}
        onClose={() => setShowStudio(false)}
        onKept={(url) => setItem({ ...item, photo_clean_url: url })}
      />

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
