import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pickFromLibrary, takePhoto } from '@/components/PhotoPicker';
import { Button } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { addClothing } from '@/lib/clothes';
import type { ClothingCategory } from '@/lib/types';
import { uploadImage } from '@/lib/upload';

export default function AddItem() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
  const [category, setCategory] = useState<ClothingCategory | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!session?.user || !asset || !category) return;
    setSaving(true);
    try {
      const userId = session.user.id;
      const path = `${userId}/${Date.now()}.jpg`;
      const url = await uploadImage('clothes', path, asset);
      await addClothing({ userId, photoUrl: url, category });
      router.back();
    } catch (e: any) {
      Alert.alert(t('add.failed'), e.message ?? t('add.failedMsg'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.screen,
          paddingVertical: spacing.md,
        }}
      >
        <Text style={[typography.h2, { color: colors.text }]}>{t('add.title')}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.screen, gap: spacing.lg }}>
        <Pressable
          onPress={async () => {
            const a = await takePhoto();
            if (a) setAsset(a);
          }}
          style={{
            aspectRatio: 1,
            borderRadius: radius.xl,
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {asset ? (
            <Image source={{ uri: asset.uri }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {t('add.takePhoto')}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('add.photoHint')}</Text>
            </View>
          )}
        </Pressable>

        <Button
          label={t('add.chooseGallery')}
          variant="ghost"
          onPress={async () => {
            const a = await pickFromLibrary();
            if (a) setAsset(a);
          }}
        />

        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.eyebrow, { color: colors.textMuted }]}>{t('add.category')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    paddingVertical: 10,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : colors.surface,
                  }}
                >
                  <Ionicons
                    name={c.icon}
                    size={16}
                    color={active ? colors.primaryText : colors.text}
                  />
                  <Text
                    style={[
                      typography.bodyStrong,
                      { color: active ? colors.primaryText : colors.text },
                    ]}
                  >
                    {t(`category.${c.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          label={t('add.save')}
          onPress={onSave}
          loading={saving}
          disabled={!asset || !category}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
