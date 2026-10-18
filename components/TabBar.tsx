import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const BAR_HEIGHT = 62;
const ICON_SIZE = 22;

/**
 * The floating bottom bar, drawn by hand.
 *
 * React Navigation's own bar decides where the label goes and adds its own
 * safe-area padding, which with five tabs put the labels on top of the icons.
 * Here each item is a plain column: icon, then label, centred, always.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 18,
        right: 18,
        bottom: insets.bottom > 0 ? insets.bottom : 14,
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'stretch',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: dark ? 0.55 : 0.18,
        shadowRadius: 22,
        elevation: 16,
      }}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BlurView intensity={dark ? 55 : 70} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: dark ? 'rgba(28,28,31,0.55)' : 'rgba(255,255,255,0.55)',
              borderRadius: BAR_HEIGHT / 2,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        />
      </View>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? (dark ? colors.energy : colors.text) : colors.chromeMuted;
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              paddingHorizontal: 2,
            }}
          >
            {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
            <Text
              numberOfLines={1}
              style={{ fontFamily: fonts.sansSemi, fontSize: 10, lineHeight: 12, color }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
