import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';

const MACHINE_W = 214;
const DRUM = 138;
const CYCLE_MS = 3400;

const LAUNDRY = [
  { c: '#8FAEE6', w: 40, h: 30, x: -28, y: -16, r: '14deg' },
  { c: '#E7A98C', w: 34, h: 28, x: 26, y: -22, r: '-20deg' },
  { c: '#9FD3AE', w: 38, h: 26, x: -12, y: 24, r: '28deg' },
  { c: '#DCD5C4', w: 30, h: 24, x: 28, y: 20, r: '-10deg' },
  { c: '#C7B8E4', w: 26, h: 22, x: 2, y: -4, r: '40deg' },
];

/** Washing-machine cycle played when the basket is emptied. */
export function WashCycle({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { colors, dark } = useTheme();
  const { t } = useLocale();
  const [finished, setFinished] = useState(false);

  const spin = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const water = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const done = useRef(new Animated.Value(0)).current;
  const suds = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) {
      setFinished(false);
      return;
    }

    [spin, shake, water, wave, done].forEach((v) => v.setValue(0));
    suds.forEach((s) => s.setValue(0));
    setFinished(false);

    // Drum accelerates, then keeps a steady fast spin.
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    // Water fills the drum.
    const fill = Animated.timing(water, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    // Surface sloshes side to side.
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wave, { toValue: -1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 90, useNativeDriver: true }),
        Animated.delay(240),
      ])
    );
    const sudsLoops = suds.map((s, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 220),
          Animated.timing(s, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(s, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    fill.start();
    spinLoop.start();
    waveLoop.start();
    shakeLoop.start();
    sudsLoops.forEach((l) => l.start());

    const stopAll = () => {
      spinLoop.stop();
      waveLoop.stop();
      shakeLoop.stop();
      sudsLoops.forEach((l) => l.stop());
    };

    const timer = setTimeout(() => {
      stopAll();
      // Drain, then reveal the clean state.
      Animated.timing(water, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true })
        .start(() => {
          setFinished(true);
          Animated.spring(done, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
          setTimeout(onDone, 1250);
        });
    }, CYCLE_MS);

    return () => {
      clearTimeout(timer);
      stopAll();
    };
  }, [visible, spin, shake, water, wave, done, suds, onDone]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-3.5, 3.5] });
  const waterY = water.interpolate({ inputRange: [0, 1], outputRange: [DRUM * 0.62, DRUM * 0.18] });
  const waveX = wave.interpolate({ inputRange: [-1, 1], outputRange: [-14, 14] });
  const doneScale = done.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <BlurView intensity={dark ? 45 : 65} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(11,11,12,0.78)' : 'rgba(242,242,238,0.86)' },
          ]}
        />

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Animated.View style={{ transform: [{ translateX }] }}>
            <LinearGradient
              colors={dark ? ['#26252A', '#17161A'] : ['#F3F1EB', '#DEDBD3']}
              style={{
                width: MACHINE_W,
                height: MACHINE_W + 34,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                alignItems: 'center',
                paddingTop: 15,
              }}
            >
              {/* Control panel */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  alignSelf: 'stretch',
                  paddingHorizontal: 20,
                  marginBottom: 13,
                }}
              >
                <View
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 7,
                    backgroundColor: finished ? colors.success : colors.energy,
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }}
                />
                <View
                  style={{
                    width: 18,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)',
                  }}
                />
              </View>

              {/* Porthole */}
              <View
                style={{
                  width: DRUM + 16,
                  height: DRUM + 16,
                  borderRadius: (DRUM + 16) / 2,
                  backgroundColor: dark ? '#3A3940' : '#CBC7BE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: DRUM,
                    height: DRUM,
                    borderRadius: DRUM / 2,
                    backgroundColor: dark ? '#0D0D0F' : '#FBFAF7',
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Water */}
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: -20,
                      right: -20,
                      height: DRUM,
                      top: 0,
                      transform: [{ translateY: waterY }, { translateX: waveX }],
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(137,178,232,0.85)', 'rgba(104,150,214,0.95)']}
                      style={{ flex: 1, borderTopLeftRadius: 60, borderTopRightRadius: 60 }}
                    />
                  </Animated.View>

                  {/* Tumbling laundry */}
                  <Animated.View
                    style={{
                      width: DRUM,
                      height: DRUM,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ rotate }],
                      opacity: finished ? 0 : 1,
                    }}
                  >
                    {LAUNDRY.map((p, i) => (
                      <View
                        key={i}
                        style={{
                          position: 'absolute',
                          width: p.w,
                          height: p.h,
                          borderRadius: 10,
                          backgroundColor: p.c,
                          transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: p.r }],
                        }}
                      />
                    ))}
                  </Animated.View>

                  {/* Suds */}
                  {!finished
                    ? suds.map((s, i) => {
                        const ty = s.interpolate({ inputRange: [0, 1], outputRange: [50, -50] });
                        const op = s.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.95, 0.7, 0] });
                        const size = 8 + (i % 3) * 4;
                        return (
                          <Animated.View
                            key={i}
                            style={{
                              position: 'absolute',
                              left: 16 + i * 18,
                              width: size,
                              height: size,
                              borderRadius: size,
                              backgroundColor: 'rgba(255,255,255,0.92)',
                              borderWidth: 1,
                              borderColor: 'rgba(90,120,170,0.25)',
                              opacity: op,
                              transform: [{ translateY: ty }],
                            }}
                          />
                        );
                      })
                    : null}

                  {/* Clean */}
                  {finished ? (
                    <Animated.View style={{ transform: [{ scale: doneScale }] }}>
                      <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                    </Animated.View>
                  ) : null}

                  {/* Glass highlight */}
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 18,
                      width: 40,
                      height: 22,
                      borderRadius: 20,
                      backgroundColor: 'rgba(255,255,255,0.28)',
                      transform: [{ rotate: '-28deg' }],
                    }}
                  />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
              {finished ? t('laundry.allClean') : t('laundry.washing')}
            </Text>
            {!finished ? (
              <View
                style={{
                  width: 130,
                  height: 4,
                  borderRadius: radius.full,
                  backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={{
                    width: 50,
                    height: 4,
                    borderRadius: radius.full,
                    backgroundColor: colors.energy,
                    transform: [
                      { translateX: spin.interpolate({ inputRange: [0, 1], outputRange: [-50, 130] }) },
                    ],
                  }}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
