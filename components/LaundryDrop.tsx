import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { Clothing } from '@/lib/types';

const BASKET_W = 196;
const BASKET_H = 116;
const RIM_H = 20;
const DROP_FROM = -230;

/** Garments tumbling into the laundry basket and settling inside it. */
export function LaundryDrop({
  visible,
  items,
  onDone,
}: {
  visible: boolean;
  items: Clothing[];
  onDone: () => void;
}) {
  const { colors, dark } = useTheme();
  const { t } = useLocale();

  const drops = useMemo(
    () => items.map(() => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, visible]
  );
  const squash = useRef(new Animated.Value(0)).current;
  const label = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || drops.length === 0) return;

    squash.setValue(0);
    label.setValue(0);
    drops.forEach((d) => d.setValue(0));

    const falls = drops.map((driver, i) =>
      Animated.sequence([
        Animated.delay(i * 300),
        // Fall with a slight accelerate, then settle with a bounce.
        Animated.timing(driver, {
          toValue: 1,
          duration: 700,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(squash, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.spring(squash, { toValue: 0, friction: 3.5, useNativeDriver: true }),
        ]),
      ])
    );

    const run = Animated.sequence([
      Animated.parallel(falls),
      Animated.timing(label, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.delay(800),
    ]);

    run.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => run.stop();
  }, [visible, drops, squash, label, onDone]);

  const basketScaleY = squash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });

  const weave = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.4)';
  const basketBody = dark ? '#2C2822' : '#C6BBA8';
  const basketRim = dark ? '#3C362D' : '#B2A692';

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

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              width: BASKET_W,
              height: BASKET_H + RIM_H,
              transform: [{ scaleY: basketScaleY }],
            }}
          >
            {/* Back rim — garments fall in front of this */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: RIM_H,
                borderRadius: RIM_H,
                backgroundColor: basketRim,
              }}
            />

            {/* Garments settling inside */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {items.map((item, i) => {
                const driver = drops[i];
                if (!driver) return null;
                const translateY = driver.interpolate({
                  inputRange: [0, 1],
                  outputRange: [DROP_FROM, -14 - i * 9],
                });
                const translateX = driver.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, i === 0 ? -16 : i === 1 ? 14 : -4],
                });
                const rotate = driver.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', i % 2 === 0 ? '18deg' : '-16deg'],
                });
                const scale = driver.interpolate({ inputRange: [0, 1], outputRange: [1, 0.62] });
                return (
                  <Animated.View
                    key={item.id}
                    style={{
                      position: 'absolute',
                      width: 122,
                      height: 122,
                      transform: [{ translateY }, { translateX }, { rotate }, { scale }],
                    }}
                  >
                    <Image
                      source={{ uri: item.photo_clean_url ?? item.photo_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                      recyclingKey={item.id}
                    />
                  </Animated.View>
                );
              })}
            </View>

            {/* Basket front — sits over the garments so they look inside */}
            <View
              style={{
                position: 'absolute',
                top: RIM_H * 0.55,
                left: 0,
                right: 0,
                height: BASKET_H,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                backgroundColor: basketBody,
                overflow: 'hidden',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                paddingTop: 12,
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={{ width: 5, height: '100%', borderRadius: 3, backgroundColor: weave }} />
              ))}
              {/* horizontal weave bands */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 30,
                  height: 5,
                  backgroundColor: weave,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 66,
                  height: 5,
                  backgroundColor: weave,
                }}
              />
            </View>

            {/* Front rim lip */}
            <View
              style={{
                position: 'absolute',
                top: RIM_H * 0.55 - 7,
                left: -5,
                right: -5,
                height: 16,
                borderRadius: 10,
                backgroundColor: basketRim,
              }}
            />
          </Animated.View>

          {/* Ground shadow */}
          <View
            style={{
              width: BASKET_W * 0.8,
              height: 12,
              borderRadius: radius.full,
              backgroundColor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(21,21,23,0.16)',
              transform: [{ scaleY: 0.4 }],
              marginTop: 6,
            }}
          />

          <Animated.Text
            style={[typography.h2, { color: colors.text, marginTop: spacing.lg, opacity: label }]}
          >
            {t('laundry.sentToBasket')}
          </Animated.Text>
        </View>
      </View>
    </Modal>
  );
}
