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
}

// Jackets are intentionally left out for now — they read badly stacked.
const ROWS: { category: ClothingCategory; height: number }[] = [
  { category: 'top', height: 206 },
  { category: 'bottom', height: 228 },
  { category: 'shoes', height: 132 },
];

// Mid-tone sand stage: both dark and light garments stay readable, and it
// never looks like a flat white sheet.
const STAGE_TOP = '#D3CDC2';
const STAGE_BOTTOM = '#B4AC9E';
const INK_MUTED = 'rgba(32,29,24,0.55)';

// Arrows float over the stage so the garments get the full width.
const ARROW_GUTTER = 52;

export function OutfitStudio({ current, counts, onPrevious, onNext }: OutfitStudioProps) {
  const { t } = useLocale();
  const rows = ROWS.filter((row) => counts[row.category] > 0);

  return (
    <LinearGradient
      colors={[STAGE_TOP, STAGE_BOTTOM]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ borderRadius: 28, overflow: 'hidden', paddingVertical: spacing.lg }}
    >
      {rows.map((row) => (
        <GarmentRow
          key={row.category}
          height={row.height}
          item={current(row.category)}
          label={t(categoryKey(row.category))}
          canCycle={counts[row.category] > 1}
          onPrevious={() => onPrevious(row.category)}
          onNext={() => onNext(row.category)}
        />
      ))}

      {/* Grounding shadow under the look */}
      <View
        pointerEvents="none"
        style={{
          alignSelf: 'center',
          width: 210,
          height: 14,
          borderRadius: radius.full,
          backgroundColor: 'rgba(32,29,24,0.16)',
          transform: [{ scaleY: 0.4 }],
          marginTop: spacing.sm,
        }}
      />
    </LinearGradient>
  );
}

function GarmentRow({
  item,
  label,
  height,
  canCycle,
  onPrevious,
  onNext,
}: {
  item: Clothing | null;
  label: string;
  height: number;
  canCycle: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={{ height, justifyContent: 'center' }}>
      {/* Garment takes the full stage width */}
      <View style={{ paddingHorizontal: ARROW_GUTTER, height: '100%' }}>
        {item ? (
          <Image
            source={{ uri: item.photo_clean_url ?? item.photo_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[typography.caption, { color: INK_MUTED }]}>—</Text>
          </View>
        )}
      </View>

      {/* Label sits discreetly bottom-left of the row */}
      <Text
        style={[
          typography.eyebrow,
          { color: INK_MUTED, fontSize: 9, position: 'absolute', left: spacing.md, bottom: 4 },
        ]}
      >
        {label}
      </Text>

      <Arrow side="left" disabled={!canCycle} onPress={onPrevious} />
      <Arrow side="right" disabled={!canCycle} onPress={onNext} />
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
