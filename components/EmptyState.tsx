import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { spacing, typography, useTheme } from '@/constants/theme';

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.xl,
      }}
    >
      <Ionicons name={icon} size={44} color={colors.textMuted} />
      <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
        {subtitle}
      </Text>
    </View>
  );
}
