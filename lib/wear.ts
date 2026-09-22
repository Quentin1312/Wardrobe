import { supabase } from '@/lib/supabase';
import type { Clothing } from '@/lib/types';

/**
 * Wear history, derived from the looks validated in the Outfit tab
 * (outfits.liked = true). No extra table: one worn look = one wear per piece.
 */
export interface WearStat {
  /** ISO timestamp of the last time the piece was worn. */
  last: string;
  count: number;
}

/** Not worn for this many days → "forgotten". */
export const FORGOTTEN_DAYS = 30;
/** A never-worn piece only counts as forgotten once it has been here a while. */
const NEVER_WORN_GRACE_DAYS = 14;

export async function fetchWearStats(userId: string): Promise<Map<string, WearStat>> {
  const { data, error } = await supabase
    .from('outfits')
    .select('clothes_ids, generated_at')
    .eq('user_id', userId)
    .eq('liked', true)
    .order('generated_at', { ascending: false })
    .limit(500);
  if (error) throw error;

  const stats = new Map<string, WearStat>();
  for (const outfit of data ?? []) {
    for (const id of (outfit.clothes_ids as string[] | null) ?? []) {
      const stat = stats.get(id);
      // Rows come newest first, so the first sighting is the last wear.
      if (stat) stat.count += 1;
      else stats.set(id, { last: outfit.generated_at as string, count: 1 });
    }
  }
  return stats;
}

/** Whole calendar days between a date and today (0 = today). */
export function daysSince(iso: string, now = new Date()): number {
  const then = new Date(iso);
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function isForgotten(item: Clothing, stat: WearStat | undefined, now = new Date()): boolean {
  if (item.dirty) return false;
  if (stat) return daysSince(stat.last, now) >= FORGOTTEN_DAYS;
  return daysSince(item.created_at, now) >= NEVER_WORN_GRACE_DAYS;
}

type T = (key: string, vars?: Record<string, string | number>) => string;

/** "Portée aujourd'hui", "Portée il y a 3 jours", "Jamais portée"… */
export function wornLabel(stat: WearStat | undefined, t: T, now = new Date()): string {
  if (!stat) return t('wear.never');
  const days = daysSince(stat.last, now);
  if (days === 0) return t('wear.today');
  if (days === 1) return t('wear.yesterday');
  if (days < 14) return t('wear.days', { count: days });
  if (days < 60) return t('wear.weeks', { count: Math.floor(days / 7) });
  return t('wear.months', { count: Math.floor(days / 30) });
}

/** The piece that has waited longest to be worn, for a gentle nudge. */
export function mostForgotten(
  items: Clothing[],
  stats: Map<string, WearStat>,
  now = new Date()
): { item: Clothing; days: number | null } | null {
  let best: { item: Clothing; days: number | null; score: number } | null = null;
  for (const item of items) {
    const stat = stats.get(item.id);
    if (!isForgotten(item, stat, now)) continue;
    const days = stat ? daysSince(stat.last, now) : null;
    const score = days ?? daysSince(item.created_at, now);
    if (!best || score > best.score) best = { item, days, score };
  }
  return best ? { item: best.item, days: best.days } : null;
}
