import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

// Stacked top-to-bottom like a look, each piece in its own generous row.
const ROWS: { category: ClothingCategory; height: number }[] = [
  { category: 'jacket', height: 148 },
  { category: 'top', height: 156 },
  { category: 'bottom', height: 176 },
  { category: 'shoes', height: 104 },
];

// Light studio stage so both dark and light garments read well.
const STAGE = '#EFEEE9';
const STAGE_LINE = 'rgba(21,21,23,0.07)';
const INK_MUTED = '#8A8A84';

export function OutfitStudio({ current, counts, onPrevious, onNext }: OutfitStudioProps) {
  const { t } = useLocale();

  const rows = ROWS.filter((row) => counts[row.category] > 0);

  return (
    <View
      style={{
        borderRadius: 28,
        backgroundColor: STAGE,
        overflow: 'hidden',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
      }}
    >
      {rows.map((row, index) => (
        <GarmentRow
          key={row.category}
          height={row.height}
          item={current(row.category)}
          label={t(categoryKey(row.category))}
          canCycle={row.category === 'jacket' ? counts.jacket > 0 : counts[row.category] > 1}
          showDivider={index < rows.length - 1}
          onPrevious={() => onPrevious(row.category)}
          onNext={() => onNext(row.category)}
        />
      ))}

      {/* Grounding shadow under the look */}
      <View
        pointerEvents="none"
        style={{
          alignSelf: 'center',
          width: 190,
          height: 12,
          borderRadius: radius.full,
          backgroundColor: 'rgba(21,21,23,0.13)',
          transform: [{ scaleY: 0.4 }],
          marginTop: spacing.xs,
        }}
      />
    </View>
  );
}

function GarmentRow({
  item,
  label,
  height,
  canCycle,
  showDivider,
  onPrevious,
  onNext,
}: {
  item: Clothing | null;
  label: string;
  height: number;
  canCycle: boolean;
  showDivider: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', height }}>
        <Arrow direction="back" disabled={!canCycle} onPress={onPrevious} />

        <View style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {item ? (
            <Image
              source={{ uri: item.photo_clean_url ?? item.photo_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={180}
              cachePolicy="memory-disk"
            />
          ) : (
            <Text style={[typography.caption, { color: INK_MUTED }]}>—</Text>
          )}
        </View>

        <Arrow direction="forward" disabled={!canCycle} onPress={onNext} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: showDivider ? spacing.sm : 0,
        }}
      >
        <Text style={[typography.eyebrow, { color: INK_MUTED, fontSize: 9 }]}>{label}</Text>
      </View>

      {showDivider ? (
        <View style={{ height: 1, backgroundColor: STAGE_LINE, marginBottom: spacing.sm }} />
      ) : null}
    </View>
  );
}

function Arrow({
  direction,
  disabled,
  onPress,
}: {
  direction: 'back' | 'forward';
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
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled
          ? 'rgba(21,21,23,0.06)'
          : pressed
            ? colors.accent
            : 'rgba(21,21,23,0.9)',
        opacity: disabled ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.93 : 1 }],
      })}
    >
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={22}
        color={disabled ? INK_MUTED : '#F9F9F5'}
      />
    </Pressable>
  );
}
