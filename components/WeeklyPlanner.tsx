import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { categoryKey } from '@/constants/categories';
import { radius, spacing, typography } from '@/constants/theme';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import type { SuggestedOutfit } from '@/lib/outfits';
import type { Clothing } from '@/lib/types';
import type { WeekDay } from '@/lib/week';

export function WeeklyPlanner({
  days,
  selectedDate,
  outfits,
  clothes,
  generating,
  error,
  onSelectDate,
  onGenerate,
  onOpenToday,
}: {
  days: WeekDay[];
  selectedDate: string;
  outfits: SuggestedOutfit[];
  clothes: Map<string, Clothing>;
  generating: boolean;
  error: string | null;
  onSelectDate: (date: string) => void;
  onGenerate: () => void;
  onOpenToday: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const selectedDay = days.find((day) => day.date === selectedDate) ?? days[0];
  const selectedOutfit = outfits.find((outfit) => outfit.planned_for === selectedDay?.date);
  // Same look as the studio: top, bottom, shoes, in that order (no jackets).
  const WORN_ORDER = ['top', 'bottom', 'shoes'];
  const items = (selectedOutfit?.clothes_ids ?? [])
    .map((id) => clothes.get(id))
    .filter((item): item is Clothing => Boolean(item) && WORN_ORDER.includes(item!.category ?? ''))
    .sort((a, b) => WORN_ORDER.indexOf(a.category ?? '') - WORN_ORDER.indexOf(b.category ?? ''));
  const hasPlan = outfits.length > 0;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[typography.eyebrow, { color: colors.accent }]}>{t('week.eyebrow')}</Text>
          <Text style={[typography.h2, { color: colors.text }]}>{t('week.title')}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('week.subtitle')}</Text>
        </View>
      </View>

      <Pressable
        onPress={onGenerate}
        disabled={generating}
        style={({ pressed }) => ({
          minHeight: 54,
          borderRadius: radius.full,
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          opacity: generating ? 0.75 : 1,
        })}
      >
        {generating ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Ionicons name={hasPlan ? 'refresh' : 'color-wand-outline'} size={19} color={colors.onPrimaryAccent} />
        )}
        <Text style={[typography.button, { color: colors.primaryText }]}>
          {generating ? t('week.generating') : hasPlan ? t('week.regenerate') : t('week.generate')}
        </Text>
      </Pressable>

      {error ? (
        <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface }}>
          <Text style={[typography.small, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {days.map((day) => {
          const selected = day.date === selectedDate;
          const ready = outfits.some((outfit) => outfit.planned_for === day.date);
          return (
            <Pressable
              key={day.date}
              onPress={() => onSelectDate(day.date)}
              style={{
                width: 78,
                minHeight: 88,
                borderRadius: radius.lg,
                padding: 10,
                justifyContent: 'space-between',
                backgroundColor: selected ? colors.text : colors.surface,
                borderWidth: 1,
                borderColor: selected ? colors.text : colors.border,
              }}
            >
              <Text style={[typography.caption, { color: selected ? colors.bg : colors.text, textTransform: 'capitalize' }]}>
                {day.dayLabel}
              </Text>
              <Text style={[typography.h3, { color: selected ? colors.bg : colors.text }]}>{day.dateLabel}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[typography.caption, { color: selected ? colors.bg : colors.textMuted }]}>
                  {day.weather ? `${day.weather.temp}°` : '—'}
                </Text>
                {ready ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.energy }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {!selectedOutfit ? (
        <View
          style={{
            minHeight: 300,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            gap: spacing.sm,
          }}
        >
          <Ionicons name="calendar-outline" size={34} color={colors.textMuted} />
          <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>{t('week.emptyTitle')}</Text>
          <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>{t('week.emptyBody')}</Text>
        </View>
      ) : (
        <View style={{ borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
          <View style={{ padding: spacing.md, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[typography.eyebrow, { color: colors.textMuted }]}>{selectedDay.dayLabel}</Text>
              <Text style={[typography.h3, { color: colors.text }]}>{selectedDay.dateLabel}</Text>
            </View>
            {selectedDay.weather ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Ionicons name={selectedDay.weather.icon} size={21} color={colors.text} />
                <Text style={[typography.caption, { color: colors.textMuted }]}>{selectedDay.weather.temp}°</Text>
              </View>
            ) : null}
          </View>

          {items.map((item) => (
            <View
              key={item.id}
              style={{
                height: item.category === 'shoes' ? 145 : 220,
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={[typography.eyebrow, { color: colors.textMuted, fontSize: 9, position: 'absolute', left: spacing.md, top: spacing.md }]}>
                {t(categoryKey(item.category))}
              </Text>
              <Image
                source={{ uri: item.photo_clean_url ?? item.photo_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={180}
              />
            </View>
          ))}

          {selectedOutfit.rationale ? (
            <Text style={[typography.small, { color: colors.textMuted, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }]}>
              {selectedOutfit.rationale}
            </Text>
          ) : null}
        </View>
      )}

      {selectedDay?.date === days[0]?.date && selectedOutfit ? (
        <Pressable onPress={onOpenToday} style={{ alignSelf: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
          <Text style={[typography.button, { color: colors.accent }]}>{t('week.openToday')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
