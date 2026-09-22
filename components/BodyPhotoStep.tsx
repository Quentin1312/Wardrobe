import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { pickFromLibrary, takePhoto } from '@/components/PhotoPicker';
import { Button } from '@/components/ui';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { aiCheckBodyPhoto, type BodyAiIssue } from '@/lib/bodyPhoto';
import { checkBodyPhoto, type BodyIssue } from '@/lib/photoQuality';

type Local = { status: 'idle' } | { status: 'checking' } | { status: 'done'; issues: BodyIssue[] };
type Phase = { kind: 'edit' } | { kind: 'saving' } | { kind: 'ai' } | { kind: 'aiIssues'; issues: BodyAiIssue[] };

const TIPS: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { icon: 'body-outline', key: 'body.tip1' },
  { icon: 'hand-left-outline', key: 'body.tip2' },
  { icon: 'shirt-outline', key: 'body.tip3' },
  { icon: 'watch-outline', key: 'body.tip5' },
  { icon: 'phone-portrait-outline', key: 'body.tip4' },
];

/**
 * The user's try-on photo: framing guide, tips, a free on-device check as soon
 * as the photo is taken, then an AI check once it is saved. The user can always
 * go on anyway: the checks advise, they never block.
 */
export function BodyPhotoStep({
  header,
  canSave = true,
  saveLabel,
  onSave,
  onFinish,
  onSkip,
}: {
  header?: ReactNode;
  canSave?: boolean;
  saveLabel: string;
  /** Uploads the photo (and anything else the screen saves). */
  onSave: (asset: ImagePickerAsset) => Promise<void>;
  /** Photo accepted (or kept anyway). */
  onFinish: () => void;
  onSkip?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
  const [local, setLocal] = useState<Local>({ status: 'idle' });
  const [phase, setPhase] = useState<Phase>({ kind: 'edit' });
  const run = useRef(0);

  function onPicked(a: ImagePickerAsset | null) {
    if (!a) return;
    setAsset(a);
    setPhase({ kind: 'edit' });
    const id = ++run.current;
    setLocal({ status: 'checking' });
    checkBodyPhoto(a.uri)
      .then((issues) => {
        if (id === run.current) setLocal(issues ? { status: 'done', issues } : { status: 'idle' });
      })
      .catch(() => {
        if (id === run.current) setLocal({ status: 'idle' });
      });
  }

  async function save() {
    if (!asset) return;
    setPhase({ kind: 'saving' });
    try {
      await onSave(asset);
    } catch (e: any) {
      setPhase({ kind: 'edit' });
      Alert.alert(t('onboarding.uploadFailed'), e?.message ?? t('onboarding.uploadFailedMsg'));
      return;
    }
    setPhase({ kind: 'ai' });
    const issues = await aiCheckBodyPhoto();
    // No verdict (no key, network…) never blocks the user.
    if (!issues || issues.length === 0) onFinish();
    else setPhase({ kind: 'aiIssues', issues });
  }

  const busy = phase.kind === 'saving' || phase.kind === 'ai';

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.eyebrow, { color: colors.accent }]}>{t('body.eyebrow')}</Text>
        <Text style={[typography.h1, { color: colors.text }]}>{t('body.title')}</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>{t('body.subtitle')}</Text>
      </View>

      {header}

      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' }}>
        <Pressable
          onPress={async () => onPicked(await takePhoto())}
          disabled={busy}
          style={{
            width: 168,
            aspectRatio: 3 / 4,
            borderRadius: radius.xl,
            backgroundColor: colors.surfaceAlt,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {asset ? (
            <Image source={{ uri: asset.uri }} style={{ width: '100%', height: '100%', opacity: busy ? 0.5 : 1 }} resizeMode="cover" />
          ) : (
            <Silhouette color={colors.textMuted} label={{ head: t('body.headHere'), feet: t('body.feetHere') }} />
          )}
          {busy ? <ActivityIndicator style={{ position: 'absolute' }} color={colors.accent} /> : null}
        </Pressable>
        <View style={{ flex: 1, gap: 10, justifyContent: 'center' }}>
          {TIPS.map((tip) => (
            <View key={tip.key} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <Ionicons name={tip.icon} size={16} color={colors.accent} style={{ marginTop: 2 }} />
              <Text style={[typography.small, { color: colors.text, flex: 1 }]}>{t(tip.key)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label={t('onboarding.takePhoto')} variant="ghost" disabled={busy} onPress={async () => onPicked(await takePhoto())} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('onboarding.choose')} variant="ghost" disabled={busy} onPress={async () => onPicked(await pickFromLibrary())} />
        </View>
      </View>

      {phase.kind === 'aiIssues' ? (
        <Verdict title={t('body.issuesTitle')} lines={phase.issues.map((i) => t(`body.ai.${i}`))}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button label={t('body.retake')} onPress={async () => onPicked(await takePhoto())} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={t('body.keepAnyway')} variant="ghost" onPress={onFinish} />
            </View>
          </View>
        </Verdict>
      ) : asset && local.status === 'checking' ? (
        <Text style={[typography.small, { color: colors.textMuted }]}>{t('body.checking')}</Text>
      ) : asset && local.status === 'done' && local.issues.length > 0 ? (
        <Verdict title={t('body.issuesTitle')} lines={local.issues.map((i) => t(`body.issue.${i}`))} hint={t('body.canContinue')} />
      ) : asset && local.status === 'done' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[typography.bodyStrong, { color: colors.success }]}>{t('body.localOk')}</Text>
        </View>
      ) : null}

      {phase.kind === 'ai' ? (
        <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>{t('body.aiChecking')}</Text>
      ) : null}

      {phase.kind !== 'aiIssues' ? (
        <Button label={saveLabel} onPress={save} loading={busy} disabled={!asset || !canSave || busy} />
      ) : null}
      {onSkip && phase.kind === 'edit' ? (
        <Pressable onPress={onSkip} hitSlop={8} style={{ alignSelf: 'center' }}>
          <Text style={[typography.caption, { color: colors.textMuted, textDecorationLine: 'underline' }]}>{t('body.skip')}</Text>
        </Pressable>
      ) : null}
      <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>{t('body.private')}</Text>
    </View>
  );
}

function Verdict({ title, lines, hint, children }: { title: string; lines: string[]; hint?: string; children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.danger,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
      </View>
      {lines.map((line) => (
        <Text key={line} style={[typography.small, { color: colors.text }]}>
          {line}
        </Text>
      ))}
      {hint ? <Text style={[typography.caption, { color: colors.textMuted }]}>{hint}</Text> : null}
      {children}
    </View>
  );
}

/** Dashed standing figure showing how to frame the shot. */
function Silhouette({ color, label }: { color: string; label: { head: string; feet: string } }) {
  const dash = { stroke: color, strokeWidth: 3, strokeDasharray: '7 6', fill: 'none' } as const;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 400">
      <Line x1="40" y1="22" x2="260" y2="22" stroke={color} strokeWidth={1.5} opacity={0.5} />
      <SvgText x="150" y="16" fontSize="14" fill={color} textAnchor="middle" opacity={0.8}>
        {label.head}
      </SvgText>
      <Circle cx="150" cy="62" r="30" {...dash} />
      <Rect x="110" y="102" width="80" height="120" rx="26" {...dash} />
      <Rect x="82" y="110" width="20" height="118" rx="10" {...dash} />
      <Rect x="198" y="110" width="20" height="118" rx="10" {...dash} />
      <Rect x="114" y="214" width="32" height="150" rx="14" {...dash} />
      <Rect x="154" y="214" width="32" height="150" rx="14" {...dash} />
      <Line x1="40" y1="378" x2="260" y2="378" stroke={color} strokeWidth={1.5} opacity={0.5} />
      <SvgText x="150" y="396" fontSize="14" fill={color} textAnchor="middle" opacity={0.8}>
        {label.feet}
      </SvgText>
    </Svg>
  );
}
