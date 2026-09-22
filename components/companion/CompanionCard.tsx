import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchClothes } from '@/lib/clothes';
import { COMPANION_NAMES, companionLines } from '@/lib/companion';
import { fetchTodaysWornOutfit } from '@/lib/outfits';
import { fetchWearStats, mostForgotten } from '@/lib/wear';
import { categoryKey } from '@/constants/categories';
import { CompanionAvatar } from './CompanionAvatar';
import { SpeechBubble } from './SpeechBubble';

/**
 * Home-screen companion: greets you, comments on the weather, your look and
 * your laundry. Tap it to hear the next thing it has to say.
 */
export function CompanionCard({ temp, weatherMain }: { temp: number | null; weatherMain: string | null }) {
  const { colors } = useTheme();
  const { kind } = useCompanion();
  const { session, profile } = useAuth();
  const { locale, t } = useLocale();

  const [dirtyCount, setDirtyCount] = useState(0);
  const [lookValidated, setLookValidated] = useState(false);
  const [index, setIndex] = useState(0);
  const [forgotten, setForgotten] = useState<{ label: string; days: number | null } | null>(null);

  const userId = session?.user?.id;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let alive = true;
      Promise.all([fetchClothes(userId), fetchTodaysWornOutfit(userId), fetchWearStats(userId).catch(() => null)])
        .then(([items, worn, stats]) => {
          if (!alive) return;
          const pick = stats ? mostForgotten(items, stats) : null;
          setForgotten(pick ? { label: pick.item.name ?? t(categoryKey(pick.item.category)), days: pick.days } : null);
          setDirtyCount(items.filter((item) => item.dirty).length);
          setLookValidated(Boolean(worn));
          setIndex(0);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, [userId, t])
  );

  const lines = useMemo(
    () =>
      kind
        ? companionLines(
            kind,
            {
              firstName: profile?.first_name ?? null,
              temp,
              weatherMain,
              dirtyCount,
              lookValidated,
              forgotten,
              hour: new Date().getHours(),
            },
            locale
          )
        : [],
    // Recompute when the facts change, not on every render.
    [kind, profile?.first_name, temp, weatherMain, dirtyCount, lookValidated, forgotten, locale]
  );

  if (!kind || lines.length === 0) return null;

  const line = lines[index % lines.length];
  const next = () => setIndex((i) => i + 1);

  return (
    <Pressable
      onPress={next}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        paddingTop: spacing.xs,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <CompanionAvatar kind={kind} size={104} mood={lookValidated ? 'happy' : 'idle'} onPress={next} bounceKey={index} />
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{COMPANION_NAMES[kind]}</Text>
      </View>
      <View style={{ flex: 1, paddingBottom: spacing.lg }}>
        <SpeechBubble text={line} />
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginTop: 6, marginLeft: radius.sm, opacity: 0.7 },
          ]}
        >
          {locale === 'fr' ? 'Touche-moi pour la suite' : 'Tap me for more'}
        </Text>
      </View>
    </Pressable>
  );
}
