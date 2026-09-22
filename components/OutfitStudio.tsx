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
  /** Today's look is settled: show it, but don't let it be changed. */
  locked?: boolean;
}

const ROWS: { category: ClothingCategory; height: number }[] = [
  { category: 'top', height: 200 },
  { category: 'bottom', height: 228 },
  { category: 'shoes', height: 118 },
];

export function OutfitStudio({ current, counts, onPrevious, onNext, locked }: OutfitStudioProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const rows = ROWS.filter((row) => (locked ? current(row.category) : counts[row.category] > 0));

  return (
    <View
      style={{
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {rows.map((row) => (
        <GarmentRow
          key={row.category}
          height={row.height}
          item={current(row.category)}
          label={t(categoryKey(row.category))}
          canCycle={counts[row.category] > 1}
          hideArrows={locked}
          onPrevious={() => onPrevious(row.category)}
          onNext={() => onNext(row.category)}
        />
      ))}
    </View>
  );
}

function GarmentRow({
  item,
  label,
  height,
  canCycle,
  hideArrows,
  onPrevious,
  onNext,
}: {
  item: Clothing | null;
  label: string;
  height: number;
  canCycle: boolean;
  hideArrows?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height,
        justifyContent: 'center',
      }}
    >
      <View style={{ height: '100%', paddingHorizontal: hideArrows ? spacing.lg : 52, paddingVertical: 2 }}>
        {item ? (
          <Image
            source={{ uri: item.photo_clean_url ?? item.photo_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            transition={240}
            cachePolicy="memory-disk"
            recyclingKey={item.id}
            priority="high"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>—</Text>
          </View>
        )}
      </View>

      <View style={{ position: 'absolute', left: spacing.md, top: spacing.sm, maxWidth: '45%' }} pointerEvents="none">
        <Text style={[typography.eyebrow, { color: colors.textMuted, fontSize: 9 }]}>{label}</Text>
        {item?.name ? (
          <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.text, fontSize: 13, lineHeight: 17 }]}>
            {item.name}
          </Text>
        ) : null}
      </View>

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
        backgroundColor: pressed ? colors.accent : colors.bg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        opacity: disabled ? 0.28 : 1,
      })}
    >
      <Ionicons
        name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={22}
        color={colors.text}
      />
    </Pressable>
  );
}
