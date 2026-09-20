import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { categoryKey } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { Clothing, ClothingCategory } from '@/lib/types';

interface OutfitStudioProps {
  current: (category: ClothingCategory) => Clothing | null;
  counts: Record<ClothingCategory, number>;
  onPrevious: (category: ClothingCategory) => void;
  onNext: (category: ClothingCategory) => void;
}

type SlotConfig = {
  category: ClothingCategory;
  top: number;
  imageTop: number;
  width: number;
  height: number;
  zIndex: number;
};

const SLOTS: SlotConfig[] = [
  { category: 'jacket', top: 112, imageTop: 98, width: 238, height: 182, zIndex: 8 },
  { category: 'top', top: 174, imageTop: 121, width: 215, height: 164, zIndex: 6 },
  { category: 'bottom', top: 303, imageTop: 250, width: 190, height: 178, zIndex: 4 },
  { category: 'shoes', top: 426, imageTop: 405, width: 205, height: 76, zIndex: 10 },
];

const PAPER = '#F1F1EC';
const PAPER_INK = '#151517';
const PAPER_MUTED = '#6F6F6A';

export function OutfitStudio({ current, counts, onPrevious, onNext }: OutfitStudioProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const stageWidth = Math.min(430, width - spacing.screen * 2);

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          width: stageWidth,
          height: 510,
          alignSelf: 'center',
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: PAPER,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {SLOTS.map((slot) => (
          <GarmentSlot
            key={slot.category}
            {...slot}
            item={current(slot.category)}
            count={counts[slot.category]}
            label={t(categoryKey(slot.category))}
            onPrevious={() => onPrevious(slot.category)}
            onNext={() => onNext(slot.category)}
          />
        ))}

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 14,
            alignSelf: 'center',
            width: 182,
            height: 14,
            borderRadius: radius.full,
            backgroundColor: 'rgba(21,21,23,0.18)',
            transform: [{ scaleY: 0.35 }],
          }}
        />
      </View>
    </View>
  );
}

function GarmentSlot({
  category,
  item,
  count,
  label,
  top,
  imageTop,
  width,
  height,
  zIndex,
  onPrevious,
  onNext,
}: SlotConfig & {
  item: Clothing | null;
  count: number;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const canCycle = category === 'jacket' ? count > 0 : count > 1;
  const imageStyle = Platform.OS === 'web' ? ({ mixBlendMode: 'multiply' } as any) : undefined;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top, left: 10, right: 10, height: 48, zIndex: 20 + zIndex }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 48,
          top: 13,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radius.full,
          backgroundColor: 'rgba(241,241,236,0.88)',
          zIndex: 30,
        }}
      >
        <Text style={[typography.eyebrow, { color: PAPER_MUTED, fontSize: 9 }]}>{label}</Text>
      </View>

      {item ? (
        <Image
          source={{ uri: item.photo_clean_url ?? item.photo_url }}
          resizeMode="contain"
          style={[
            {
              position: 'absolute',
              top: imageTop - top,
              alignSelf: 'center',
              width,
              height,
              zIndex,
            },
            imageStyle,
          ]}
        />
      ) : null}

      <ArrowButton
        direction="back"
        label={`${label} précédent`}
        disabled={!canCycle}
        onPress={onPrevious}
      />
      <ArrowButton
        direction="forward"
        label={`${label} suivant`}
        disabled={!canCycle}
        onPress={onNext}
      />
    </View>
  );
}

function ArrowButton({
  direction,
  label,
  disabled,
  onPress,
}: {
  direction: 'back' | 'forward';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        [direction === 'back' ? 'left' : 'right']: 0,
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled ? 'rgba(21,21,23,0.12)' : pressed ? colors.accent : PAPER_INK,
        opacity: disabled ? 0.45 : 1,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={21}
        color={disabled ? PAPER_MUTED : '#F9F9F5'}
      />
    </Pressable>
  );
}

