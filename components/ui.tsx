import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

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
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: isPrimary ? colors.primary : 'transparent',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.border,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.primaryText : colors.primary} />
      ) : (
        <Text
          style={{
            color: isPrimary ? colors.primaryText : colors.text,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          fontSize: 16,
          color: colors.text,
          backgroundColor: colors.surface,
        }}
        {...props}
      />
    </View>
  );
}
