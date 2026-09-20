import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { LOCALES } from '@/lib/i18n';

export default function SelectLanguage() {
  const { setLocale } = useLocale();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: 34, fontWeight: '800', color: colors.text }}>Wardrobe</Text>
          <Text style={{ fontSize: 16, color: colors.textMuted }}>
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
                backgroundColor: colors.surface,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 28 }}>{l.flag}</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
                {l.label}
              </Text>
              <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
