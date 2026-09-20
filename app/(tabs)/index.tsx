import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/theme';
import { useWeather } from '@/hooks/useWeather';
import type { Weather } from '@/lib/weather';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function Today() {
  const { state, reload } = useWeather();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* Header */}
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 15, color: colors.textMuted, textTransform: 'capitalize' }}>
            {todayLabel()}
          </Text>
          <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>
            {greeting()} 👋
          </Text>
        </View>

        {/* Weather card */}
        {state.status === 'loading' ? (
          <View style={[cardStyle, { alignItems: 'center', paddingVertical: spacing.xl }]}>
            <ActivityIndicator color={colors.primaryText} />
            <Text style={{ color: colors.primaryText, marginTop: spacing.sm }}>
              Météo en cours…
            </Text>
          </View>
        ) : state.status === 'error' ? (
          <Pressable onPress={reload} style={[cardStyle, { gap: spacing.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="cloud-offline-outline" size={24} color={colors.primaryText} />
              <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16 }}>
                Météo indisponible
              </Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{state.message}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: spacing.xs }}>
              Toucher pour réessayer
            </Text>
          </Pressable>
        ) : (
          <WeatherCard weather={state.weather} />
        )}

        {/* Outfit suggestions section */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
            Tenues du jour
          </Text>
          <SuggestionsPlaceholder />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const cardStyle = {
  backgroundColor: colors.primary,
  borderRadius: radius.lg,
  padding: spacing.lg,
} as const;

function WeatherCard({ weather }: { weather: Weather }) {
  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' }}>
          {weather.city}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.sm,
        }}
      >
        <View>
          <Text style={{ color: colors.primaryText, fontSize: 56, fontWeight: '800', lineHeight: 60 }}>
            {weather.temp}°
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, textTransform: 'capitalize' }}>
            {weather.condition}
          </Text>
        </View>
        <Ionicons name={weather.icon} size={80} color={colors.primaryText} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.lg,
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.15)',
        }}
      >
        <WeatherStat label="Ressenti" value={`${weather.feelsLike}°`} />
        <WeatherStat label="Min" value={`${weather.tempMin}°`} />
        <WeatherStat label="Max" value={`${weather.tempMax}°`} />
      </View>
    </View>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
      <Text style={{ color: colors.primaryText, fontSize: 16, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function SuggestionsPlaceholder() {
  const router = useRouter();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="sparkles-outline" size={36} color={colors.textMuted} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
        Bientôt : tes tenues suggérées
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
        Ajoute des vêtements et on te proposera des tenues adaptées à la météo.
      </Text>
      <Pressable
        onPress={() => router.push('/(tabs)/wardrobe')}
        style={({ pressed }) => ({
          marginTop: spacing.xs,
          paddingVertical: 10,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: colors.primaryText, fontWeight: '700' }}>
          Remplir ma garde-robe
        </Text>
      </Pressable>
    </View>
  );
}
