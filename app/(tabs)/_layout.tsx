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
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 11, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.chrome,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
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
