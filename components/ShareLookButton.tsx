import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCompanion } from '@/context/CompanionProvider';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { canDrawCard, prepareLookFile, shareLookFile, shareLookText, type ShareResult } from '@/lib/shareLook';
import type { Clothing } from '@/lib/types';

/**
 * "Share my look". The card is drawn as soon as the button shows up, so the
 * tap can hand it to the share sheet right away (iOS drops the share if the
 * gesture has to wait for images to load).
 */
export function ShareLookButton({
  items,
  weather,
  variant = 'ghost',
}: {
  items: Clothing[];
  weather: { temp: number; condition: string; main: string } | null;
  variant?: 'ghost' | 'pill';
}) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const { profile } = useAuth();
  const { kind } = useCompanion();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ShareResult | null>(null);
  const prepared = useRef<Promise<File> | null>(null);

  const input = {
    items,
    locale,
    t,
    firstName: profile?.first_name ?? null,
    weather,
    companion: kind,
  };
  const key = `${items.map((i) => i.id).join(',')}|${locale}|${kind}|${weather?.temp}|${profile?.first_name}`;

  useEffect(() => {
    setResult(null);
    if (!canDrawCard || items.length === 0) {
      prepared.current = null;
      return;
    }
    const job = prepareLookFile(input);
    job.catch(() => {});
    prepared.current = job;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function onShare() {
    if (busy || items.length === 0) return;
    setBusy(true);
    setResult(null);
    try {
      if (!canDrawCard) {
        setResult(await shareLookText(input));
        return;
      }
      const file = await (prepared.current ?? prepareLookFile(input));
      setResult(await shareLookFile(file, t('share.title')));
    } catch {
      setResult('failed');
    } finally {
      setBusy(false);
    }
  }

  const pill = variant === 'pill';
  const feedback =
    result === 'downloaded' ? t('share.downloaded') : result === 'failed' ? t('share.failed') : null;

  return (
    <View style={{ alignItems: 'center', gap: 6, alignSelf: pill ? 'stretch' : 'auto' }}>
      <Pressable
        onPress={onShare}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: pill ? 54 : 42,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: pressed ? colors.surfaceAlt : pill ? colors.surface : 'transparent',
          alignSelf: pill ? 'stretch' : 'auto',
        })}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Ionicons name="share-outline" size={18} color={colors.text} />
        )}
        <Text style={[pill ? typography.button : typography.caption, { color: colors.text }]}>
          {t('share.cta')}
        </Text>
      </Pressable>
      {feedback ? (
        <Text style={[typography.caption, { color: result === 'failed' ? colors.danger : colors.success }]}>
          {feedback}
        </Text>
      ) : null}
    </View>
  );
}
