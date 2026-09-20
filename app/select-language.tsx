import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { LOCALES } from '@/lib/i18n';

export default function SelectLanguage() {
  const { colors } = useTheme();
  const { setLocale } = useLocale();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View pointerEvents="none" style={{ position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: colors.accent, opacity: 0.13, top: -140, right: -100 }} />
      <View style={{ flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center', padding: spacing.screen, justifyContent: 'center', gap: spacing.xl }}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 11, borderRadius: radius.full, backgroundColor: colors.energy }}>
            <Text style={[typography.eyebrow, { color: colors.energyText }]}>YOUR STYLE STARTS HERE</Text>
          </View>
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
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.full,
                  backgroundColor: colors.surfaceAlt,
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
