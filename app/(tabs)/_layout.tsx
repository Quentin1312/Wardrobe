import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';

export default function TabsLayout() {
  const { t } = useLocale();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.energy,
        tabBarInactiveTintColor: colors.chromeMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 10, marginTop: 2 },
        tabBarItemStyle: { borderRadius: 18 },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 0,
          backgroundColor: colors.chrome,
          borderTopWidth: 0,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          height: 68 + Math.max(insets.bottom, 8),
          paddingTop: 9,
          paddingBottom: Math.max(insets.bottom, 8),
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.24,
          shadowRadius: 24,
          elevation: 14,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          title: t('tabs.outfit'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="body-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
