import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';

const MACHINE = 200;
const DRUM = 124;

/** Washing-machine cycle played when the whole basket is washed. */
export function WashCycle({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { colors, dark } = useTheme();
  const { t } = useLocale();
  const [finished, setFinished] = useState(false);

  const spin = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const bubbles = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const done = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setFinished(false);
      return;
    }

    spin.setValue(0);
    done.setValue(0);
    setFinished(false);

    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true })
    );
    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 110, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 110, useNativeDriver: true }),
        Animated.delay(320),
      ])
    );
    const bubbleLoops = bubbles.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 260),
          Animated.timing(b, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(b, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    spinLoop.start();
    shakeLoop.start();
    bubbleLoops.forEach((l) => l.start());

    // Run the cycle, then reveal the clean state.
    const timer = setTimeout(() => {
      spinLoop.stop();
      shakeLoop.stop();
      bubbleLoops.forEach((l) => l.stop());
      setFinished(true);
      Animated.spring(done, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      setTimeout(onDone, 1200);
    }, 2600);

    return () => {
      clearTimeout(timer);
      spinLoop.stop();
      shakeLoop.stop();
      bubbleLoops.forEach((l) => l.stop());
    };
  }, [visible, spin, shake, bubbles, done, onDone]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  const doneScale = done.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <BlurView intensity={dark ? 40 : 60} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(11,11,12,0.74)' : 'rgba(242,242,238,0.84)' },
          ]}
        />

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Animated.View style={{ transform: [{ translateX }] }}>
            <View
              style={{
                width: MACHINE,
                height: MACHINE + 24,
                borderRadius: 26,
                backgroundColor: dark ? '#1E1D21' : '#E7E5DF',
                borderWidth: 1,
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                alignItems: 'center',
                paddingTop: 16,
              }}
            >
              {/* Control strip */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  alignSelf: 'stretch',
                  paddingHorizontal: 18,
                  marginBottom: 12,
                }}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.energy }} />
                <View
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                  }}
                />
              </View>

              {/* Porthole */}
              <View
                style={{
                  width: DRUM,
                  height: DRUM,
                  borderRadius: DRUM / 2,
                  backgroundColor: dark ? '#0E0E10' : '#FFFFFF',
                  borderWidth: 7,
                  borderColor: dark ? '#37363B' : '#CFCCC4',
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {finished ? (
                  <Animated.View style={{ transform: [{ scale: doneScale }] }}>
                    <Ionicons name="checkmark-circle" size={58} color={colors.success} />
                  </Animated.View>
                ) : (
                  <>
                    {/* Tumbling laundry */}
                    <Animated.View
                      style={{
                        width: DRUM,
                        height: DRUM,
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ rotate }],
                      }}
                    >
                      {[
                        { c: '#9BB7E8', x: -26, y: -14, r: '12deg' },
                        { c: '#E8B39B', x: 22, y: -20, r: '-18deg' },
                        { c: '#A9D6B4', x: -10, y: 22, r: '26deg' },
                        { c: '#D9D3C4', x: 26, y: 18, r: '-8deg' },
                      ].map((p, i) => (
                        <View
                          key={i}
                          style={{
                            position: 'absolute',
                            width: 34,
                            height: 26,
                            borderRadius: 9,
                            backgroundColor: p.c,
                            transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: p.r }],
                          }}
                        />
                      ))}
                    </Animated.View>

                    {/* Suds */}
                    {bubbles.map((b, i) => {
                      const ty = b.interpolate({ inputRange: [0, 1], outputRange: [40, -40] });
                      const op = b.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.9, 0.7, 0] });
                      return (
                        <Animated.View
                          key={i}
                          style={{
                            position: 'absolute',
                            left: 18 + i * 19,
                            width: 9 + (i % 3) * 3,
                            height: 9 + (i % 3) * 3,
                            borderRadius: 8,
                            backgroundColor: dark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)',
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.06)',
                            opacity: op,
                            transform: [{ translateY: ty }],
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </View>
            </View>
          </Animated.View>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
              {finished ? t('laundry.allClean') : t('laundry.washing')}
            </Text>
            {!finished ? (
              <View
                style={{
                  marginTop: spacing.xs,
                  width: 120,
                  height: 4,
                  borderRadius: radius.full,
                  backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={{
                    width: 46,
                    height: 4,
                    borderRadius: radius.full,
                    backgroundColor: colors.energy,
                    transform: [
                      { translateX: spin.interpolate({ inputRange: [0, 1], outputRange: [-46, 120] }) },
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
