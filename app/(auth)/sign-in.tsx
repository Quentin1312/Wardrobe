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
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error);
    // On success the root auth gate redirects.
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: colors.text }}>
              Wardrobe
            </Text>
            <Text style={{ fontSize: 16, color: colors.textMuted }}>
              Your personal styling assistant.
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <Button label="Sign in" onPress={onSubmit} loading={loading} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs }}>
            <Text style={{ color: colors.textMuted }}>No account?</Text>
            <Link href="/(auth)/sign-up" style={{ color: colors.text, fontWeight: '700' }}>
              Create one
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
