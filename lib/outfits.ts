import { supabase } from '@/lib/supabase';
import type { Clothing, Outfit } from '@/lib/types';

export type SuggestedOutfit = Outfit;

/** Client-side guard while older deployed function versions may still be running. */
export function validLook(ids: string[], clothes: Clothing[]): boolean {
  const byId = new Map(clothes.filter((item) => !item.dirty).map((item) => [item.id, item]));
  if (new Set(ids).size !== ids.length || ids.some((id) => !byId.has(id))) return false;
  const count = (category: Clothing['category']) => ids.filter((id) => byId.get(id)?.category === category).length;
  return count('top') === 1 && count('bottom') === 1 && count('shoes') === 1 &&
    count('jacket') <= 1 && count('accessory') <= 1 && ids.length ===
    ['top', 'bottom', 'shoes', 'jacket', 'accessory'].reduce((n, category) => n + count(category as Clothing['category']), 0);
}

export interface WeekPlanDayInput {
  date: string;
  weather: { temp: number; condition: string } | null;
}

/** Calls the Groq-powered edge function to generate fresh outfit suggestions. */
export async function generateOutfits(weather: {
  temp: number;
  condition: string;
} | null): Promise<{ outfits: SuggestedOutfit[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke('suggest-outfits', {
    body: { weather, count: 3 },
  });

  // On a non-2xx, supabase-js hides the function's JSON body inside error.context.
  // Read it so the real reason (Groq key missing, model error, etc.) surfaces.
  if (error) {
    let detail = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) detail = body.error;
    } catch {
      // keep the generic message
    }
    return { outfits: [], error: detail };
  }

  if (data?.error && (!data.outfits || data.outfits.length === 0)) {
    return { outfits: [], error: data.error };
  }

  const outfits = (data?.outfits ?? []) as SuggestedOutfit[];
  // Never resolve silently empty — the caller should always get a signal.
  if (outfits.length === 0) return { outfits: [], error: 'empty' };
  return { outfits };
}

/** Generates and persists one dated look per requested day in a single AI call. */
export async function generateWeeklyOutfits(
  days: WeekPlanDayInput[]
): Promise<{ outfits: SuggestedOutfit[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke('suggest-outfits', {
    body: { mode: 'week', days },
  });
  if (error) {
    let detail = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) detail = body.error;
    } catch {
      // keep the generic message
    }
    return { outfits: [], error: detail };
  }
  if (data?.error && (!data.outfits || data.outfits.length === 0)) {
    return { outfits: [], error: data.error };
  }
  const outfits = (data?.outfits ?? []) as SuggestedOutfit[];
  if (outfits.length === 0) return { outfits: [], error: 'empty' };
  return { outfits };
}

/** Latest saved weekly look for each requested date. */
export async function fetchWeeklyOutfits(userId: string, dates: string[]): Promise<SuggestedOutfit[]> {
  if (dates.length === 0) return [];
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_scope', 'week')
    .in('planned_for', dates)
    .order('generated_at', { ascending: false });
  if (error) throw error;

  const seen = new Set<string>();
  return ((data as SuggestedOutfit[]) ?? []).filter((outfit) => {
    if (!outfit.planned_for || seen.has(outfit.planned_for)) return false;
    seen.add(outfit.planned_for);
    return true;
  });
}

/** Today's already-generated outfits, newest first. */
export async function fetchTodayOutfits(userId: string): Promise<Outfit[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('user_id', userId)
    .gte('generated_at', startOfDay.toISOString())
    .order('generated_at', { ascending: false });
  if (error) throw error;
  return (data as Outfit[]) ?? [];
}

/** Persists a hand-built outfit the user chose to wear (algo memory). */
export async function saveWornOutfit(input: {
  userId: string;
  clothesIds: string[];
  weatherContext: string | null;
  liked: boolean;
}): Promise<Outfit> {
  const { data, error } = await supabase
    .from('outfits')
    .insert({
      user_id: input.userId,
      clothes_ids: input.clothesIds,
      weather_context: input.weatherContext,
      liked: input.liked,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Outfit;
}

/** The look the user validated today, if any — used to lock the studio. */
export async function fetchTodaysWornOutfit(userId: string): Promise<Outfit | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('user_id', userId)
    .eq('liked', true)
    .gte('generated_at', startOfDay.toISOString())
    .order('generated_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return ((data as Outfit[]) ?? [])[0] ?? null;
}

export async function setOutfitLiked(id: string, liked: boolean): Promise<void> {
  const { error } = await supabase.from('outfits').update({ liked }).eq('id', id);
  if (error) throw error;
}

/** Builds an id → Clothing lookup so outfit cards can render photos. */
export async function clothesMap(userId: string): Promise<Map<string, Clothing>> {
  const { data, error } = await supabase
    .from('clothes')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const map = new Map<string, Clothing>();
  for (const c of (data as Clothing[]) ?? []) map.set(c.id, c);
  return map;
}
