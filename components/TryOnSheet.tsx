import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { FittingAnimation } from '@/components/FittingAnimation';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { TryOnResponse } from '@/lib/tryon';
import type { Clothing } from '@/lib/types';

/**
 * AI try-on. Tapping "Try it on" is the go-ahead: the render starts as soon as
 * the sheet opens, with an animated fitting while it cooks.
 */
export function TryOnSheet({
  visible,
  modelPhoto,
  items,
  onClose,
  onGenerate,
  onAddPhoto,
}: {
  visible: boolean;
  modelPhoto: string | null;
  /** Pieces that will be tried on (shown in the animation). */
  items: Clothing[];
  onClose: () => void;
  onGenerate: () => Promise<TryOnResponse>;
  /** Opens the try-on photo screen when the user has none yet. */
  onAddPhoto?: () => void;
}) {
  const { colors, dark } = useTheme();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reveal = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  const resultUrl = result?.url ?? null;
  const ready = Boolean(modelPhoto) && items.length > 0;

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    reveal.setValue(0);
    try {
      setResult(await onGenerate());
      Animated.spring(reveal, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('tryon.error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!visible) {
      started.current = false;
      setLoading(false);
      setResult(null);
      setError(null);
      return;
    }
    if (ready && !started.current) {
      started.current = true;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ready]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <View
          style={{
            maxHeight: '94%',
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            backgroundColor: colors.bg,
            padding: spacing.screen,
            ...shadows.sheet(dark),
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong }} />
          </View>
          <ScrollView contentContainerStyle={{ gap: spacing.lg, width: '100%', maxWidth: 520, alignSelf: 'center' }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>
                {loading ? t('tryon.generating') : t('tryon.title')}
              </Text>
              <Pressable
                accessibilityLabel={t('common.close')}
                onPress={onClose}
                hitSlop={10}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            {!ready ? (
              <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
                <Ionicons name="body-outline" size={56} color={colors.textMuted} />
                <Text style={[typography.body, { color: colors.text, textAlign: 'center' }]}>
                  {modelPhoto ? t('tryon.noPieces') : t('tryon.needPhoto')}
                </Text>
                {!modelPhoto && onAddPhoto ? (
                  <Pressable
                    onPress={onAddPhoto}
                    style={({ pressed }) => ({
                      minHeight: 52,
                      paddingHorizontal: spacing.lg,
                      borderRadius: radius.full,
                      backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                    })}
                  >
                    <Ionicons name="camera-outline" size={18} color={colors.primaryText} />
                    <Text style={[typography.button, { color: colors.primaryText }]}>{t('tryon.addPhoto')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : loading ? (
              <FittingAnimation items={items} />
            ) : resultUrl ? (
              <View style={{ gap: spacing.md }}>
                <Animated.View
                  style={{
                    opacity: reveal,
                    transform: [
                      { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                      { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                    ],
                  }}
                >
                  <Image
                    source={{ uri: resultUrl }}
                    resizeMode="cover"
                    style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: radius.xl, backgroundColor: colors.surfaceAlt }}
                  />
                </Animated.View>
                <Verdict result={result} />
                <Pressable
                  onPress={generate}
                  style={({ pressed }) => ({
                    minHeight: 48,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                  })}
                >
                  <Ionicons name="refresh" size={17} color={colors.text} />
                  <Text style={[typography.button, { color: colors.text }]}>{t('tryon.regenerate')}</Text>
                </Pressable>
              </View>
            ) : error ? (
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.surface }}>
                  <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
                  <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{error}</Text>
                </View>
                <Pressable
                  onPress={generate}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    borderRadius: radius.full,
                    backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                  })}
                >
                  <Ionicons name="refresh" size={18} color={colors.primaryText} />
                  <Text style={[typography.button, { color: colors.primaryText }]}>{t('tryon.regenerate')}</Text>
                </Pressable>
              </View>
            ) : (
              <ActivityIndicator color={colors.accent} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** What the automatic garment check concluded, shown as is. */
function Verdict({ result }: { result: TryOnResponse | null }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  if (!result) return null;
  const warnings = result.warnings ?? [];
  const skipped = result.skipped ?? [];

  const note =
    skipped.length > 0 ? (
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {t('tryon.skipped', { names: skipped.join(', ') })}
      </Text>
    ) : null;

  if (warnings.length > 0) {
    return (
      <View
        style={{
          gap: 6,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.danger,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
          <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('tryon.warningsTitle')}</Text>
        </View>
        {warnings.map((w) => (
          <Text key={w} style={[typography.small, { color: colors.text }]}>
            {`· ${w}`}
          </Text>
        ))}
        <Text style={[typography.caption, { color: colors.textMuted }]}>{t('tryon.warningsHint')}</Text>
        {note}
      </View>
    );
  }
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Ionicons
        name={result.verified ? 'shield-checkmark' : 'information-circle-outline'}
        size={19}
        color={result.verified ? colors.success : colors.textMuted}
      />
      <Text style={[typography.bodyStrong, { color: result.verified ? colors.text : colors.textMuted, flex: 1 }]}>
        {result.verified ? t('tryon.verified') : t('tryon.unchecked')}
      </Text>
      </View>
      {note}
    </View>
  );
}
