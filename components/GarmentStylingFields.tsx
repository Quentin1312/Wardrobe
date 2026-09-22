import { Pressable, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { COLOR_CHOICES, type GarmentColor } from '@/lib/garmentMeta';

export function GarmentStylingFields({ colors, onColors }: {
  colors: GarmentColor[];
  onColors: (colors: GarmentColor[]) => void;
}) {
  const { colors: theme } = useTheme();
  const { locale } = useLocale();
  const fr = locale === 'fr';

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.eyebrow, { color: theme.textMuted }]}>
          {fr ? 'COULEURS VISIBLES · 3 MAX' : 'VISIBLE COLOURS · UP TO 3'}
        </Text>
        <Text style={[typography.small, { color: theme.textMuted }]}>
          {fr ? 'La première est la couleur principale. Corrige-les si la photo trompe l’analyse.' :
            'The first is the main colour. Correct them if the photo fools the analysis.'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {COLOR_CHOICES.map((choice) => {
            const position = colors.indexOf(choice.name);
            const selected = position >= 0;
            return (
              <Pressable
                key={choice.name}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onColors(selected
                  ? colors.filter((name) => name !== choice.name)
                  : colors.length < 3 ? [...colors, choice.name] : colors)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10,
                  paddingVertical: 8, borderRadius: radius.full, borderWidth: 1,
                  borderColor: selected ? theme.accent : theme.border,
                  backgroundColor: selected ? theme.accentSoft : theme.surface }}
              >
                <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: choice.hex,
                  borderWidth: 1, borderColor: theme.borderStrong }} />
                <Text style={[typography.caption, { color: theme.text }]}>
                  {selected ? `${position + 1} · ` : ''}{fr ? choice.name : choice.en}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
