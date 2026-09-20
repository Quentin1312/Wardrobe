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
