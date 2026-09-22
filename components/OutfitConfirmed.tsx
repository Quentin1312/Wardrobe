import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { useCompanion } from '@/context/CompanionProvider';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { SpeechBubble } from '@/components/companion/SpeechBubble';
import { ShareLookButton } from '@/components/ShareLookButton';
import { companionReaction } from '@/lib/companion';
import type { Clothing } from '@/lib/types';

/** Celebrates locking in the look for today. */
export function OutfitConfirmed({
  visible,
  items,
  weather = null,
  onClose,
}: {
  visible: boolean;
  items: Clothing[];
  weather?: { temp: number; condition: string; main: string } | null;
  onClose: () => void;
}) {
  const { colors, dark } = useTheme();
  const { t, locale } = useLocale();
  const { kind: companion } = useCompanion();
  // One reaction per opening, not a new one on every render.
  const reaction = useMemo(
    () => (companion ? companionReaction(companion, 'validated', locale) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companion, locale, visible]
  );

  const check = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const cards = useMemo(
    () => items.map(() => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, visible]
  );

  useEffect(() => {
    if (!visible) return;
    check.setValue(0);
    ring.setValue(0);
    text.setValue(0);
    cards.forEach((c) => c.setValue(0));

    Animated.sequence([
      Animated.parallel([
        Animated.spring(check, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.stagger(
        90,
        cards.map((c) =>
          Animated.spring(c, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true })
        )
      ),
      Animated.timing(text, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [visible, check, ring, text, cards]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.35, 0] });

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

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.lg }}>
          {companion ? (
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <View style={{ maxWidth: 300 }}>
                <SpeechBubble text={reaction} tail="bottom" />
              </View>
              <View>
                <CompanionAvatar kind={companion} size={140} mood="happy" bounceKey={visible} />
                {/* Check badge on the companion */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 8,
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: colors.energy,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: check }],
                  }}
                >
                  <Ionicons name="checkmark" size={24} color={colors.energyText} />
                </Animated.View>
              </View>
            </View>
          ) : (
          /* Check with expanding ring */
          <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 92,
                height: 92,
                borderRadius: 46,
                borderWidth: 3,
                borderColor: colors.energy,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              }}
            />
            <Animated.View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.energy,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: check }],
              }}
            >
              <Ionicons name="checkmark" size={48} color={colors.energyText} />
            </Animated.View>
          </View>
          )}

          {/* The look */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {items.map((item, i) => {
              const driver = cards[i];
              if (!driver) return null;
              const translateY = driver.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
              return (
                <Animated.View
                  key={item.id}
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: radius.md,
                    backgroundColor: '#EFEEE9',
                    padding: 6,
                    opacity: driver,
                    transform: [{ translateY }, { scale: driver }],
                  }}
                >
                  <Image
                    source={{ uri: item.photo_clean_url ?? item.photo_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </Animated.View>
              );
            })}
          </View>

          <Animated.View style={{ alignItems: 'center', gap: 6, opacity: text }}>
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
              {t('outfitDay.confirmedTitle')}
            </Text>
            <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>
              {t('outfitDay.confirmedBody')}
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: text, alignSelf: 'stretch', paddingHorizontal: spacing.lg, gap: spacing.sm }}>
            {visible ? <ShareLookButton items={items} weather={weather} variant="pill" /> : null}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                minHeight: 54,
                borderRadius: radius.full,
                backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={[typography.button, { color: colors.primaryText }]}>
                {t('outfitDay.confirmedCta')}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
