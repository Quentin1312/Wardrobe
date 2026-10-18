import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { StudioBadge } from '@/components/StudioBadge';
import { TabBar } from '@/components/TabBar';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';

const LAST_TAB_KEY = 'wardrobe.lastTab';
const TAB_ROUTES = ['index', 'outfit', 'wardrobe', 'history', 'profile'] as const;

export default function TabsLayout() {
  const { t } = useLocale();
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];
  const restored = useRef(false);

  // Coming back to the app should land where you left it, not on Today.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    AsyncStorage.getItem(LAST_TAB_KEY)
      .then((last) => {
        if (last && last !== 'index' && (TAB_ROUTES as readonly string[]).includes(last)) {
          router.replace(`/${last}` as never);
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (currentTab && (TAB_ROUTES as readonly string[]).includes(currentTab)) {
      void AsyncStorage.setItem(LAST_TAB_KEY, currentTab).catch(() => {});
    }
  }, [currentTab]);
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          title: t('tabs.outfit'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="body-outline" color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size - 2} />
          ),
        }}
      />
      </Tabs>
      <StudioBadge />
    </View>
  );
}
