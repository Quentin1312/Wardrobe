import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { categoryKey } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { Clothing, ClothingCategory } from '@/lib/types';

const LAYERS: ClothingCategory[] = ['jacket', 'top', 'bottom', 'shoes'];

interface OutfitStudioProps {
  current: (category: ClothingCategory) => Clothing | null;
  counts: Record<ClothingCategory, number>;
  onPrevious: (category: ClothingCategory) => void;
  onNext: (category: ClothingCategory) => void;
}

export function OutfitStudio({ current, counts, onPrevious, onNext }: OutfitStudioProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const stageWidth = Math.min(430, width - spacing.screen * 2);
  const orbit = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
        onPanResponderMove: (_, gesture) => {
          orbit.setValue(Math.max(-1, Math.min(1, gesture.dx / 150)));
        },
        onPanResponderRelease: () => {
          Animated.spring(orbit, {
            toValue: 0,
            friction: 7,
            tension: 55,
            useNativeDriver: true,
          }).start();
        },
      }),
    [orbit]
  );

  const rotateY = orbit.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '18deg'],
  });

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          width: stageWidth,
          height: 454,
          alignSelf: 'center',
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: colors.hero,
        }}
      >
        <StudioGrid color={colors.heroMuted} />

        <View
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 7,
              paddingHorizontal: 10,
              borderRadius: radius.full,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View
              style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.energy }}
            />
            <Text style={[typography.eyebrow, { color: colors.heroText }]}>LIVE STUDIO</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="move-outline" size={15} color={colors.heroMuted} />
            <Text style={[typography.caption, { color: colors.heroMuted }]}>glisse pour tourner</Text>
          </View>
        </View>

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: 'center',
            transform: [{ perspective: 900 }, { rotateY }],
          }}
        >
          <Silhouette color={colors.surfaceAlt} accent={colors.accent} />
          <GarmentLayer item={current('bottom')} top={222} width={190} height={150} zIndex={4} />
          <GarmentLayer item={current('top')} top={114} width={205} height={150} zIndex={6} />
          <GarmentLayer item={current('jacket')} top={105} width={225} height={176} zIndex={8} />
          <GarmentLayer item={current('shoes')} top={356} width={205} height={72} zIndex={10} />
        </Animated.View>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 13,
            alignSelf: 'center',
            width: 178,
            height: 18,
            borderRadius: radius.full,
            backgroundColor: 'rgba(0,0,0,0.3)',
            transform: [{ scaleY: 0.35 }],
          }}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: 1 }}
      >
        {LAYERS.map((category) => {
          const item = current(category);
          const isOptionalEmpty = category === 'jacket' && !item;
          return (
            <View
              key={category}
              style={{
                width: 148,
                padding: 10,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable
                  accessibilityLabel={`${t(categoryKey(category))} précédent`}
                  onPress={() => onPrevious(category)}
                  disabled={counts[category] < 2 && category !== 'jacket'}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
                </Pressable>
                <Text style={[typography.eyebrow, { color: colors.textMuted }]}>
                  {t(categoryKey(category))}
                </Text>
                <Pressable
                  accessibilityLabel={`${t(categoryKey(category))} suivant`}
                  onPress={() => onNext(category)}
                  disabled={counts[category] < 2 && category !== 'jacket'}
                  hitSlop={8}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              <View
                style={{
                  height: 82,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {item ? (
                  <Image
                    source={{ uri: item.photo_clean_url ?? item.photo_url }}
                    style={{ width: '92%', height: '92%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={{ alignItems: 'center', gap: 3 }}>
                    <Ionicons name="remove" size={20} color={colors.textMuted} />
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {isOptionalEmpty ? t('outfitDay.none') : '—'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function GarmentLayer({
  item,
  top,
  width,
  height,
  zIndex,
}: {
  item: Clothing | null;
  top: number;
  width: number;
  height: number;
  zIndex: number;
}) {
  if (!item) return null;
  return (
    <Image
      source={{ uri: item.photo_clean_url ?? item.photo_url }}
      resizeMode="contain"
      style={{ position: 'absolute', top, width, height, zIndex }}
    />
  );
}

function StudioGrid({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.12 }}>
      {[20, 40, 60, 80].map((left) => (
        <View
          key={`v-${left}`}
          style={{ position: 'absolute', left: `${left}%`, top: 0, bottom: 0, width: 1, backgroundColor: color }}
        />
      ))}
      {[20, 40, 60, 80].map((top) => (
        <View
          key={`h-${top}`}
          style={{ position: 'absolute', top: `${top}%`, left: 0, right: 0, height: 1, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

function Silhouette({ color, accent }: { color: string; accent: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 67, alignItems: 'center', opacity: 0.62 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color }} />
      <View style={{ width: 22, height: 22, backgroundColor: color, marginTop: -2 }} />
      <View
        style={{
          width: 142,
          height: 142,
          borderTopLeftRadius: 52,
          borderTopRightRadius: 52,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          backgroundColor: color,
          marginTop: -2,
          borderWidth: 1,
          borderColor: accent,
        }}
      />
      <View style={{ flexDirection: 'row', gap: 13, marginTop: -4 }}>
        <View style={{ width: 48, height: 164, borderRadius: 28, backgroundColor: color, transform: [{ rotate: '2deg' }] }} />
        <View style={{ width: 48, height: 164, borderRadius: 28, backgroundColor: color, transform: [{ rotate: '-2deg' }] }} />
      </View>
    </View>
  );
}
