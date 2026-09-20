import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { categoryKey } from '@/constants/categories';
import { radius, spacing, typography, useTheme } from '@/constants/theme';
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
  const { colors } = useTheme();
  const { t } = useLocale();
  const items = outfit.clothes_ids
    .map((id) => clothes.get(id))
    .filter((c): c is Clothing => !!c);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md }}>
        {items.map((c) => (
          <View key={c.id} style={{ flex: 1, gap: spacing.xs }}>
            <Image
              source={{ uri: c.photo_clean_url ?? c.photo_url }}
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceAlt,
              }}
              resizeMode="cover"
            />
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
              {t(categoryKey(c.category))}
            </Text>
          </View>
        ))}
      </View>

      {outfit.rationale ? (
        <Text style={[typography.small, { paddingHorizontal: spacing.md, color: colors.textMuted }]}>
          {outfit.rationale}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md }}>
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: 14,
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
          })}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
          <Text style={[typography.button, { color: colors.text }]}>{t('outfit.skip')}</Text>
        </Pressable>
        <Pressable
          onPress={onLike}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: 14,
            borderRadius: radius.full,
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          })}
        >
          <Ionicons name="heart" size={18} color={colors.onPrimaryAccent} />
          <Text style={[typography.button, { color: colors.primaryText }]}>{t('outfit.like')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
