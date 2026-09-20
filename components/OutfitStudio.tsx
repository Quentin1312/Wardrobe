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
        <StudioGrid color={PAPER_MUTED} />

        <View
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 30,
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
              paddingHorizontal: 11,
              borderRadius: radius.full,
              backgroundColor: PAPER_INK,
            }}
          >
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.energy }} />
            <Text style={[typography.eyebrow, { color: '#F9F9F5' }]}>{t('outfitDay.studioLabel')}</Text>
          </View>
          <Text style={[typography.caption, { color: PAPER_MUTED }]}>{t('outfitDay.studioHint')}</Text>
        </View>

        <Silhouette color="#E1E1DA" accent={colors.accent} />

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

function StudioGrid({ color }: { color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.1 }}
    >
      {[25, 50, 75].map((left) => (
        <View
          key={`v-${left}`}
          style={{ position: 'absolute', left: `${left}%`, top: 0, bottom: 0, width: 1, backgroundColor: color }}
        />
      ))}
      {[25, 50, 75].map((top) => (
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
    <View pointerEvents="none" style={{ position: 'absolute', top: 65, alignSelf: 'center', alignItems: 'center', opacity: 0.5 }}>
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: color }} />
      <View style={{ width: 21, height: 20, backgroundColor: color, marginTop: -2 }} />
      <View
        style={{
          width: 144,
          height: 148,
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
        <View style={{ width: 48, height: 175, borderRadius: 28, backgroundColor: color, transform: [{ rotate: '2deg' }] }} />
        <View style={{ width: 48, height: 175, borderRadius: 28, backgroundColor: color, transform: [{ rotate: '-2deg' }] }} />
      </View>
    </View>
  );
}
