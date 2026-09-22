import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pickFromLibrary, takePhoto } from '@/components/PhotoPicker';
import { GarmentStylingFields } from '@/components/GarmentStylingFields';
import { Button, Field } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { addClothing } from '@/lib/clothes';
import type { ClothingCategory } from '@/lib/types';
import { uploadImage } from '@/lib/upload';
import { extractGarmentPalette } from '@/lib/color';
import { colorsFromHexes, primaryColorHex, writeGarmentMeta, type GarmentColor } from '@/lib/garmentMeta';
import { useStudioQueue } from '@/context/StudioQueueProvider';
import { checkPhoto, type PhotoIssue } from '@/lib/photoQuality';

type Check = { status: 'idle' } | { status: 'checking' } | { status: 'done'; issues: PhotoIssue[] };

const TIPS: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { icon: 'layers-outline', key: 'photo.tipFlat' },
  { icon: 'square-outline', key: 'photo.tipBackground' },
  { icon: 'sunny-outline', key: 'photo.tipLight' },
  { icon: 'scan-outline', key: 'photo.tipFrame' },
];

export default function AddItem() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
  const [category, setCategory] = useState<ClothingCategory | null>(null);
  const [name, setName] = useState('');
  const [garmentColors, setGarmentColors] = useState<GarmentColor[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [check, setCheck] = useState<Check>({ status: 'idle' });
  const checkRun = useRef(0);
  const studio = useStudioQueue();

  /** New photo: check it right away, on the device, for free. */
  function onPicked(a: ImagePickerAsset | null) {
    if (!a) return;
    setAsset(a);
    setGarmentColors([]);
    const run = ++checkRun.current;
    void extractGarmentPalette(a.uri, `preview-${run}`).then((palette) => {
      if (run === checkRun.current) setGarmentColors(colorsFromHexes(palette));
    });
    setCheck({ status: 'checking' });
    checkPhoto(a.uri)
      .then((res) => {
        if (run !== checkRun.current) return;
        setCheck(res ? { status: 'done', issues: res.issues } : { status: 'idle' });
      })
      .catch(() => {
        if (run === checkRun.current) setCheck({ status: 'idle' });
      });
  }

  async function retake() {
    onPicked(await takePhoto());
  }

  async function onSave() {
    if (!session?.user || !asset || !category) return;
    setSaving(true);
    try {
      const userId = session.user.id;
      const path = `${userId}/${Date.now()}.jpg`;
      const url = await uploadImage('clothes', path, asset);
      const clothing = await addClothing({ userId, photoUrl: url, category, name,
        dominantColor: primaryColorHex(garmentColors),
        styleTags: writeGarmentMeta([], garmentColors, description) });
      // Cut-out and studio render happen in the background: adding a piece
      // should take a few seconds, not a minute.
      studio.enqueue({ id: clothing.id, name: clothing.name ?? name });
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
          width: '100%',
          maxWidth: 620,
          alignSelf: 'center',
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

        <ScrollView contentContainerStyle={{ width: '100%', maxWidth: 620, alignSelf: 'center', padding: spacing.screen, gap: spacing.lg }}>
          <Pressable
            onPress={retake}
            style={{
              aspectRatio: 1,
              borderRadius: radius.xl,
              backgroundColor: colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {asset ? (
              <Image source={{ uri: asset.uri }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg }}>
                <Ionicons name="camera-outline" size={44} color={colors.textMuted} />
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('add.takePhoto')}</Text>
                <View style={{ gap: 8, alignSelf: 'stretch', maxWidth: 320 }}>
                  <Text style={[typography.eyebrow, { color: colors.accent, textAlign: 'center' }]}>
                    {t('photo.tipsTitle')}
                  </Text>
                  {TIPS.map((tip) => (
                    <View key={tip.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Ionicons name={tip.icon} size={16} color={colors.textMuted} />
                      <Text style={[typography.small, { color: colors.textMuted, flex: 1 }]}>{t(tip.key)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Pressable>

          {asset ? <PhotoCheck check={check} onRetake={retake} /> : null}

          <Button
            label={t('add.chooseGallery')}
            variant="ghost"
            onPress={async () => onPicked(await pickFromLibrary())}
          />

          <Field
            label={t('add.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('add.namePlaceholder')}
            autoCapitalize="sentences"
            returnKeyType="done"
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
                    <Ionicons name={c.icon} size={16} color={active ? colors.primaryText : colors.text} />
                    <Text style={[typography.bodyStrong, { color: active ? colors.primaryText : colors.text }]}>
                      {t(`category.${c.key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <GarmentStylingFields colors={garmentColors} onColors={setGarmentColors}
            description={description} onDescription={setDescription} />

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

/** Verdict on the photo, with one concrete fix per problem. */
function PhotoCheck({ check, onRetake }: { check: Check; onRetake: () => void }) {
  const { colors } = useTheme();
  const { t } = useLocale();

  if (check.status === 'idle') return null;
  if (check.status === 'checking') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ActivityIndicator size="small" color={colors.textMuted} />
        <Text style={[typography.small, { color: colors.textMuted }]}>{t('photo.checking')}</Text>
      </View>
    );
  }
  if (check.issues.length === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        <Text style={[typography.bodyStrong, { color: colors.success }]}>{t('photo.ok')}</Text>
      </View>
    );
  }
  return (
    <View
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.danger,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('photo.issuesTitle')}</Text>
      </View>
      {check.issues.map((issue) => (
        <Text key={issue} style={[typography.small, { color: colors.text }]}>
          {t(`photo.issue.${issue}`)}
        </Text>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: 4 }}>
        <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>{t('photo.keepAnyway')}</Text>
        <Pressable
          onPress={onRetake}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 9,
            paddingHorizontal: spacing.md,
            borderRadius: radius.full,
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          })}
        >
          <Ionicons name="camera-outline" size={16} color={colors.primaryText} />
          <Text style={[typography.caption, { color: colors.primaryText }]}>{t('photo.retake')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
