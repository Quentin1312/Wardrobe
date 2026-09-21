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
  { category: 'top', height: 238 },
  { category: 'bottom', height: 276 },
  { category: 'shoes', height: 148 },
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
      {rows.map((row, index) => (
        <GarmentRow
          key={row.category}
          height={row.height}
          item={current(row.category)}
          label={t(categoryKey(row.category))}
          canCycle={counts[row.category] > 1}
          hideArrows={locked}
          showDivider={index < rows.length - 1}
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
  showDivider,
  onPrevious,
  onNext,
}: {
  item: Clothing | null;
  label: string;
  height: number;
  canCycle: boolean;
  hideArrows?: boolean;
  showDivider: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: colors.border,
        justifyContent: 'center',
      }}
    >
      <View style={{ height: '100%', paddingHorizontal: hideArrows ? spacing.lg : 52, paddingVertical: 10 }}>
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
            <Text style={[typography.caption, { color: colors.textMuted }]}>—</Text>
          </View>
        )}
      </View>

      <Text
        style={[
          typography.eyebrow,
          { color: colors.textMuted, fontSize: 9, position: 'absolute', left: spacing.md, top: spacing.md },
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
