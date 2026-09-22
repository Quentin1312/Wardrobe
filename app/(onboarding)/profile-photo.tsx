import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BodyPhotoStep } from '@/components/BodyPhotoStep';
import { Field } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { saveBodyPhoto } from '@/lib/bodyPhoto';
import { supabase } from '@/lib/supabase';

/** First launch: first name + the try-on photo (full body, facing the camera). */
export default function ProfilePhoto() {
  const { colors } = useTheme();
  const { session, refreshProfile } = useAuth();
  const { t } = useLocale();
  const [firstName, setFirstName] = useState('');

  async function skip() {
    if (!session?.user || !firstName.trim()) return;
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email,
      first_name: firstName.trim(),
      onboarded: true,
    });
    if (error) {
      Alert.alert(t('onboarding.uploadFailed'), error.message);
      return;
    }
    await refreshProfile();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: spacing.screen, paddingTop: spacing.lg }}
      >
        <BodyPhotoStep
          header={
            <Field
              label={t('onboarding.name')}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('onboarding.namePlaceholder')}
              autoCapitalize="words"
            />
          }
          canSave={Boolean(firstName.trim())}
          saveLabel={t('onboarding.saveContinue')}
          onSave={async (asset) => {
            if (!session?.user) throw new Error(t('common.error'));
            await saveBodyPhoto(session.user.id, session.user.email, asset, {
              first_name: firstName.trim(),
              onboarded: true,
            });
          }}
          // Refreshing the profile lets the root gate move on to the next step.
          onFinish={() => {
            refreshProfile();
          }}
          onSkip={firstName.trim() ? skip : undefined}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
