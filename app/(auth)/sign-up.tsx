import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { supabaseConfigured } from '@/lib/supabase';

export default function SignUp() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Alerts are invisible on the web build: say it on the page instead.
  const [message, setMessage] = useState<string | null>(
    supabaseConfigured ? null : t('auth.notConfigured')
  );

  async function onSubmit() {
    if (!email || !password) {
      setMessage(t('auth.enterCredentials'));
      return;
    }
    if (password.length < 6) {
      setMessage(t('auth.weakPasswordMsg'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(t('auth.confirmEmailMsg'));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', alignItems: 'flex-end', paddingHorizontal: spacing.screen, paddingTop: spacing.sm }}>
        <LanguageSwitch />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', padding: spacing.screen, justifyContent: 'center', gap: spacing.xl }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={[typography.eyebrow, { color: colors.accent }]}>BUILD YOUR DIGITAL CLOSET</Text>
            <Text style={[typography.h1, { color: colors.text }]}>{t('auth.signUpTitle')}</Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              {t('auth.signUpSubtitle')}
            </Text>
          </View>

          <View style={{ gap: spacing.md, padding: spacing.lg, borderRadius: 30, backgroundColor: colors.surface }}>
            <Field
              label={t('common.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Field
              label={t('common.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            {message ? (
              <Text style={[typography.small, { color: colors.danger }]}>{message}</Text>
            ) : null}
            <Button label={t('auth.signUp')} onPress={onSubmit} loading={loading} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs }}>
            <Text style={[typography.body, { color: colors.textMuted }]}>{t('auth.haveAccount')}</Text>
            <Link href="/(auth)/sign-in" style={[typography.bodyStrong, { color: colors.accent }]}>
              {t('auth.signIn')}
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
