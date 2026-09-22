import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { COMPANION_ART, type CompanionKind } from '@/lib/companion';
import type { Shape } from '@/lib/companion/art';
import { accessoryLayers, type CompanionAccessory } from '@/lib/companion/accessories';

export type CompanionMood = 'idle' | 'happy' | 'thinking';

const CANVAS = 200;

/** Tail rhythm per personality: the dog wags, the cat swishes, the rabbit's cotton tail wiggles. */
const TAIL_MS: Record<CompanionKind, { idle: number; happy: number; amp: number }> = {
  dylan: { idle: 420, happy: 170, amp: 14 },
  miso: { idle: 1300, happy: 700, amp: 10 },
  noisette: { idle: 650, happy: 240, amp: 9 },
};

function renderShape(s: Shape, key: number) {
  if (s.t === 'ellipse') {
    return <Ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill} opacity={s.opacity} />;
  }
  if (s.t === 'circle') {
    return <Circle key={key} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity={s.opacity} />;
  }
  return (
    <Path
      key={key}
      d={s.d}
      fill={s.fill ?? 'none'}
      stroke={s.stroke}
      strokeWidth={s.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={s.opacity}
    />
  );
}

function Layer({ shapes, size }: { shapes: Shape[]; size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`} style={StyleSheet.absoluteFill}>
      {shapes.map(renderShape)}
    </Svg>
  );
}

/**
 * RN transforms rotate/scale around a view's centre. To pivot around another
 * point we shift there, apply the transform, and shift back.
 */
function around(px: number, py: number, size: number, inner: object[]) {
  const dx = ((px - CANVAS / 2) / CANVAS) * size;
  const dy = ((py - CANVAS / 2) / CANVAS) * size;
  return [{ translateX: dx }, { translateY: dy }, ...inner, { translateX: -dx }, { translateY: -dy }] as any;
}

export function CompanionAvatar({
  kind,
  size = 120,
  mood = 'idle',
  onPress,
  bounceKey,
  accessory,
}: {
  kind: CompanionKind;
  size?: number;
  mood?: CompanionMood;
  onPress?: () => void;
  /** Change this value to make the companion hop (e.g. when it speaks). */
  bounceKey?: unknown;
  /** Weather outfit: umbrella, beanie + scarf, scarf or sunglasses. */
  accessory?: CompanionAccessory | null;
}) {
  const art = COMPANION_ART[kind];
  const acc = useMemo(() => accessoryLayers(kind, accessory), [kind, accessory]);
  const unit = size / CANVAS;

  const breathe = useRef(new Animated.Value(0)).current;
  const tail = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;

  // Breathing: the body swells slightly, the head floats.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  // Tail, faster when happy.
  useEffect(() => {
    const ms = mood === 'happy' ? TAIL_MS[kind].happy : TAIL_MS[kind].idle;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tail, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(tail, { toValue: -1, duration: ms * 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(tail, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tail, kind, mood]);

  // Blinking at irregular intervals, sometimes twice.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const once = () =>
      Animated.sequence([
        Animated.timing(blink, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 0, duration: 110, useNativeDriver: true }),
      ]);
    const schedule = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        const seq = Math.random() < 0.25 ? Animated.sequence([once(), Animated.delay(90), once()]) : once();
        seq.start(() => alive && schedule());
      }, 2200 + Math.random() * 2800);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [blink]);

  // Head tilt while thinking.
  useEffect(() => {
    if (mood !== 'thinking') {
      Animated.spring(tilt, { toValue: 0, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tilt, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(tilt, { toValue: -0.4, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tilt, mood]);

  // Hop when poked / when it starts talking / when it becomes happy.
  const jump = () => {
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  };
  useEffect(() => {
    if (bounceKey !== undefined) jump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounceKey]);
  useEffect(() => {
    if (mood === 'happy') jump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  const styles = useMemo(() => {
    const amp = TAIL_MS[kind].amp;
    return {
      tail: around(art.tailPivot[0], art.tailPivot[1], size, [
        { rotate: tail.interpolate({ inputRange: [-1, 1], outputRange: [`-${amp}deg`, `${amp}deg`] }) },
      ]),
      body: around(100, 190, size, [
        { scaleY: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) },
      ]),
      head: [
        { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -2.5 * unit] }) },
        ...around(art.neck[0], art.neck[1], size, [
          { rotate: tilt.interpolate({ inputRange: [-1, 1], outputRange: ['8deg', '-10deg'] }) },
        ]),
      ],
      lids: around(100, art.lidTop, size, [
        { scaleY: blink.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] }) },
      ]),
      root: [{ translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -18 * unit] }) }],
    };
  }, [art, size, unit, kind, tail, breathe, tilt, blink, hop]);

  const content = (
    <Animated.View style={{ width: size, height: size, transform: styles.root }}>
      {acc.back.length ? <Layer shapes={acc.back} size={size} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: styles.tail }]}>
        <Layer shapes={art.tail} size={size} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: styles.body }]}>
        <Layer shapes={art.body} size={size} />
        {acc.neck.length ? <Layer shapes={acc.neck} size={size} /> : null}
        {acc.front.length ? <Layer shapes={acc.front} size={size} /> : null}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: styles.head }]}>
        <Layer shapes={art.head} size={size} />
        <Layer shapes={art.eyes} size={size} />
        <Animated.View style={[StyleSheet.absoluteFill, { transform: styles.lids }]}>
          <Layer shapes={art.lids} size={size} />
        </Animated.View>
        <Layer shapes={mood === 'happy' ? art.mouthHappy : art.mouthIdle} size={size} />
        {acc.head.length ? <Layer shapes={acc.head} size={size} /> : null}
      </Animated.View>
    </Animated.View>
  );

  if (!onPress) return <View pointerEvents="none">{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        jump();
        onPress();
      }}
      hitSlop={8}
    >
      {content}
    </Pressable>
  );
}
