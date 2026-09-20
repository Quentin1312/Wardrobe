import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { pickFromLibrary, takePhoto } from '@/components/PhotoPicker';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';

export default function ProfilePhoto() {
  const { colors } = useTheme();
  const { session, refreshProfile } = useAuth();
  const { t } = useLocale();
  const [firstName, setFirstName] = useState('');
  const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!session?.user || !asset || !firstName.trim()) return;
    setSaving(true);
    try {
      const userId = session.user.id;
      const path = `${userId}/profile.jpg`;
      const url = await uploadImage('profiles', path, asset);
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: session.user.email,
        first_name: firstName.trim(),
        profile_photo_url: url,
        onboarded: true,
      });
      if (error) throw error;
      await refreshProfile();
    } catch (e: any) {
      Alert.alert(t('onboarding.uploadFailed'), e.message ?? t('onboarding.uploadFailedMsg'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.screen, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          <Text style={[typography.h1, { color: colors.text }]}>{t('onboarding.photoTitle')}</Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {t('onboarding.photoSubtitle')}
          </Text>
        </View>

        <Field
          label={t('onboarding.name')}
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('onboarding.namePlaceholder')}
          autoCapitalize="words"
        />

        <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
          <View
            style={{
              width: 220,
              height: 280,
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
          disabled={!asset || !firstName.trim()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
