import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { pickFromLibrary, takePhoto } from '@/components/PhotoPicker';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';

export default function ProfilePhoto() {
  const { session, refreshProfile } = useAuth();
  const { t } = useLocale();
  const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!session?.user || !asset) return;
    setSaving(true);
    try {
      const userId = session.user.id;
      const path = `${userId}/profile.jpg`;
      const url = await uploadImage('profiles', path, asset);

      // Upsert the profile row and flag onboarding complete.
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: session.user.email,
        profile_photo_url: url,
        onboarded: true,
      });
      if (error) throw error;

      await refreshProfile();
      // Root auth gate routes to the tabs once onboarded flips true.
    } catch (e: any) {
      Alert.alert(t('onboarding.uploadFailed'), e.message ?? t('onboarding.uploadFailedMsg'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>
            {t('onboarding.photoTitle')}
          </Text>
          <Text style={{ fontSize: 16, color: colors.textMuted }}>
            {t('onboarding.photoSubtitle')}
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 240,
              height: 300,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
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
              <Ionicons name="person-outline" size={72} color={colors.textMuted} />
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('onboarding.takePhoto')}
              variant="ghost"
              onPress={async () => {
                const a = await takePhoto();
                if (a) setAsset(a);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('onboarding.choose')}
              variant="ghost"
              onPress={async () => {
                const a = await pickFromLibrary();
                if (a) setAsset(a);
              }}
            />
          </View>
        </View>

        <Button
          label={t('onboarding.saveContinue')}
          onPress={onSave}
          loading={saving}
          disabled={!asset}
        />
      </View>
    </SafeAreaView>
  );
}
