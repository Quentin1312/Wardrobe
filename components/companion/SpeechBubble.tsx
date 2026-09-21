import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

/** A speech bubble that types its text out, like the companion is talking. */
export function SpeechBubble({
  text,
  tail = 'left',
  speed = 24,
}: {
  text: string;
  /** Which side the little pointer sits on. */
  tail?: 'left' | 'bottom';
  speed?: number;
}) {
  const { colors } = useTheme();
  const [shown, setShown] = useState('');
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setShown('');
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }).start();

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, pop]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View style={{ opacity: pop, transform: [{ scale }], flexShrink: 1 }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Reserve the final height so the bubble doesn't grow while typing. */}
        <Text style={[typography.body, { color: 'transparent' }]}>{text}</Text>
        <Text
          style={[
            typography.body,
            { color: colors.text, position: 'absolute', top: spacing.sm + 2, left: spacing.md, right: spacing.md },
          ]}
        >
          {shown}
        </Text>
      </View>
      <View
        style={
          tail === 'left'
            ? {
                position: 'absolute',
                left: -6,
                top: 18,
                width: 12,
                height: 12,
                backgroundColor: colors.surface,
                borderLeftWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.border,
                transform: [{ rotate: '45deg' }],
              }
            : {
                position: 'absolute',
                bottom: -6,
                alignSelf: 'center',
                width: 12,
                height: 12,
                backgroundColor: colors.surface,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.border,
                transform: [{ rotate: '45deg' }],
              }
        }
      />
    </Animated.View>
  );
}
