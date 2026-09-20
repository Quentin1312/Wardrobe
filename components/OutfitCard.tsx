import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { categoryKey } from '@/constants/categories';
import { colors, radius, spacing } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import type { Clothing } from '@/lib/types';
import type { SuggestedOutfit } from '@/lib/outfits';

export function OutfitCard({
  outfit,
  clothes,
  onLike,
  onSkip,
}: {
  outfit: SuggestedOutfit;
  clothes: Map<string, Clothing>;
  onLike: () => void;
  onSkip: () => void;
}) {
  const { t } = useLocale();
  const items = outfit.clothes_ids
    .map((id) => clothes.get(id))
    .filter((c): c is Clothing => !!c);

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Item thumbnails */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md }}>
        {items.map((c) => (
          <View key={c.id} style={{ flex: 1, gap: spacing.xs }}>
            <Image
              source={{ uri: c.photo_clean_url ?? c.photo_url }}
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
              }}
              resizeMode="cover"
            />
            <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
              {t(categoryKey(c.category))}
            </Text>
          </View>
        ))}
      </View>

      {/* Rationale */}
      {outfit.rationale ? (
        <Text style={{ paddingHorizontal: spacing.md, color: colors.textMuted, fontSize: 14 }}>
          {outfit.rationale}
        </Text>
      ) : null}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md }}>
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: 12,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>{t('outfit.skip')}</Text>
        </Pressable>
        <Pressable
          onPress={onLike}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: 12,
            borderRadius: radius.md,
            backgroundColor: colors.primary,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="heart" size={18} color={colors.primaryText} />
          <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{t('outfit.like')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
