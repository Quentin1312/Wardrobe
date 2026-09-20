import type { ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { Button } from '@/components/ui';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

export default function Profile() {
  const { colors } = useTheme();
  const { session, profile, signOut } = useAuth();
  const { t } = useLocale();
  const photo = profile?.profile_photo_clean_url ?? profile?.profile_photo_url;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.screen, gap: spacing.lg }}>
        <Text style={[typography.h1, { color: colors.text }]}>{t('profile.title')}</Text>

        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceAlt,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {t('profile.noPhoto')}
              </Text>
            )}
          </View>
          {profile?.first_name ? (
            <Text style={[typography.h3, { color: colors.text }]}>{profile.first_name}</Text>
          ) : null}
          <Text style={[typography.small, { color: colors.textMuted }]}>{session?.user.email}</Text>
        </View>

        <SettingRow label={t('profile.language')}>
          <LanguageSwitch />
        </SettingRow>
        <SettingRow label={t('profile.theme')}>
          <ThemeSwitch />
        </SettingRow>

        <View style={{ flex: 1 }} />
        <Button label={t('profile.signOut')} variant="ghost" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}
