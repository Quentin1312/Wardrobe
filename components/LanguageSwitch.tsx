import { Pressable, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { LOCALES } from '@/lib/i18n';

/** Compact FR / EN segmented toggle. */
export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 2,
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
              style={{
                color: active ? colors.primaryText : colors.textMuted,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {l.flag} {l.code.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
