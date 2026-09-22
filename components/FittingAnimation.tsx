import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { SpeechBubble } from '@/components/companion/SpeechBubble';
import { radius, spacing } from '@/constants/theme';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { Clothing, ClothingCategory } from '@/lib/types';

const ORDER: ClothingCategory[] = ['top', 'jacket', 'bottom', 'shoes'];
/** The render usually takes 30–90 s: the bar eases towards 95 % over this time. */
const EXPECTED_MS = 70_000;

/**
 * Waiting screen of the AI try-on: the companion, front and centre, talking
 * through the look while it is being rendered, and a slim progress bar.
 */
export function FittingAnimation({ items }: { items: Clothing[] }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { kind } = useCompanion();
  const glow = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const lines = useMemo(() => {
    const pieces = ORDER.flatMap((c) => items.filter((i) => i.category === c));
    const out = pieces.map((p) =>
      t(`tryon.step.${p.category}`, { name: p.name ?? t(`category.${p.category}`).toLowerCase() })
    );
    out.push(t('tryon.step.check'), t('tryon.step.final'));
    return out;
  }, [items, t]);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    Animated.timing(progress, {
      toValue: 0.95,
      duration: EXPECTED_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => {
      loop.stop();
      progress.stopAnimation();
    };
  }, [glow, progress]);

  useEffect(() => {
    const id = setInterval(() => setLine((l) => Math.min(l + 1, lines.length - 1)), 6500);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <View style={{ gap: spacing.lg, alignItems: 'center', paddingVertical: spacing.md }}>
      <View style={{ minHeight: 84, justifyContent: 'flex-end', alignSelf: 'stretch', paddingHorizontal: spacing.sm }}>
        <SpeechBubble text={lines[line] ?? t('tryon.generating')} tail="bottom" />
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {/* Soft breathing halo behind the companion */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: colors.energy,
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.16] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.06] }) }],
          }}
        />
        {kind ? <CompanionAvatar kind={kind} size={168} mood="thinking" /> : null}
      </View>

      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden', alignSelf: 'stretch' }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: radius.full,
            backgroundColor: colors.energy,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
    </View>
  );
}
