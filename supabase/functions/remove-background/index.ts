// Background removal for clothing photos via remove.bg.
// Secret: supabase secrets set REMOVEBG_API_KEY=...
// Deploy: supabase functions deploy remove-background
//
// Client sends { clothingId } + the user JWT. The function fetches the item's
// original photo, removes the background, stores a transparent PNG and updates
// clothes.photo_clean_url.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const REMOVEBG_API_KEY = Deno.env.get('REMOVEBG_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!REMOVEBG_API_KEY) return json({ error: 'REMOVEBG_API_KEY is not configured' }, 503);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { clothingId } = await req.json().catch(() => ({}));
    if (!clothingId) return json({ error: 'clothing_id_required' }, 400);

    const { data: item, error: itemErr } = await supabase
      .from('clothes')
      .select('id, photo_url, photo_clean_url')
      .eq('id', clothingId)
      .eq('user_id', userId)
      .single();
    if (itemErr || !item) return json({ error: 'clothing_not_found' }, 404);

    // remove.bg charges per processed image. Once a clean asset exists, always
    // reuse it instead of spending another credit on the same source photo.
    if (item.photo_clean_url) {
      return json({ url: item.photo_clean_url, cached: true });
    }

    // Call remove.bg with the original photo URL.
    const form = new FormData();
    form.append('image_url', item.photo_url);
    // A wardrobe card does not need a 25 MP source. Preview output is large
    // enough for the UI, uses a quarter credit, and WebP keeps transparency at
    // a fraction of the transfer size of a full-resolution PNG.
    form.append('size', 'preview');
    form.append('format', 'webp');

    const bgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': REMOVEBG_API_KEY },
      body: form,
    });

    if (!bgRes.ok) {
      let detail = `remove.bg error ${bgRes.status}`;
      try {
        const err = await bgRes.json();
        detail = err?.errors?.[0]?.title ?? detail;
      } catch {
        // keep generic
      }
      return json({ error: detail }, 502);
    }

    const webpBytes = new Uint8Array(await bgRes.arrayBuffer());
    const cleanPath = `${userId}/${clothingId}-clean.webp`;
    const { error: uploadErr } = await supabase.storage
      .from('clothes')
      .upload(cleanPath, webpBytes, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      });
    if (uploadErr) return json({ error: uploadErr.message }, 500);

    const { data: pub } = supabase.storage.from('clothes').getPublicUrl(cleanPath);
    const cleanUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from('clothes')
      .update({ photo_clean_url: cleanUrl })
      .eq('id', clothingId)
      .eq('user_id', userId);
    if (updErr) return json({ error: updErr.message }, 500);

    return json({ url: cleanUrl });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'unknown_error' }, 500);
  }
});
