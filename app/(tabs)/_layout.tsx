import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';

export default function TabsLayout() {
  const { t } = useLocale();
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? colors.energy : colors.text,
        tabBarInactiveTintColor: colors.chromeMuted,
        tabBarHideOnKeyboard: true,
        // Symmetric padding keeps icon + label optically centred in the bubble.
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 10, marginTop: 0, marginBottom: 0 },
        tabBarIconStyle: { marginTop: 0 },
        tabBarItemStyle: { paddingTop: 8, paddingBottom: 8, justifyContent: 'center' },
        // Floating "bubble" bar, lifted off the bottom edge.
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: insets.bottom > 0 ? insets.bottom : 14,
          height: 62,
          borderRadius: 31,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          elevation: 16,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: dark ? 0.55 : 0.18,
          shadowRadius: 22,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={dark ? 55 : 70}
              tint={dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            {/* Glass tint + hairline edge */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: dark ? 'rgba(28,28,31,0.55)' : 'rgba(255,255,255,0.55)',
                  borderRadius: 31,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            />
          </View>
        ),
      }}
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
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size - 2} />
          ),
        }}
      />
    </Tabs>
  );
}
