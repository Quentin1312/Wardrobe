// Authenticated virtual try-on pipeline.
// Secret: supabase secrets set FASHN_API_KEY=...
// Deploy: supabase functions deploy generate-tryon

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const FASHN_API_KEY = Deno.env.get('FASHN_API_KEY');
const FASHN_BASE_URL = 'https://api.fashn.ai/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type TryOnCategory = 'tops' | 'bottoms';

interface ClothingRow {
  id: string;
  photo_url: string;
  photo_clean_url: string | null;
  category: 'top' | 'bottom' | 'shoes' | 'jacket' | 'accessory' | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function runSingleTryOn(modelImage: string, garment: ClothingRow, deadline: number) {
  const category: TryOnCategory = garment.category === 'bottom' ? 'bottoms' : 'tops';
  const garmentImage = garment.photo_clean_url ?? garment.photo_url;
  const runResponse = await fetch(`${FASHN_BASE_URL}/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FASHN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: modelImage,
        garment_image: garmentImage,
        category,
        garment_photo_type: 'auto',
        segmentation_free: true,
        moderation_level: 'permissive',
        mode: 'balanced',
        num_samples: 1,
        output_format: 'jpeg',
      },
    }),
  });

  const runData = await runResponse.json();
  if (!runResponse.ok || !runData.id) {
    throw new Error(runData.message ?? runData.error ?? 'tryon_provider_rejected');
  }

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const statusResponse = await fetch(`${FASHN_BASE_URL}/status/${runData.id}`, {
      headers: { Authorization: `Bearer ${FASHN_API_KEY}` },
    });
    const statusData = await statusResponse.json();
    if (!statusResponse.ok) {
      throw new Error(statusData.message ?? 'tryon_status_failed');
    }
    if (statusData.status === 'completed') {
      const output = statusData.output?.[0];
      if (!output) throw new Error('tryon_empty_output');
      return output as string;
    }
    if (statusData.status === 'failed') {
      throw new Error(statusData.error?.message ?? statusData.error?.name ?? 'tryon_generation_failed');
    }
  }

  throw new Error('tryon_timeout');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!FASHN_API_KEY) return json({ error: 'FASHN_API_KEY is not configured' }, 503);

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;
    const body = await request.json().catch(() => ({}));
    const outfitId = typeof body.outfitId === 'string' ? body.outfitId : null;
    if (!outfitId) return json({ error: 'outfit_id_required' }, 400);

    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('id, clothes_ids')
      .eq('id', outfitId)
      .eq('user_id', userId)
      .single();
    if (outfitError || !outfit) return json({ error: 'outfit_not_found' }, 404);

    const [{ data: profile, error: profileError }, { data: clothes, error: clothesError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('profile_photo_url, profile_photo_clean_url')
        .eq('id', userId)
        .single(),
      supabase
        .from('clothes')
        .select('id, photo_url, photo_clean_url, category')
        .eq('user_id', userId)
        .in('id', outfit.clothes_ids),
    ]);

    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404);
    if (clothesError) return json({ error: clothesError.message }, 500);
    const modelPhoto = profile.profile_photo_clean_url ?? profile.profile_photo_url;
    if (!modelPhoto) return json({ error: 'profile_photo_required' }, 400);

    const order = { bottom: 0, top: 1, jacket: 2 } as const;
    const compatible = ((clothes ?? []) as ClothingRow[])
      .filter((item) => item.category === 'bottom' || item.category === 'top' || item.category === 'jacket')
      .sort((a, b) => order[a.category as keyof typeof order] - order[b.category as keyof typeof order]);
    if (compatible.length === 0) return json({ error: 'no_compatible_garments' }, 400);

    const deadline = Date.now() + 125_000;
    let renderedImage = modelPhoto;
    for (const garment of compatible.slice(0, 3)) {
      renderedImage = await runSingleTryOn(renderedImage, garment, deadline);
    }

    const generatedResponse = await fetch(renderedImage);
    if (!generatedResponse.ok) throw new Error('tryon_result_download_failed');
    const resultBytes = await generatedResponse.arrayBuffer();
    const storagePath = `${userId}/${outfitId}-${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('tryon')
      .upload(storagePath, resultBytes, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from('tryon_results').insert({
      user_id: userId,
      outfit_id: outfitId,
      result_image_url: storagePath,
    });
    if (insertError) throw insertError;

    const { data: signed, error: signedError } = await supabase.storage
      .from('tryon')
      .createSignedUrl(storagePath, 60 * 60);
    if (signedError) throw signedError;

    return json({ url: signed.signedUrl });
  } catch (cause) {
    console.error('generate-tryon failed', cause);
    return json({ error: cause instanceof Error ? cause.message : 'tryon_unknown_error' }, 500);
  }
});
