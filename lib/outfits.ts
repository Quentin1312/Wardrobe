import { supabase } from '@/lib/supabase';
import type { Clothing, Outfit } from '@/lib/types';

export interface SuggestedOutfit extends Outfit {
  rationale?: string;
}

/** Calls the Groq-powered edge function to generate fresh outfit suggestions. */
export async function generateOutfits(weather: {
  temp: number;
  condition: string;
} | null): Promise<{ outfits: SuggestedOutfit[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke('suggest-outfits', {
    body: { weather, count: 3 },
  });
  if (error) return { outfits: [], error: error.message };
  if (data?.error && (!data.outfits || data.outfits.length === 0)) {
    return { outfits: [], error: data.error };
  }
  return { outfits: (data?.outfits ?? []) as SuggestedOutfit[] };
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
