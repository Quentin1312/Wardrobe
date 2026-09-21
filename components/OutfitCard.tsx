import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { categoryKey } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
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
        borderRadius: radius.xl,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', gap: 2, minHeight: 190, backgroundColor: colors.surfaceAlt }}>
        {items.map((c) => (
          <View key={c.id} style={{ flex: 1, minWidth: 0 }}>
            <Image
              source={{ uri: c.photo_clean_url ?? c.photo_url }}
              style={{
                width: '100%',
                height: 190,
                backgroundColor: '#F7F7F4',
              }}
              resizeMode="contain"
            />
          </View>
        ))}
      </View>

      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {items.map((item) => (
              <View key={item.id} style={{ borderRadius: radius.full, backgroundColor: colors.surfaceAlt, paddingVertical: 5, paddingHorizontal: 9 }}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{t(categoryKey(item.category))}</Text>
              </View>
            ))}
          </View>
          <Ionicons name="color-wand-outline" size={18} color={colors.accent} />
        </View>

        {outfit.rationale ? (
          <Text style={[typography.body, { color: colors.text }]}>{outfit.rationale}</Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
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
            backgroundColor: pressed ? colors.surfaceAlt : colors.bg,
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
