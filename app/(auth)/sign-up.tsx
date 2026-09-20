import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { spacing, typography, useTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

export default function SignUp() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert(t('auth.missingInfo'), t('auth.enterCredentials'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('auth.weakPassword'), t('auth.weakPasswordMsg'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.signUpFailed'), error);
      return;
    }
    Alert.alert(t('auth.almostThere'), t('auth.confirmEmailMsg'));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.screen, paddingTop: spacing.sm }}>
        <LanguageSwitch />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, padding: spacing.screen, justifyContent: 'center', gap: spacing.xl }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={[typography.h1, { color: colors.text }]}>{t('auth.signUpTitle')}</Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              {t('auth.signUpSubtitle')}
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
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
