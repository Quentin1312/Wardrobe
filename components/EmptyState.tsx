import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
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
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center' }}>
        {subtitle}
      </Text>
    </View>
  );
}
