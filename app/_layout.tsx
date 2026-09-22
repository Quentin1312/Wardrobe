import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
  useFonts,
} from '@expo-google-fonts/instrument-serif';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { CompanionProvider, useCompanion } from '@/context/CompanionProvider';
import { colors } from '@/constants/theme';

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const { chosen, ready } = useLocale();
  const { colors: themeColors, dark } = useTheme();
  const { kind: companion, ready: companionReady } = useCompanion();
  const segments = useSegments();
  const router = useRouter();

  // Paint the native root view so the status-bar area matches the app.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(themeColors.bg).catch(() => {});
  }, [themeColors.bg]);

  useEffect(() => {
    if (loading || !ready || !companionReady) return;

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
    } else if (signedIn && !needsOnboarding && !companion && route !== 'select-companion') {
      // Last onboarding step: pick the companion that follows you around.
      router.replace('/select-companion');
    } else if (signedIn && !needsOnboarding && (route === '(auth)' || route === '(onboarding)')) {
      router.replace('/(tabs)');
    }
  }, [loading, ready, companionReady, companion, chosen, session, profile, segments, router]);

  if (loading || !ready || !companionReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.bg }}>
        <ActivityIndicator color={themeColors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} backgroundColor={themeColors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.bg },
        }}
      >
        <Stack.Screen name="select-language" />
        <Stack.Screen name="select-companion" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-item" options={{ presentation: 'modal' }} />
        <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="body-photo" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <CompanionProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
          </CompanionProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
