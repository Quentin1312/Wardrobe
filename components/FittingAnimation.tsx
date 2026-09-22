import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { SpeechBubble } from '@/components/companion/SpeechBubble';
import { radius, spacing, typography } from '@/constants/theme';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { Clothing, ClothingCategory } from '@/lib/types';

/** Where each kind of piece lands on the 300×400 silhouette. */
const SLOT: Partial<Record<ClothingCategory, { cx: number; cy: number; w: number; h: number }>> = {
  jacket: { cx: 150, cy: 162, w: 150, h: 150 },
  top: { cx: 150, cy: 162, w: 128, h: 128 },
  bottom: { cx: 150, cy: 290, w: 100, h: 150 },
  shoes: { cx: 150, cy: 376, w: 110, h: 44 },
};
const ORDER: ClothingCategory[] = ['top', 'jacket', 'bottom', 'shoes'];
/** The render usually takes 30–90 s: the bar eases towards 95 % over this time. */
const EXPECTED_MS = 70_000;

/**
 * Waiting screen of the AI try-on: the pieces fly onto a silhouette one by
 * one, a light scans the figure, and the companion narrates each step.
 */
export function FittingAnimation({ items }: { items: Clothing[] }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { kind } = useCompanion();
  const [width, setWidth] = useState(0);
  const height = (width * 4) / 3;
  const unit = width / 300;

  const pieces = useMemo(
    () => ORDER.flatMap((c) => items.filter((i) => i.category === c)).filter((i) => SLOT[i.category!]),
    [items]
  );
  const flights = useMemo(() => pieces.map(() => new Animated.Value(0)), [pieces]);
  const scan = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Narration: one line per piece, then the checks.
  const lines = useMemo(() => {
    const out = pieces.map((p) =>
      t(`tryon.step.${p.category}`, { name: p.name ?? t(`category.${p.category}`).toLowerCase() })
    );
    out.push(t('tryon.step.check'), t('tryon.step.final'));
    return out;
  }, [pieces, t]);
  const [line, setLine] = useState(0);

  useEffect(() => {
    // Pieces fly in one after the other, then the whole look breathes.
    Animated.stagger(
      900,
      flights.map((f) => Animated.spring(f, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }))
    ).start();
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    scanLoop.start();
    glowLoop.start();
    Animated.timing(progress, {
      toValue: 0.95,
      duration: EXPECTED_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => {
      scanLoop.stop();
      glowLoop.stop();
      progress.stopAnimation();
    };
  }, [flights, scan, glow, progress]);

  useEffect(() => {
    // Follow the pieces while they land, then slow down on the last lines.
    const id = setInterval(() => setLine((l) => Math.min(l + 1, lines.length - 1)), 6500);
    return () => clearInterval(id);
  }, [lines.length]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={{ gap: spacing.md }}>
      <View
        onLayout={onLayout}
        style={{
          width: '100%',
          aspectRatio: 3 / 4,
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: colors.hero,
        }}
      >
        {width > 0 ? (
          <>
            {/* Soft halo behind the figure */}
            <Animated.View
              style={{
                position: 'absolute',
                left: width * 0.15,
                top: height * 0.08,
                width: width * 0.7,
                height: width * 0.7,
                borderRadius: width * 0.35,
                backgroundColor: colors.heroAccent,
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.13] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.05] }) }],
              }}
            />
            <Svg width={width} height={height} viewBox="0 0 300 400" style={{ position: 'absolute' }}>
              <Circle cx="150" cy="62" r="30" fill="none" stroke={colors.heroMuted} strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />
              <Rect x="110" y="102" width="80" height="120" rx="26" fill="none" stroke={colors.heroMuted} strokeWidth={2} strokeDasharray="6 6" opacity={0.45} />
              <Rect x="114" y="214" width="32" height="150" rx="14" fill="none" stroke={colors.heroMuted} strokeWidth={2} strokeDasharray="6 6" opacity={0.45} />
              <Rect x="154" y="214" width="32" height="150" rx="14" fill="none" stroke={colors.heroMuted} strokeWidth={2} strokeDasharray="6 6" opacity={0.45} />
            </Svg>

            {pieces.map((piece, i) => {
              const slot = SLOT[piece.category!]!;
              const f = flights[i];
              const fromLeft = i % 2 === 0;
              return (
                <Animated.View
                  key={piece.id}
                  style={{
                    position: 'absolute',
                    left: (slot.cx - slot.w / 2) * unit,
                    top: (slot.cy - slot.h / 2) * unit,
                    width: slot.w * unit,
                    height: slot.h * unit,
                    opacity: f.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                    transform: [
                      { translateX: f.interpolate({ inputRange: [0, 1], outputRange: [fromLeft ? -width : width, 0] }) },
                      { translateY: f.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.15, 0] }) },
                      { rotate: f.interpolate({ inputRange: [0, 1], outputRange: [fromLeft ? '-28deg' : '28deg', '0deg'] }) },
                      { scale: f.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 1.08, 1] }) },
                    ],
                  }}
                >
                  <Image
                    source={{ uri: piece.photo_clean_url ?? piece.photo_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </Animated.View>
              );
            })}

            {/* Scanning light */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 3,
                backgroundColor: colors.heroAccent,
                shadowColor: colors.heroAccent,
                shadowOpacity: 0.9,
                shadowRadius: 14,
                opacity: 0.85,
                transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [height * 0.05, height * 0.95] }) }],
              }}
            />

            <View style={{ position: 'absolute', left: spacing.md, top: spacing.md }}>
              <Text style={[typography.eyebrow, { color: colors.heroAccent }]}>WARDROBE AI</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 3,
            backgroundColor: colors.energy,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, minHeight: 92 }}>
        {kind ? <CompanionAvatar kind={kind} size={84} mood="thinking" /> : null}
        <View style={{ flex: 1, paddingBottom: spacing.md }}>
          <SpeechBubble text={lines[line] ?? t('tryon.generating')} />
        </View>
      </View>
    </View>
  );
}
