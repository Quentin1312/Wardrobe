import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { radius, spacing, typography } from '@/constants/theme';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { generateStudioPhoto, setClothingCleanPhoto } from '@/lib/clothes';
import type { Clothing } from '@/lib/types';

type Step =
  | { kind: 'intro' }
  | { kind: 'working' }
  | { kind: 'result'; url: string }
  | { kind: 'error'; message: string };

/**
 * AI "studio render": the same piece, smoothed and shot like a product photo.
 * The user always compares before/after and keeps whichever they prefer.
 */
export function StudioSheet({
  visible,
  item,
  onClose,
  onKept,
}: {
  visible: boolean;
  item: Clothing;
  onClose: () => void;
  onKept: (url: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { kind: companion } = useCompanion();
  const [step, setStep] = useState<Step>({ kind: 'intro' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setStep({ kind: 'intro' });
  }, [visible]);

  async function run() {
    setStep({ kind: 'working' });
    const res = await generateStudioPhoto(item.id);
    if (res.url) setStep({ kind: 'result', url: res.url });
    else setStep({ kind: 'error', message: friendlyError(res.error, t) });
  }

  async function keepStudio(url: string) {
    setSaving(true);
    try {
      await setClothingCleanPhoto(item.id, url);
      onKept(url);
      onClose();
    } catch (e: any) {
      setStep({ kind: 'error', message: e?.message ?? t('common.error') });
    } finally {
      setSaving(false);
    }
  }

  const before = item.photo_clean_url ?? item.photo_url;
  const busy = step.kind === 'working';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={busy ? undefined : onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={busy ? undefined : onClose} />
      <View
        style={{
          maxHeight: '92%',
          backgroundColor: colors.bg,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            width: '100%',
            maxWidth: 620,
            alignSelf: 'center',
            padding: spacing.screen,
            paddingBottom: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.h2, { color: colors.text }]}>{t('studio.title')}</Text>
            {!busy ? (
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {step.kind === 'result' ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Shot label={t('studio.before')} uri={before} />
              <Shot label={t('studio.after')} uri={step.url} highlight />
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 180, height: 180, borderRadius: radius.lg, backgroundColor: '#EFEEE9', padding: spacing.sm }}>
                <Image source={{ uri: before }} style={{ width: '100%', height: '100%', opacity: busy ? 0.5 : 1 }} contentFit="contain" />
                {busy && companion ? (
                  <View style={{ position: 'absolute', right: -24, bottom: -18 }}>
                    <CompanionAvatar kind={companion} size={96} mood="thinking" />
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {step.kind === 'intro' ? (
            <>
              <Text style={[typography.body, { color: colors.text }]}>{t('studio.intro')}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('studio.note')}</Text>
              <Cta label={t('studio.run')} icon="color-wand-outline" onPress={run} />
            </>
          ) : null}

          {step.kind === 'working' ? (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('studio.working')}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('studio.workingHint')}</Text>
            </View>
          ) : null}

          {step.kind === 'result' ? (
            <>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('studio.compare')}</Text>
              <Cta label={t('studio.keepStudio')} icon="checkmark" onPress={() => keepStudio(step.url)} loading={saving} />
              <Cta label={t('studio.keepOriginal')} onPress={onClose} ghost />
              <Pressable onPress={run} hitSlop={8} style={{ alignSelf: 'center' }}>
                <Text style={[typography.caption, { color: colors.textMuted, textDecorationLine: 'underline' }]}>
                  {t('studio.retry')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {step.kind === 'error' ? (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  backgroundColor: colors.surface,
                }}
              >
                <Ionicons name="alert-circle-outline" size={19} color={colors.danger} />
                <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{step.message}</Text>
              </View>
              <Cta label={t('studio.retry')} onPress={run} />
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function friendlyError(error: string | undefined, t: (k: string) => string): string {
  if (!error) return t('common.error');
  if (/OPENAI_API_KEY/.test(error)) return t('studio.noKey');
  if (/safety|moderation|rejected/i.test(error)) return t('studio.refused');
  return `${t('studio.failed')} (${error})`;
}

function Shot({ label, uri, highlight }: { label: string; uri: string; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <View
        style={{
          aspectRatio: 1,
          borderRadius: radius.lg,
          backgroundColor: '#EFEEE9',
          padding: spacing.sm,
          borderWidth: 2,
          borderColor: highlight ? colors.accent : 'transparent',
        }}
      >
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={200} />
      </View>
      <Text style={[typography.eyebrow, { color: highlight ? colors.accent : colors.textMuted, textAlign: 'center' }]}>
        {label}
      </Text>
    </View>
  );
}

function Cta({
  label,
  icon,
  onPress,
  ghost,
  loading,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  ghost?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const fg = ghost ? colors.text : colors.primaryText;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: ghost ? 1 : 0,
        borderColor: colors.borderStrong,
        backgroundColor: ghost
          ? pressed
            ? colors.surfaceAlt
            : 'transparent'
          : pressed
            ? colors.primaryPressed
            : colors.primary,
        opacity: loading ? 0.6 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[typography.button, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}
