import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { TryOnResponse } from '@/lib/tryon';

export function TryOnSheet({
  visible,
  modelPhoto,
  garmentCount,
  onClose,
  onGenerate,
}: {
  visible: boolean;
  modelPhoto: string | null;
  garmentCount: number;
  onClose: () => void;
  onGenerate: () => Promise<TryOnResponse>;
}) {
  const { colors, dark } = useTheme();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const resultUrl = result?.url ?? null;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      setResult(null);
      setError(null);
    }
  }, [visible]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setResult(await onGenerate());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('tryon.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <View
          style={{
            maxHeight: '92%',
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
          <ScrollView contentContainerStyle={{ gap: spacing.lg }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[typography.eyebrow, { color: colors.accent }]}>WARDROBE AI</Text>
                <Text style={[typography.h2, { color: colors.text }]}>{t('tryon.title')}</Text>
              </View>
              <Pressable
                accessibilityLabel={t('common.close')}
                onPress={onClose}
                hitSlop={10}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            {resultUrl ? (
              <View style={{ gap: spacing.md }}>
                <Image
                  source={{ uri: resultUrl }}
                  resizeMode="cover"
                  style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.xl, backgroundColor: colors.surfaceAlt }}
                />
                <Verdict result={result} />
                {error ? (
                  <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accentSoft }}>
                    <Text style={[typography.small, { color: colors.text }]}>{error}</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={generate}
                  disabled={loading}
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
                    opacity: loading ? 0.5 : 1,
                  })}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons name="refresh" size={17} color={colors.text} />
                  )}
                  <Text style={[typography.button, { color: colors.text }]}>{t('tryon.regenerate')}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View
                  style={{
                    minHeight: 260,
                    borderRadius: radius.xl,
                    overflow: 'hidden',
                    backgroundColor: colors.hero,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {modelPhoto ? (
                    <Image source={{ uri: modelPhoto }} resizeMode="cover" style={{ width: '100%', height: 300, opacity: loading ? 0.34 : 0.72 }} />
                  ) : (
                    <Ionicons name="person-outline" size={82} color={colors.heroMuted} />
                  )}
                  {loading ? (
                    <View style={{ position: 'absolute', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg }}>
                      <ActivityIndicator size="large" color={colors.energy} />
                      <Text style={[typography.bodyStrong, { color: colors.heroText, textAlign: 'center' }]}>
                        {t('tryon.generating')}
                      </Text>
                      <Text style={[typography.small, { color: colors.heroMuted, textAlign: 'center' }]}>
                        {t('tryon.generatingHint')}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ gap: spacing.sm }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {t('tryon.pieces', { count: garmentCount })}
                  </Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>{t('tryon.privacy')}</Text>
                </View>

                {error ? (
                  <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accentSoft }}>
                    <Text style={[typography.small, { color: colors.text }]}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={generate}
                  disabled={loading || !modelPhoto || garmentCount === 0}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    borderRadius: radius.full,
                    backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                    opacity: loading || !modelPhoto || garmentCount === 0 ? 0.4 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                  })}
                >
                  <Ionicons name="body-outline" size={19} color={colors.energy} />
                  <Text style={[typography.button, { color: colors.primaryText }]}>{t('tryon.consent')}</Text>
                </Pressable>
                {!modelPhoto ? (
                  <Text style={[typography.caption, { color: colors.danger, textAlign: 'center' }]}>
                    {t('tryon.needPhoto')}
                  </Text>
                ) : null}
              </>
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
      </View>
    );
  }
  return (
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
  );
}
