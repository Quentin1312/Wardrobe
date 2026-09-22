import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export function OutfitStudio({ current, counts, onPrevious, onNext, locked }: OutfitStudioProps) {
  const { colors } = useTheme();
  const top = current('top');
  const jacket = current('jacket');
  const accessory = current('accessory');
  const [activeUpper, setActiveUpper] = useState<'top' | 'jacket'>('top');
  const [jacketVisible, setJacketVisible] = useState(true);
  const [accessoryVisible, setAccessoryVisible] = useState(true);

  useEffect(() => {
    if (jacket) setJacketVisible(true);
  }, [jacket]);

  useEffect(() => {
    if (accessory) setAccessoryVisible(true);
  }, [accessory]);

  const showJacketLayer = counts.jacket > 0 || Boolean(jacket);
  const showAccessoryLayer = counts.accessory > 0 || Boolean(accessory);

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
      <UpperLayers
        top={top}
        jacket={jacket}
        showJacketLayer={showJacketLayer}
        jacketVisible={jacketVisible}
        active={activeUpper}
        topCount={counts.top}
        jacketCount={counts.jacket}
        locked={locked}
        onSetActive={setActiveUpper}
        onToggleJacket={() => setJacketVisible((visible) => !visible)}
        onPrevious={() => onPrevious(activeUpper)}
        onNext={() => onNext(activeUpper)}
      />

      {(['bottom', 'shoes'] as ClothingCategory[])
        .filter((category) => (locked ? current(category) : counts[category] > 0))
        .map((category) => (
          <GarmentRow
            key={category}
            height={category === 'bottom' ? 228 : 118}
            item={current(category)}
            label={category}
            canCycle={counts[category] > 1}
            hideArrows={locked}
            onPrevious={() => onPrevious(category)}
            onNext={() => onNext(category)}
          />
        ))}

      {showAccessoryLayer ? (
        <AccessoryLayer
          item={accessory}
          visible={accessoryVisible}
          canCycle={counts.accessory > 0}
          hideArrows={locked}
          onToggle={() => setAccessoryVisible((visible) => !visible)}
          onPrevious={() => onPrevious('accessory')}
          onNext={() => onNext('accessory')}
        />
      ) : null}
    </View>
  );
}

function UpperLayers({
  top,
  jacket,
  showJacketLayer,
  jacketVisible,
  active,
  topCount,
  jacketCount,
  locked,
  onSetActive,
  onToggleJacket,
  onPrevious,
  onNext,
}: {
  top: Clothing | null;
  jacket: Clothing | null;
  showJacketLayer: boolean;
  jacketVisible: boolean;
  active: 'top' | 'jacket';
  topCount: number;
  jacketCount: number;
  locked?: boolean;
  onSetActive: (category: 'top' | 'jacket') => void;
  onToggleJacket: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const activeItem = active === 'top' ? top : jacket;
  const canCycle = active === 'top' ? topCount > 1 : jacketCount > 0;

  return (
    <View style={{ height: 252, justifyContent: 'center' }}>
      <View style={{ height: '100%', paddingHorizontal: locked ? spacing.lg : 48, paddingVertical: 8 }}>
        <GarmentImage item={top} />
        {jacket && jacketVisible ? (
          <View
            style={[StyleSheet.absoluteFill, { paddingHorizontal: locked ? spacing.lg : 48, paddingVertical: 8 }]}
            pointerEvents="none"
          >
            <GarmentImage item={jacket} />
          </View>
        ) : null}
      </View>

      <View style={{ position: 'absolute', left: spacing.md, top: spacing.sm, maxWidth: '48%' }} pointerEvents="none">
        <Text style={[typography.eyebrow, { color: colors.textMuted, fontSize: 9 }]}>
          {t(categoryKey(active))}
        </Text>
        <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.text, fontSize: 13, lineHeight: 17 }]}>
          {activeItem?.name ?? (active === 'jacket' ? t('outfitDay.none') : '')}
        </Text>
      </View>

      {jacket ? (
        <LayerEye visible={jacketVisible} label={t('category.jacket')} onPress={onToggleJacket} />
      ) : null}

      {showJacketLayer && !locked ? (
        <View
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            alignSelf: 'center',
            flexDirection: 'row',
            gap: 4,
            padding: 4,
            borderRadius: radius.full,
            backgroundColor: colors.bg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <LayerTab
            active={active === 'top'}
            icon="shirt-outline"
            label={t('category.top')}
            onPress={() => onSetActive('top')}
          />
          <LayerTab
            active={active === 'jacket'}
            icon="body-outline"
            label={t('category.jacket')}
            onPress={() => onSetActive('jacket')}
          />
        </View>
      ) : null}

      {locked ? null : (
        <>
          <Arrow side="left" disabled={!canCycle} onPress={onPrevious} />
          <Arrow side="right" disabled={!canCycle} onPress={onNext} />
        </>
      )}
    </View>
  );
}

function LayerTab({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 34,
        paddingHorizontal: 12,
        borderRadius: radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: active ? colors.text : 'transparent',
      }}
    >
      <Ionicons name={icon} size={15} color={active ? colors.bg : colors.textMuted} />
      <Text style={[typography.caption, { color: active ? colors.bg : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function LayerEye({ visible, label, onPress }: { visible: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t(visible ? 'outfitDay.hideLayer' : 'outfitDay.showLayer', { layer: label })}
      hitSlop={8}
      style={({ pressed }) => ({
        position: 'absolute',
        right: spacing.sm,
        top: spacing.sm,
        minHeight: 36,
        paddingHorizontal: 10,
        borderRadius: radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceAlt : colors.bg,
      })}
    >
      <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={17} color={colors.text} />
      <Text style={[typography.caption, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function AccessoryLayer({
  item,
  visible,
  canCycle,
  hideArrows,
  onToggle,
  onPrevious,
  onNext,
}: {
  item: Clothing | null;
  visible: boolean;
  canCycle: boolean;
  hideArrows?: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <View style={{ height: 116, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border }}>
      <View
        style={{ position: 'absolute', left: spacing.md, top: spacing.sm, maxWidth: '42%', zIndex: 2 }}
        pointerEvents="none"
      >
        <Text style={[typography.eyebrow, { color: colors.textMuted, fontSize: 9 }]}>{t('outfitDay.finalTouch')}</Text>
        <Text numberOfLines={2} style={[typography.bodyStrong, { color: colors.text, fontSize: 13, lineHeight: 17 }]}>
          {item?.name ?? t('outfitDay.none')}
        </Text>
      </View>

      <View style={{ height: '100%', paddingHorizontal: hideArrows ? spacing.lg : 54, paddingVertical: 5 }}>
        {item && visible ? (
          <GarmentImage item={item} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={visible ? 'sparkles-outline' : 'eye-off-outline'} size={25} color={colors.textMuted} />
          </View>
        )}
      </View>

      {item ? <LayerEye visible={visible} label={t('category.accessory')} onPress={onToggle} /> : null}
      {hideArrows ? null : (
        <>
          <Arrow side="left" disabled={!canCycle} onPress={onPrevious} />
          <Arrow side="right" disabled={!canCycle} onPress={onNext} />
        </>
      )}
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
  label: ClothingCategory;
  height: number;
  canCycle: boolean;
  hideArrows?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <View style={{ height, justifyContent: 'center' }}>
      <View style={{ height: '100%', paddingHorizontal: hideArrows ? spacing.lg : 52, paddingVertical: 2 }}>
        <GarmentImage item={item} />
      </View>

      <View style={{ position: 'absolute', left: spacing.md, top: spacing.sm, maxWidth: '45%' }} pointerEvents="none">
        <Text style={[typography.eyebrow, { color: colors.textMuted, fontSize: 9 }]}>{t(categoryKey(label))}</Text>
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

function GarmentImage({ item }: { item: Clothing | null }) {
  const { colors } = useTheme();
  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>—</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: item.photo_clean_url ?? item.photo_url }}
      style={{ width: '100%', height: '100%' }}
      contentFit="contain"
      transition={180}
      cachePolicy="memory-disk"
      recyclingKey={item.id}
      priority="high"
    />
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
