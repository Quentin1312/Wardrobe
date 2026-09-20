import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { colors } from '@/constants/theme';

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const { chosen, ready } = useLocale();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || !ready) return;

    const route = segments[0]; // group or route name

    // Language selection comes first, before anything else.
    if (!chosen) {
      if (route !== 'select-language') router.replace('/select-language');
      return;
    }

    const signedIn = !!session;
    const needsOnboarding = signedIn && !profile?.onboarded;

    if (route === 'select-language') {
      // Language just chosen — fall through to the right place.
      router.replace(signedIn ? '/(tabs)' : '/(auth)/sign-in');
    } else if (!signedIn && route !== '(auth)') {
      router.replace('/(auth)/sign-in');
    } else if (signedIn && needsOnboarding && route !== '(onboarding)') {
      router.replace('/(onboarding)/profile-photo');
    } else if (signedIn && !needsOnboarding && (route === '(auth)' || route === '(onboarding)')) {
      router.replace('/(tabs)');
    }
  }, [loading, ready, chosen, session, profile, segments]);

  if (loading || !ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="select-language" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-item" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
