import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';

const STEP_KEYS = [
  'stylist.step1',
  'stylist.step2',
  'stylist.step3',
  'stylist.step4',
  'stylist.step5',
];

/** Full-screen "the stylist is thinking" overlay with rotating status lines. */
export function StylistLoader({ visible }: { visible: boolean }) {
  const { colors, dark } = useTheme();
  const { t } = useLocale();
  const [step, setStep] = useState(0);

  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // Rotate the status line while the request is in flight.
  useEffect(() => {
    if (!visible) {
      setStep(0);
      return;
    }
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
      setStep((s) => (s + 1) % STEP_KEYS.length);
    }, 1500);
    return () => clearInterval(id);
  }, [visible, fade]);

  // Breathing halo.
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.08] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <BlurView intensity={dark ? 40 : 60} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(11,11,12,0.72)' : 'rgba(242,242,238,0.8)' },
          ]}
        />

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
          <View style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 132,
                height: 132,
                borderRadius: 66,
                backgroundColor: colors.energy,
                opacity: haloOpacity,
                transform: [{ scale }],
              }}
            />
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: colors.energy,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="color-wand-outline" size={36} color={colors.energyText} />
            </View>
          </View>

          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
              {t('stylist.title')}
            </Text>
            <Animated.Text
              style={[
                typography.body,
                { color: colors.textMuted, opacity: fade, textAlign: 'center' },
              ]}
            >
              {t(STEP_KEYS[step])}
            </Animated.Text>
          </View>

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {STEP_KEYS.map((key, i) => (
              <View
                key={key}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: radius.full,
                  backgroundColor: i === step ? colors.energy : colors.borderStrong,
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
