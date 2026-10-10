import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';

/** The icon tells "auto" apart: that one follows the phone's own setting. */
const MODES: { key: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', icon: 'phone-portrait-outline' },
  { key: 'light', icon: 'sunny-outline' },
  { key: 'dark', icon: 'moon-outline' },
];

export function ThemeSwitch() {
  const { colors, mode, setMode } = useTheme();
  const { t } = useLocale();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 3,
      }}
    >
      {MODES.map(({ key, icon }) => {
        const active = mode === key;
        const tint = active ? colors.primaryText : colors.textMuted;
        return (
          <Pressable
            key={key}
            onPress={() => setMode(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: 6,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: active ? colors.primary : 'transparent',
            }}
          >
            <Ionicons name={icon} size={13} color={tint} />
            <Text style={[typography.caption, { color: tint }]}>{t(`theme.${key}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
