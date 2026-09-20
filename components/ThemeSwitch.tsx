import { Pressable, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

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
      {MODES.map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: active ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={[typography.caption, { color: active ? colors.primaryText : colors.textMuted }]}
            >
              {t(`theme.${m}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
