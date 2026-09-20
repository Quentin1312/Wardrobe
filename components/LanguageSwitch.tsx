import { Pressable, Text, View } from 'react-native';
import { radius, spacing, typography, useTheme } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { LOCALES } from '@/lib/i18n';

/** Compact FR / EN segmented toggle. */
export function LanguageSwitch() {
  const { colors } = useTheme();
  const { locale, setLocale } = useLocale();
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
      {LOCALES.map((l) => {
        const active = locale === l.code;
        return (
          <Pressable
            key={l.code}
            onPress={() => setLocale(l.code)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: spacing.md,
              borderRadius: radius.full,
              backgroundColor: active ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={[
                typography.caption,
                { color: active ? colors.primaryText : colors.textMuted },
              ]}
            >
              {l.code.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
