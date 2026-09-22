import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BodyPhotoStep } from '@/components/BodyPhotoStep';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { saveBodyPhoto } from '@/lib/bodyPhoto';

/** Replace the try-on photo later (from Profile or the try-on sheet). */
export default function BodyPhoto() {
  const { colors } = useTheme();
  const { session, refreshProfile } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'flex-end', paddingHorizontal: spacing.screen, paddingTop: spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.textMuted} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: spacing.screen, paddingTop: 0 }}>
        <BodyPhotoStep
          saveLabel={t('body.save')}
          onSave={async (asset) => {
            if (!session?.user) throw new Error(t('common.error'));
            await saveBodyPhoto(session.user.id, session.user.email, asset);
          }}
          onFinish={async () => {
            await refreshProfile();
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
