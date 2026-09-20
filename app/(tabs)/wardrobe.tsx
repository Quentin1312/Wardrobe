import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { categoryKey } from '@/constants/categories';
import { radius, shadows, spacing, typography, useTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { fetchClothes } from '@/lib/clothes';
import type { Clothing } from '@/lib/types';

export default function Wardrobe() {
  const { colors, dark } = useTheme();
  const { session } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<Clothing[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.sm }}>
        <Text style={[typography.h1, { color: colors.text }]}>{t('wardrobe.title')}</Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          {items.length > 0 ? t('wardrobe.count', { count: items.length }) : t('wardrobe.subtitle')}
        </Text>
      </View>

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
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}
          columnWrapperStyle={{ gap: spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => <ClothingCard item={item} />}
        />
      )}

      <Pressable
        onPress={() => router.push('/add-item')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: spacing.screen,
          bottom: spacing.lg,
          width: 60,
          height: 60,
          borderRadius: radius.full,
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.floating(dark),
        })}
      >
        <Ionicons name="add" size={30} color={colors.primaryText} />
      </Pressable>
    </SafeAreaView>
  );
}

function ClothingCard({ item }: { item: Clothing }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const uri = item.photo_clean_url ?? item.photo_url;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
      <View style={{ padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
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
        <Text style={[typography.small, { color: colors.text }]}>
          {t(categoryKey(item.category))}
        </Text>
      </View>
    </View>
  );
}
