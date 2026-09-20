import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const group = segments[0]; // '(auth)' | '(onboarding)' | '(tabs)' | undefined
    const signedIn = !!session;
    const needsOnboarding = signedIn && !profile?.onboarded;

    if (!signedIn && group !== '(auth)') {
      router.replace('/(auth)/sign-in');
    } else if (signedIn && needsOnboarding && group !== '(onboarding)') {
      router.replace('/(onboarding)/profile-photo');
    } else if (signedIn && !needsOnboarding && (group === '(auth)' || group === '(onboarding)')) {
      router.replace('/(tabs)');
    }
  }, [loading, session, profile, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
