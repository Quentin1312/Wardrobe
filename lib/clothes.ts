import { supabase } from '@/lib/supabase';
import type { Clothing, ClothingCategory } from '@/lib/types';

export async function fetchClothes(userId: string): Promise<Clothing[]> {
  const { data, error } = await supabase
    .from('clothes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Clothing[]) ?? [];
}

export async function addClothing(input: {
  userId: string;
  photoUrl: string;
  category: ClothingCategory;
  dominantColor?: string | null;
  styleTags?: string[];
}): Promise<Clothing> {
  const { data, error } = await supabase
    .from('clothes')
    .insert({
      user_id: input.userId,
      photo_url: input.photoUrl,
      category: input.category,
      dominant_color: input.dominantColor ?? null,
      style_tags: input.styleTags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return data as Clothing;
}

export async function fetchClothing(id: string): Promise<Clothing | null> {
  const { data, error } = await supabase
    .from('clothes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Clothing) ?? null;
}

export async function renameClothing(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('clothes')
    .update({ name: name.trim() || null })
    .eq('id', id);
  if (error) throw error;
}

export async function setClothingFavorite(id: string, favorite: boolean): Promise<void> {
  const { error } = await supabase.from('clothes').update({ favorite }).eq('id', id);
  if (error) throw error;
}

export async function setClothingDirty(id: string, dirty: boolean): Promise<void> {
  const { error } = await supabase.from('clothes').update({ dirty }).eq('id', id);
  if (error) throw error;
}

/** Sends a whole outfit to the laundry basket after it has been worn. */
export async function markOutfitDirty(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('clothes').update({ dirty: true }).in('id', ids);
  if (error) throw error;
}

/** Laundry day: everything comes back clean. */
export async function washAll(userId: string): Promise<void> {
  const { error } = await supabase
    .from('clothes')
    .update({ dirty: false })
    .eq('user_id', userId)
    .eq('dirty', true);
  if (error) throw error;
}

export async function deleteClothing(id: string): Promise<void> {
  const { error } = await supabase.from('clothes').delete().eq('id', id);
  if (error) throw error;
}

/** Removes the background of a clothing photo (remove.bg edge function). */
export async function removeBackground(
  clothingId: string
): Promise<{ url?: string; error?: string; cached?: boolean }> {
  const { data, error } = await supabase.functions.invoke('remove-background', {
    body: { clothingId },
  });
  if (error) {
    let detail = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) detail = body.error;
    } catch {
      // keep generic
    }
    return { error: detail };
  }
  if (data?.error) return { error: data.error };
  return { url: data?.url as string, cached: Boolean(data?.cached) };
}

/**
 * One-time cleanup for items created before automatic background removal.
 * Requests are deliberately sequential to avoid burning provider credits in a
 * burst or hitting the provider's rate limit.
 */
export async function cleanMissingBackgrounds(
  items: Clothing[],
  onProgress?: (done: number, total: number) => void
): Promise<{ cleaned: number; failed: number }> {
  const pending = items.filter((item) => !item.photo_clean_url);
  let cleaned = 0;
  let failed = 0;

  for (const item of pending) {
    const result = await removeBackground(item.id);
    if (result.error) failed += 1;
    else cleaned += 1;
    onProgress?.(cleaned + failed, pending.length);
  }

  return { cleaned, failed };
}
