import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
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
  /** Today's look is settled: show it, but don't let it be changed. */
  locked?: boolean;
}

// A shared silhouette gives the cut-outs one body and one perspective. This is
// intentionally a polished 2.5D lookboard rather than fake 3D rotation.
const STAGE_HEIGHT = 590;
const LAYERS: {
  category: ClothingCategory;
  top: number;
  height: number;
  width: `${number}%`;
  zIndex: number;
  shadowWidth: number;
}[] = [
  { category: 'bottom', top: 205, height: 278, width: '63%', zIndex: 2, shadowWidth: 120 },
  { category: 'top', top: 28, height: 238, width: '74%', zIndex: 3, shadowWidth: 170 },
  { category: 'shoes', top: 452, height: 116, width: '62%', zIndex: 4, shadowWidth: 190 },
];

// Mid-tone sand stage: both dark and light garments stay readable, and it
// never looks like a flat white sheet.
const STAGE_TOP = '#D3CDC2';
const STAGE_BOTTOM = '#B4AC9E';
const INK_MUTED = 'rgba(32,29,24,0.55)';

export function OutfitStudio({ current, counts, onPrevious, onNext, locked }: OutfitStudioProps) {
  const { t } = useLocale();
  const layers = LAYERS.filter((layer) =>
    locked ? current(layer.category) : counts[layer.category] > 0
  );

  return (
    <LinearGradient
      colors={[STAGE_TOP, STAGE_BOTTOM]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ height: STAGE_HEIGHT, borderRadius: 32, overflow: 'hidden' }}
    >
      {/* Quiet body/spotlight: the three cut-outs now read as one look. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)']}
        style={{
          position: 'absolute',
          top: 22,
          bottom: 24,
          left: '18%',
          right: '18%',
          borderRadius: 220,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.16)',
        }}
      />

      {layers.map((layer) => (
        <GarmentLayer
          key={layer.category}
          {...layer}
          item={current(layer.category)}
          label={t(categoryKey(layer.category))}
          canCycle={counts[layer.category] > 1}
          hideArrows={locked}
          onPrevious={() => onPrevious(layer.category)}
          onNext={() => onNext(layer.category)}
        />
      ))}

      {/* Grounding shadow under the look */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          bottom: 16,
          width: 210,
          height: 14,
          borderRadius: radius.full,
          backgroundColor: 'rgba(32,29,24,0.2)',
          transform: [{ scaleY: 0.4 }],
        }}
      />
    </LinearGradient>
  );
}

function GarmentLayer({
  item,
  label,
  top,
  height,
  width,
  zIndex,
  shadowWidth,
  canCycle,
  hideArrows,
  onPrevious,
  onNext,
}: {
  item: Clothing | null;
  label: string;
  top: number;
  height: number;
  width: `${number}%`;
  zIndex: number;
  shadowWidth: number;
  canCycle: boolean;
  hideArrows?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        height,
        zIndex,
        justifyContent: 'center',
      }}
    >
      <View style={{ width, height: '100%', alignSelf: 'center', justifyContent: 'center' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignSelf: 'center',
            bottom: 13,
            width: shadowWidth,
            height: 18,
            borderRadius: radius.full,
            backgroundColor: 'rgba(32,29,24,0.18)',
            transform: [{ scaleY: 0.38 }],
          }}
        />
        {item ? (
          <Image
            source={{ uri: item.photo_clean_url ?? item.photo_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            transition={240}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[typography.caption, { color: INK_MUTED }]}>—</Text>
          </View>
        )}
      </View>

      {/* Small studio annotation; arrows stay beside the actual garment. */}
      <Text
        style={[
          typography.eyebrow,
          { color: INK_MUTED, fontSize: 9, position: 'absolute', left: spacing.md, top: 8 },
        ]}
      >
        {label}
      </Text>

      {hideArrows ? null : (
        <>
          <Arrow side="left" disabled={!canCycle} onPress={onPrevious} />
          <Arrow side="right" disabled={!canCycle} onPress={onNext} />
        </>
      )}
    </View>
  );
}

function Arrow({
  side,
  disabled,
  onPress,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        [side]: 6,
        top: '50%',
        marginTop: -21,
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled
          ? 'rgba(32,29,24,0.08)'
          : pressed
            ? colors.accent
            : 'rgba(26,24,20,0.82)',
        opacity: disabled ? 0.4 : 1,
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      <Ionicons
        name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={22}
        color={disabled ? INK_MUTED : '#F7F5F0'}
      />
    </Pressable>
  );
}
