import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { Button } from '@/components/ui';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useCompanion } from '@/context/CompanionProvider';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { COMPANION_NAMES } from '@/lib/companion';

export default function Profile() {
  const { colors } = useTheme();
  const { session, profile, signOut } = useAuth();
  const { t } = useLocale();
  const photo = profile?.profile_photo_clean_url ?? profile?.profile_photo_url;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: spacing.screen, paddingBottom: 110, gap: spacing.lg }}>
        <Text style={[typography.eyebrow, { color: colors.accent }]}>ACCOUNT / SETTINGS</Text>
        <Text style={[typography.h1, { color: colors.text }]}>{t('profile.title')}</Text>

        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceAlt,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photo ? (
              // Full-body try-on photo: keep the face in the circle.
              <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
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
        <BodyPhotoRow />
        <CompanionRow />

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
        backgroundColor: colors.surface,
      }}
    >
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

/** The full-body photo used for AI try-on, and a shortcut to retake it. */
function BodyPhotoRow() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { profile } = useAuth();
  const router = useRouter();
  const photo = profile?.profile_photo_url;
  return (
    <Pressable
      onPress={() => router.push('/body-photo')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
      })}
    >
      <View style={{ width: 42, height: 56, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Ionicons name="body-outline" size={22} color={colors.textMuted} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('body.change')}</Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>{photo ? t('body.tip1') : t('profile.noPhoto')}</Text>
      </View>
      <Text style={[typography.caption, { color: colors.accent }]}>{t('body.changeCta')}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.accent} />
    </Pressable>
  );
}

/** Shows the current companion and opens the picker to swap it. */
function CompanionRow() {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const { kind } = useCompanion();
  const router = useRouter();
  if (!kind) return null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/select-companion', params: { change: '1' } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
      })}
    >
      <CompanionAvatar kind={kind} size={56} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>
          {locale === 'fr' ? 'Compagnon' : 'Companion'}
        </Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>{COMPANION_NAMES[kind]}</Text>
      </View>
      <Text style={[typography.caption, { color: colors.accent }]}>
        {locale === 'fr' ? 'Changer' : 'Change'}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.accent} />
    </Pressable>
  );
}
