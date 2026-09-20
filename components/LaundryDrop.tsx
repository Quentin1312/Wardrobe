import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { Clothing } from '@/lib/types';

const BASKET_W = 190;
const BASKET_H = 120;

/** Garments tumbling into the laundry basket after a look has been worn. */
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

  // One driver per garment, plus a bounce for the basket.
  const drops = useMemo(
    () => items.map(() => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, visible]
  );
  const bounce = useRef(new Animated.Value(0)).current;
  const label = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || drops.length === 0) return;

    bounce.setValue(0);
    label.setValue(0);

    const falls = drops.map((driver, i) =>
      Animated.sequence([
        Animated.delay(i * 260),
        Animated.timing(driver, {
          toValue: 1,
          duration: 620,
          easing: Easing.bezier(0.5, 0, 0.75, 0.2),
          useNativeDriver: true,
        }),
        // Basket takes the hit
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 0, friction: 4, useNativeDriver: true }),
        ]),
      ])
    );

    const run = Animated.sequence([
      Animated.stagger(0, falls),
      Animated.timing(label, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.delay(700),
    ]);

    run.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => run.stop();
  }, [visible, drops, bounce, label, onDone]);

  const basketSquash = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <BlurView intensity={dark ? 40 : 60} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: dark ? 'rgba(11,11,12,0.72)' : 'rgba(242,242,238,0.82)' },
          ]}
        />

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* Falling garments */}
          <View style={{ width: BASKET_W, height: 250, alignItems: 'center', justifyContent: 'flex-end' }}>
            {items.map((item, i) => {
              const driver = drops[i];
              if (!driver) return null;
              const translateY = driver.interpolate({ inputRange: [0, 1], outputRange: [-210, 34] });
              const rotate = driver.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', i % 2 === 0 ? '26deg' : '-22deg'],
              });
              const scale = driver.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.9, 0.52] });
              const opacity = driver.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
              return (
                <Animated.View
                  key={item.id}
                  style={{
                    position: 'absolute',
                    width: 112,
                    height: 112,
                    opacity,
                    transform: [{ translateY }, { rotate }, { scale }],
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

          {/* Basket */}
          <Animated.View style={{ transform: [{ scaleY: basketSquash }] }}>
            <View
              style={{
                width: BASKET_W,
                height: BASKET_H,
                borderBottomLeftRadius: 26,
                borderBottomRightRadius: 26,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                backgroundColor: dark ? '#2A2722' : '#C9BFAE',
                overflow: 'hidden',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                paddingTop: 10,
              }}
            >
              {/* Weave */}
              {Array.from({ length: 7 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 6,
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 14,
                  backgroundColor: dark ? '#3A352D' : '#B7AC98',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              />
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              typography.h2,
              { color: colors.text, marginTop: spacing.lg, opacity: label },
            ]}
          >
            {t('laundry.sentToBasket')}
          </Animated.Text>
        </View>
      </View>
    </Modal>
  );
}
