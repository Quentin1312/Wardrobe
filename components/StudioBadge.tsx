import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { radius, spacing, typography } from '@/constants/theme';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useStudioQueue } from '@/context/StudioQueueProvider';
import { useTheme } from '@/context/ThemeContext';

/**
 * Floating badge while the studio queue works: the companion, busy retouching
 * the pieces that were just added. It shows up on its own and leaves on its own.
 */
export function StudioBadge() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { kind } = useCompanion();
  const { pending, current } = useStudioQueue();
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: pending > 0 ? 1 : 0,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [pending, enter]);

  useEffect(() => {
    if (pending === 0) return;
    const loop = Animated.loop(
      Animated.timing(dots, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    );
    dots.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [pending, dots]);

  if (pending === 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: spacing.md,
        top: insets.top + spacing.sm,
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) },
          { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
        ],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 4,
          paddingRight: 14,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        {kind ? <CompanionAvatar kind={kind} size={42} mood="thinking" /> : null}
        <View>
          <Text style={[typography.caption, { color: colors.text, fontSize: 11 }]}>
            {t('studio.badge')}
            <Dots value={dots} />
          </Text>
          <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted, fontSize: 10, maxWidth: 140 }]}>
            {pending > 1 ? t('studio.badgeQueue', { count: pending }) : current ?? t('category.accessory')}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/** Three dots that fill in, one after the other. */
function Dots({ value }: { value: Animated.Value }) {
  return (
    <Text>
      {[0, 1, 2].map((i) => (
        <Animated.Text
          key={i}
          style={{
            opacity: value.interpolate({
              inputRange: [i / 3, (i + 1) / 3, 1],
              outputRange: [0.25, 1, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          .
        </Animated.Text>
      ))}
    </Text>
  );
}
