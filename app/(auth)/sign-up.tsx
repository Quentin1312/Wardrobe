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

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error);
      return;
    }
    Alert.alert(
      'Almost there',
      'Check your inbox to confirm your email, then sign in. (Disable email confirmation in Supabase for instant access during dev.)'
    );
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
              Create account
            </Text>
            <Text style={{ fontSize: 16, color: colors.textMuted }}>
              Start building your virtual wardrobe.
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
              placeholder="At least 6 characters"
            />
            <Button label="Sign up" onPress={onSubmit} loading={loading} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs }}>
            <Text style={{ color: colors.textMuted }}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" style={{ color: colors.text, fontWeight: '700' }}>
              Sign in
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
