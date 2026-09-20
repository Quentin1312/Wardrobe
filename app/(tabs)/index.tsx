import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';

export default function Today() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Today</Text>
        <Text style={{ fontSize: 15, color: colors.textMuted }}>
          Your daily outfit suggestions.
        </Text>
      </View>
      <EmptyState
        icon="sparkles-outline"
        title="No suggestions yet"
        subtitle="Add clothes to your wardrobe and we'll suggest outfits here."
      />
    </SafeAreaView>
  );
}
