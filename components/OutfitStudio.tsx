import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { categoryKey } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { useContentBox } from '@/lib/imageBox';
import type { Clothing, ClothingCategory } from '@/lib/types';

interface OutfitStudioProps {
  current: (category: ClothingCategory) => Clothing | null;
  counts: Record<ClothingCategory, number>;
  /** Accessories to choose from, shown as a row under the look. */
  accessories?: Clothing[];
  /** Those currently worn — several can be on at once (cap + glasses). */
  selectedAccessories?: Clothing[];
  onToggleAccessory?: (item: Clothing) => void;
  onPrevious: (category: ClothingCategory) => void;
  onNext: (category: ClothingCategory) => void;
  /** Today's look is settled: show it, but don't let it be changed. */
  locked?: boolean;
}

/**
 * Pieces are sized by the width of the garment itself (transparent margins
 * ignored), as a share of the card width, so a top and trousers keep believable
 * proportions whatever the photo. Bottoms hang from the waist line.
 */
const WIDTH = {
  top: 0.56,
  jacket: 0.58,
  layerBack: 0.44,
  layerFrontJacket: 0.54,
  layerFrontTop: 0.5,
  bottom: 0.4,
  shoes: 0.44,
};
/** How far the back layer peeks out on the left, as a share of the card width. */
const LAYER_SHIFT = 0.17;

/** Upper layers, from the skin outwards. */
export type Layer = 'top' | 'mid' | 'jacket';
const LAYERS: Layer[] = ['top', 'mid', 'jacket'];

const UPPER_H = 262;
/** Room kept free under the upper row's label and layer switch. */
const UPPER_INSET = 48;
const BOTTOM_H = 262;
const SHOES_H = 112;

export function OutfitStudio({
  current,
  counts,
  accessories = [],
  selectedAccessories,
  onToggleAccessory,
  onPrevious,
  onNext,
  locked,
}: OutfitStudioProps) {
  const { colors } = useTheme();
  const accessory = current('accessory');
  const worn = selectedAccessories ?? (accessory ? [accessory] : []);
  const [active, setActive] = useState<Layer>('top');
  // Worn upper layers, in wearing order; the switch offers what the wardrobe has.
  const wornLayers = LAYERS.map((layer) => ({ layer, item: current(layer) })).filter(
    (entry): entry is { layer: Layer; item: Clothing } => Boolean(entry.item)
  );
  const availableLayers = locked
    ? wornLayers.map((entry) => entry.layer)
    : LAYERS.filter((layer) => counts[layer] > 0);

  // Nothing of that kind in the wardrobe: the arrows go back to the top.
  useEffect(() => {
    if (counts[active] === 0 && active !== 'top') setActive('top');
  }, [counts, active]);

  const showBottom = locked ? Boolean(current('bottom')) : counts.bottom > 0;
  const showShoes = locked ? Boolean(current('shoes')) : counts.shoes > 0;
  const showAccessory = locked ? worn.length > 0 : counts.accessory > 0;

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
      <UpperRow
        pieces={wornLayers}
        active={active}
        available={availableLayers}
        canCycle={active === 'top' ? counts.top > 1 : counts[active] > 0}
        locked={locked}
        onSetActive={setActive}
        onPrevious={() => onPrevious(active)}
        onNext={() => onNext(active)}
      />

      {showBottom ? (
        <Row
          height={BOTTOM_H}
          category="bottom"
          item={current('bottom')}
          canCycle={counts.bottom > 1}
          locked={locked}
          onPrevious={() => onPrevious('bottom')}
          onNext={() => onNext('bottom')}
        >
          {(frame) => <FittedGarment item={current('bottom')} frame={frame} widthRatio={WIDTH.bottom} align="top" />}
        </Row>
      ) : null}

      {showShoes ? (
        <Row
          height={SHOES_H}
          category="shoes"
          item={current('shoes')}
          canCycle={counts.shoes > 1}
          locked={locked}
          onPrevious={() => onPrevious('shoes')}
          onNext={() => onNext('shoes')}
          labelLines={1}
          arrowBias={16}
        >
          {(frame) => <FittedGarment item={current('shoes')} frame={frame} widthRatio={WIDTH.shoes} />}
        </Row>
      ) : null}

      {showAccessory ? (
        <AccessoryPicker
          items={accessories}
          worn={worn}
          locked={locked}
          onToggle={onToggleAccessory ?? (() => onNext('accessory'))}
        />
      ) : null}
    </View>
  );
}

/**
 * Accessories as a row of thumbnails: tap one to wear it, tap it again to drop
 * it. Several can be worn at the same time (a cap and glasses, say).
 */
function AccessoryPicker({
  items,
  worn,
  locked,
  onToggle,
}: {
  items: Clothing[];
  worn: Clothing[];
  locked?: boolean;
  onToggle: (item: Clothing) => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const list = items.length > 0 ? items : worn;
  if (list.length === 0) return null;

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 10, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[typography.eyebrow, { color: colors.textMuted, fontSize: 9 }]}>{t('category.accessory')}</Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.text, flex: 1 }]}>
          {worn.length > 0
            ? worn.map((piece) => piece.name ?? t('category.accessory')).join(' · ')
            : t('outfitDay.none')}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: spacing.md }}>
        {list.map((item) => {
          const on = worn.some((piece) => piece.id === item.id);
          return (
            <Pressable
              key={item.id}
              disabled={locked}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.name ?? t('category.accessory')}
              onPress={() => onToggle(item)}
              style={({ pressed }) => ({
                width: 66,
                height: 66,
                borderRadius: radius.md,
                padding: 7,
                backgroundColor: on ? '#EFEEE9' : colors.surfaceAlt,
                borderWidth: on ? 2 : 1,
                borderColor: on ? colors.accent : colors.border,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Image
                source={{ uri: item.photo_clean_url ?? item.photo_url }}
                style={{ width: '100%', height: '100%', opacity: on ? 1 : 0.55 }}
                contentFit="contain"
                cachePolicy="memory-disk"
                recyclingKey={item.id}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type Frame = { w: number; h: number };

/** A slot of the studio: measures itself, then lets its garment fit inside. */
function Row({
  height,
  category,
  item,
  canCycle,
  locked,
  onPrevious,
  onNext,
  overlay,
  labelLines = 2,
  arrowBias = 0,
  children,
}: {
  height: number;
  category: ClothingCategory;
  item: Clothing | null;
  canCycle: boolean;
  locked?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  overlay?: ReactNode;
  labelLines?: number;
  /** Pushes the arrows down, away from a name on a short row. */
  arrowBias?: number;
  children: (frame: Frame) => ReactNode;
}) {
  const { t } = useLocale();
  const [frame, setFrame] = useState<Frame | null>(null);
  return (
    <View style={{ height }} onLayout={(e: LayoutChangeEvent) => setFrame(sizeOf(e))}>
      {frame ? children(frame) : null}
      <Label eyebrow={t(categoryKey(category))} name={item?.name ?? null} narrow lines={labelLines} />
      {overlay}
      {locked ? null : (
        <>
          <Arrow side="left" disabled={!canCycle} bias={arrowBias} onPress={onPrevious} />
          <Arrow side="right" disabled={!canCycle} bias={arrowBias} onPress={onNext} />
        </>
      )}
    </View>
  );
}

function sizeOf(e: LayoutChangeEvent): Frame {
  return { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
}

function UpperRow({
  pieces,
  active,
  available,
  canCycle,
  locked,
  onSetActive,
  onPrevious,
  onNext,
  overlay,
}: {
  /** The upper layers currently worn, in wearing order. */
  pieces: { layer: Layer; item: Clothing }[];
  active: Layer;
  /** Layers the wardrobe can offer (the switch only shows those). */
  available: Layer[];
  canCycle: boolean;
  locked?: boolean;
  onSetActive: (layer: Layer) => void;
  onPrevious: () => void;
  onNext: () => void;
  overlay?: ReactNode;
}) {
  const { t } = useLocale();
  const [frame, setFrame] = useState<Frame | null>(null);
  const [headerH, setHeaderH] = useState(UPPER_INSET);
  const activeEntry = pieces.find((piece) => piece.layer === active) ?? pieces[0] ?? null;
  const others = pieces.filter((piece) => piece !== activeEntry);
  const nameOf = (entry: { layer: Layer; item: Clothing }) => entry.item.name ?? t(categoryKey(entry.layer));

  // The layer being edited sits on the card axis; the others peek out behind,
  // spread left and right so a t-shirt + jumper + coat all stay readable.
  const spread = [-LAYER_SHIFT, LAYER_SHIFT, -LAYER_SHIFT * 1.8];
  const frontRatio = pieces.length >= 3 ? 0.46 : pieces.length === 2 ? 0.5 : WIDTH.top;
  const backRatio = pieces.length >= 3 ? 0.4 : WIDTH.layerBack;

  return (
    <View style={{ height: UPPER_H }} onLayout={(e: LayoutChangeEvent) => setFrame(sizeOf(e))}>
      {frame
        ? [
            ...others.map((entry, i) => (
              <FittedGarment
                key={entry.item.id}
                item={entry.item}
                frame={frame}
                widthRatio={backRatio}
                offsetX={frame.w * (spread[i] ?? -LAYER_SHIFT)}
                insetTop={headerH}
                dim
                onPress={locked ? undefined : () => onSetActive(entry.layer)}
              />
            )),
            activeEntry ? (
              <FittedGarment
                key={activeEntry.item.id}
                item={activeEntry.item}
                frame={frame}
                widthRatio={frontRatio}
                insetTop={headerH}
              />
            ) : (
              <FittedGarment key="empty" item={null} frame={frame} widthRatio={WIDTH.top} insetTop={headerH} />
            ),
          ]
        : null}

      <View
        onLayout={(e: LayoutChangeEvent) => setHeaderH(Math.ceil(e.nativeEvent.layout.height))}
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
        }}
      >
        <Label
          inline
          eyebrow={t(categoryKey(active))}
          name={activeEntry && activeEntry.layer === active ? nameOf(activeEntry) : t('outfitDay.none')}
          extra={others.length > 0 ? `+ ${others.map(nameOf).join(' + ')}` : null}
        />
        {available.length > 1 && !locked ? (
          <LayerSwitch active={active} available={available} onChange={onSetActive} />
        ) : null}
      </View>
      {overlay}
      {locked ? null : (
        <>
          <Arrow side="left" disabled={!canCycle} onPress={onPrevious} />
          <Arrow side="right" disabled={!canCycle} onPress={onNext} />
        </>
      )}
    </View>
  );
}

function Label({
  eyebrow,
  name,
  extra,
  narrow,
  lines = 2,
  inline,
}: {
  eyebrow: string;
  name: string | null;
  extra?: string | null;
  /** Beside a centred garment: keep clear of it. */
  narrow?: boolean;
  lines?: number;
  /** In a flex row rather than floating over the garments. */
  inline?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={
        inline
          ? { flex: 1, minWidth: 0 }
          : { position: 'absolute', left: spacing.md, top: spacing.sm, maxWidth: narrow ? '28%' : '46%' }
      }
    >
      <Text style={[typography.eyebrow, { color: colors.textMuted, fontSize: 9 }]}>{eyebrow}</Text>
      {name ? (
        <Text numberOfLines={lines} style={[typography.bodyStrong, { color: colors.text, fontSize: 13, lineHeight: 17 }]}>
          {name}
        </Text>
      ) : null}
      {extra ? (
        <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted, fontSize: 11 }]}>
          {extra}
        </Text>
      ) : null}
    </View>
  );
}

function LayerSwitch({
  active,
  available,
  onChange,
}: {
  active: Layer;
  available: Layer[];
  onChange: (layer: Layer) => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const ICONS: Record<Layer, keyof typeof Ionicons.glyphMap> = {
    top: 'shirt-outline',
    mid: 'shirt',
    jacket: 'shirt-outline',
  };
  const tab = (layer: Layer) => {
    const on = active === layer;
    return (
      <Pressable
        key={layer}
        onPress={() => onChange(layer)}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={t(categoryKey(layer))}
        hitSlop={4}
        style={{
          minHeight: 30,
          paddingHorizontal: on ? 9 : 7,
          borderRadius: radius.full,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: on ? colors.text : 'transparent',
        }}
      >
        {layer === 'jacket' ? (
          <JacketGlyph color={on ? colors.bg : colors.textMuted} />
        ) : (
          <Ionicons name={ICONS[layer]} size={13} color={on ? colors.bg : colors.textMuted} />
        )}
        {on ? (
          <Text style={[typography.caption, { color: colors.bg, fontSize: 11 }]}>{t(categoryKey(layer))}</Text>
        ) : null}
      </Pressable>
    );
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 3,
        gap: 2,
        borderRadius: radius.full,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {available.map(tab)}
    </View>
  );
}

/** Ionicons has no jacket: a small open-jacket glyph drawn by hand. */
function JacketGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M9 3 L12 6 L15 3 L20 5.5 L21.5 12 L18.5 12.8 L19 21 L5 21 L5.5 12.8 L2.5 12 L4 5.5 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M12 6 L12 21 M9 3 L12 9 L15 3" fill="none" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Draws a garment so that its visible part is `widthRatio` of the frame wide
 * (never taller than the frame), centred or hung from the top.
 */
function FittedGarment({
  item,
  frame,
  widthRatio,
  align = 'center',
  offsetX = 0,
  insetTop = 0,
  dim,
  onPress,
}: {
  item: Clothing | null;
  frame: Frame;
  widthRatio: number;
  align?: 'center' | 'top';
  offsetX?: number;
  /** Space reserved at the top of the frame (labels). */
  insetTop?: number;
  dim?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const uri = item ? item.photo_clean_url ?? item.photo_url : null;
  const box = useContentBox(uri);

  if (!item || !uri) {
    return (
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>—</Text>
      </View>
    );
  }

  const padY = 10;
  const top0 = insetTop + padY;
  const maxH = frame.h - top0 - padY;
  let rect: { left: number; top: number; width: number; height: number };
  let hit: { left: number; top: number; width: number; height: number };

  if (box) {
    const bw = box.w * box.width;
    const bh = box.h * box.height;
    let s = (frame.w * widthRatio) / bw;
    if (bh * s > maxH) s = maxH / bh;
    const cx = frame.w / 2 + offsetX;
    const cy = align === 'top' ? top0 + (bh * s) / 2 : top0 + maxH / 2;
    rect = {
      left: cx - (box.x * box.width + bw / 2) * s,
      top: cy - (box.y * box.height + bh / 2) * s,
      width: box.width * s,
      height: box.height * s,
    };
    hit = { left: cx - (bw * s) / 2, top: cy - (bh * s) / 2, width: bw * s, height: bh * s };
  } else {
    // Not measured (yet, or on native): plain fit in a box of the target width.
    const width = frame.w * widthRatio;
    rect = { left: frame.w / 2 + offsetX - width / 2, top: top0, width, height: maxH };
    hit = rect;
  }

  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', ...rect, opacity: box === undefined ? 0 : dim ? 0.82 : 1 }}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          contentPosition={align === 'top' ? 'top' : 'center'}
          transition={160}
          cachePolicy="memory-disk"
          recyclingKey={item.id}
          priority="high"
        />
      </View>
      {onPress ? (
        // Kept inside the frame: on web, focusing an element that pokes out of an
        // overflow-hidden card scrolls the whole card sideways.
        <Pressable accessibilityRole="button" onPress={onPress} style={{ position: 'absolute', ...clampTo(hit, frame) }} />
      ) : null}
    </>
  );
}

function clampTo(r: { left: number; top: number; width: number; height: number }, frame: Frame) {
  const left = Math.max(0, r.left);
  const top = Math.max(0, r.top);
  return {
    left,
    top,
    width: Math.max(0, Math.min(frame.w, r.left + r.width) - left),
    height: Math.max(0, Math.min(frame.h, r.top + r.height) - top),
  };
}

function Arrow({
  side,
  disabled,
  bias = 0,
  onPress,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  bias?: number;
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
        marginTop: -21 + bias,
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
      <Ionicons name={side === 'left' ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
    </Pressable>
  );
}
