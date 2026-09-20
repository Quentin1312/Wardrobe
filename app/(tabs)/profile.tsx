import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const { session, profile, signOut } = useAuth();
  const photo = profile?.profile_photo_clean_url ?? profile?.profile_photo_url;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Profile</Text>

        <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
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
              <Text style={{ color: colors.textMuted }}>No photo</Text>
            )}
          </View>
          <Text style={{ fontSize: 16, color: colors.text }}>{session?.user.email}</Text>
        </View>

        <View style={{ flex: 1 }} />
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}
