import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutfitCard } from '@/components/OutfitCard';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useWeather } from '@/hooks/useWeather';
import {
  clothesMap,
  fetchTodayOutfits,
  generateOutfits,
  setOutfitLiked,
  type SuggestedOutfit,
} from '@/lib/outfits';
import type { Clothing } from '@/lib/types';
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
  const { session } = useAuth();
  const { state } = useWeather();
  const [outfits, setOutfits] = useState<SuggestedOutfit[]>([]);
  const [clothes, setClothes] = useState<Map<string, Clothing>>(new Map());
  const [generating, setGenerating] = useState(false);

  const weather = state.status === 'ready' ? state.weather : null;

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      try {
        const [today, map] = await Promise.all([
          fetchTodayOutfits(session.user.id),
          clothesMap(session.user.id),
        ]);
        setOutfits(today);
        setClothes(map);
      } catch {
        // Non-fatal on the home screen.
      }
    })();
  }, [session]);

  const onGenerate = useCallback(async () => {
    if (!session?.user) return;
    setGenerating(true);
    try {
      const map = await clothesMap(session.user.id);
      setClothes(map);
      const w = weather ? { temp: weather.temp, condition: weather.condition } : null;
      const { outfits: fresh, error } = await generateOutfits(w);
      if (error === 'not_enough_items') {
        Alert.alert('Garde-robe trop petite', 'Ajoute au moins 2 vêtements pour générer des tenues.');
      } else if (error) {
        Alert.alert('Oups', error);
      } else {
        setOutfits((prev) => [...fresh, ...prev]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Génération impossible.');
    } finally {
      setGenerating(false);
    }
  }, [session, weather]);

  async function rate(id: string, liked: boolean) {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    try {
      await setOutfitLiked(id, liked);
    } catch {
      // Optimistic — ignore failures for now.
    }
  }

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

        {/* Weather */}
        {state.status === 'loading' ? (
          <View style={[cardStyle, { alignItems: 'center', paddingVertical: spacing.xl }]}>
            <ActivityIndicator color={colors.primaryText} />
          </View>
        ) : state.status === 'ready' ? (
          <WeatherCard weather={state.weather} />
        ) : (
          <View style={[cardStyle, { gap: spacing.xs }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="cloud-offline-outline" size={22} color={colors.primaryText} />
              <Text style={{ color: colors.primaryText, fontWeight: '700' }}>Météo indisponible</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{state.message}</Text>
          </View>
        )}

        {/* Suggestions */}
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
              Tenues du jour
            </Text>
            <Pressable
              onPress={onGenerate}
              disabled={generating}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingVertical: 8,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                backgroundColor: colors.primary,
                opacity: generating ? 0.5 : pressed ? 0.85 : 1,
              })}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Ionicons name="sparkles" size={16} color={colors.primaryText} />
              )}
              <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 13 }}>
                {generating ? 'Génération…' : 'Générer'}
              </Text>
            </Pressable>
          </View>

          {outfits.length === 0 ? (
            <EmptySuggestions />
          ) : (
            outfits.map((o) => (
              <OutfitCard
                key={o.id}
                outfit={o}
                clothes={clothes}
                onLike={() => rate(o.id, true)}
                onSkip={() => rate(o.id, false)}
              />
            ))
          )}
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

function EmptySuggestions() {
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
        Aucune tenue pour l'instant
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
        Touche « Générer » pour des tenues adaptées à la météo, ou remplis d'abord ta garde-robe.
      </Text>
      <Pressable
        onPress={() => router.push('/(tabs)/wardrobe')}
        style={({ pressed }) => ({
          marginTop: spacing.xs,
          paddingVertical: 10,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: colors.text, fontWeight: '700' }}>Ma garde-robe</Text>
      </Pressable>
    </View>
  );
}
