import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: isPrimary
          ? pressed
            ? colors.primaryPressed
            : colors.primary
          : 'transparent',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.borderStrong,
        paddingVertical: 16,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        opacity: isDisabled ? 0.45 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.primaryText : colors.text} />
      ) : (
        <Text style={[typography.button, { color: isPrimary ? colors.primaryText : colors.text }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.eyebrow, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          typography.body,
          {
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: 14,
            color: colors.text,
            backgroundColor: colors.surfaceAlt,
            minHeight: 52,
          },
        ]}
        {...props}
      />
    </View>
  );
}
