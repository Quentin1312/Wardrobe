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

export async function deleteClothing(id: string): Promise<void> {
  const { error } = await supabase.from('clothes').delete().eq('id', id);
  if (error) throw error;
}

/** Removes the background of a clothing photo (remove.bg edge function). */
export async function removeBackground(
  clothingId: string
): Promise<{ url?: string; error?: string }> {
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
  return { url: data?.url as string };
}
