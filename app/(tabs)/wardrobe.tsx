import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';

export default function Wardrobe() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Wardrobe</Text>
        <Text style={{ fontSize: 15, color: colors.textMuted }}>
          Every item you own, in one place.
        </Text>
      </View>
      <EmptyState
        icon="shirt-outline"
        title="Your wardrobe is empty"
        subtitle="Photograph your clothes to start building your virtual wardrobe."
      />
    </SafeAreaView>
  );
}
