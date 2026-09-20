import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, useTheme } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { LOCALES } from '@/lib/i18n';

export default function SelectLanguage() {
  const { colors } = useTheme();
  const { setLocale } = useLocale();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.screen, justifyContent: 'center', gap: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.h1, { color: colors.text }]}>Wardrobe</Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Choose your language · Choisis ta langue
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {LOCALES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => setLocale(l.code)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.full,
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {l.code.toUpperCase()}
                </Text>
              </View>
              <Text style={[typography.h3, { color: colors.text, flex: 1 }]}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
