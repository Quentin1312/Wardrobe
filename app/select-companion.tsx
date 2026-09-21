import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { SpeechBubble } from '@/components/companion/SpeechBubble';
import { radius, spacing, typography } from '@/constants/theme';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { COMPANION_KINDS, COMPANION_NAMES, type CompanionKind } from '@/lib/companion';

const COPY = {
  fr: {
    eyebrow: 'TON COMPAGNON',
    title: 'Choisis qui t’accompagne',
    body: 'Il te suivra partout dans l’app : conseils météo, tenues, rappels de linge.',
    cta: (name: string) => `C’est ${name} !`,
    species: { dylan: 'Poméranien', miso: 'Chat', rio: 'Perroquet' },
    intro: {
      dylan: 'Ouaf ! Moi c’est Dylan. Un œil bleu, un œil marron, et beaucoup de style.',
      miso: 'Miaou. Miso. J’ai l’œil pour les belles matières.',
      rio: 'Rio ! Rio ! Je suis Rio, et j’adore les couleurs. Les couleurs !',
    },
  },
  en: {
    eyebrow: 'YOUR COMPANION',
    title: 'Choose your sidekick',
    body: 'They’ll follow you around the app: weather tips, outfits, laundry nudges.',
    cta: (name: string) => `${name} it is!`,
    species: { dylan: 'Pomeranian', miso: 'Cat', rio: 'Parrot' },
    intro: {
      dylan: 'Woof! I’m Dylan. One blue eye, one brown, lots of style.',
      miso: 'Meow. Miso. I have an eye for good fabrics.',
      rio: 'Rio! Rio! I’m Rio and I love colours. Colours!',
    },
  },
};

export default function SelectCompanion() {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const { kind: current, setKind } = useCompanion();
  const router = useRouter();
  const { change } = useLocalSearchParams<{ change?: string }>();
  const copy = COPY[locale];

  const [picked, setPicked] = useState<CompanionKind>(current ?? 'dylan');

  function confirm() {
    setKind(picked);
    if (change) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 620,
          alignSelf: 'center',
          padding: spacing.screen,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
        }}
      >
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          <Text style={[typography.eyebrow, { color: colors.accent }]}>{copy.eyebrow}</Text>
          <Text style={[typography.h1, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>{copy.body}</Text>
        </View>

        {/* Hero: the picked companion introduces itself */}
        <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
          <View style={{ maxWidth: 320 }}>
            <SpeechBubble text={copy.intro[picked]} tail="bottom" />
          </View>
          <CompanionAvatar kind={picked} size={190} mood="happy" bounceKey={picked} />
        </View>

        {/* Picker */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {COMPANION_KINDS.map((k) => {
            const active = k === picked;
            return (
              <Pressable
                key={k}
                onPress={() => setPicked(k)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: spacing.md,
                  borderRadius: radius.lg,
                  borderWidth: 2,
                  borderColor: active ? colors.energy : colors.border,
                  backgroundColor: active ? colors.surface : colors.surfaceAlt,
                }}
              >
                <CompanionAvatar kind={k} size={78} />
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{COMPANION_NAMES[k]}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{copy.species[k]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={confirm}
          style={({ pressed }) => ({
            minHeight: 58,
            borderRadius: radius.full,
            backgroundColor: pressed ? colors.accentSoft : colors.energy,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
          })}
        >
          <Ionicons name="paw" size={20} color={colors.energyText} />
          <Text style={[typography.button, { color: colors.energyText, fontSize: 17 }]}>
            {copy.cta(COMPANION_NAMES[picked])}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
