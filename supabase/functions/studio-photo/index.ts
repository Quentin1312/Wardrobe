// "Studio render" for a clothing photo via OpenAI GPT Image (image edit).
// Secret:  supabase secrets set OPENAI_API_KEY=...
// Optional: supabase secrets set OPENAI_IMAGE_MODEL=gpt-image-2.5-flare OPENAI_IMAGE_QUALITY=medium
// Deploy:  supabase functions deploy studio-photo
//
// Client sends { clothingId } + the user JWT. The function turns the original
// photo into a clean packshot of the same garment on a transparent background
// and stores it as a *candidate*: clothes.photo_clean_url is only changed by
// the client once the user picks it over the current cut-out.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-2.5-flare';
const QUALITY = Deno.env.get('OPENAI_IMAGE_QUALITY') ?? 'medium';

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

const CATEGORY_EN: Record<string, string> = {
  top: 'top',
  bottom: 'trousers / bottom',
  shoes: 'pair of shoes',
  jacket: 'jacket / outerwear',
  accessory: 'accessory',
};

function studioPrompt(category: string | null, name: string | null): string {
  const what = [name ? `"${name}"` : null, category ? CATEGORY_EN[category] ?? category : null]
    .filter(Boolean)
    .join(', ');
  const layout =
    category === 'shoes'
      ? 'Show the pair side by side in a clean three-quarter front view, laces neatly tied.'
      : 'Show it front view, flat-lay / ghost-mannequin style: centred, neatly smoothed with a natural drape, sleeves and legs laid straight, buttons and zips done up.';
  return [
    `Turn this photo into a professional e-commerce product photo of the exact same garment${what ? ` (${what})` : ''}.`,
    layout,
    'No hanger, no hands, no person, no mannequin visible, no labels or tags added, nothing else in the frame.',
    'Transparent background, soft even studio lighting, the whole item visible with a small margin around it.',
    'Preserve exactly: the colour, fabric texture, pattern or print, logos, stitching, buttons, zips, pockets, collar shape, length and proportions.',
    'Do not invent, add or remove any detail. It must be recognisably the same item as in the photo.',
  ].join(' ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured' }, 503);

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
      .select('id, name, category, photo_url')
      .eq('id', clothingId)
      .eq('user_id', userId)
      .single();
    if (itemErr || !item) return json({ error: 'clothing_not_found' }, 404);

    // Always start from the original photo: it carries the most detail.
    const photoRes = await fetch(item.photo_url);
    if (!photoRes.ok) return json({ error: `photo_fetch_failed ${photoRes.status}` }, 502);
    const photoType = photoRes.headers.get('content-type') ?? 'image/jpeg';
    const photo = new Blob([await photoRes.arrayBuffer()], { type: photoType });
    const ext = photoType.includes('png') ? 'png' : photoType.includes('webp') ? 'webp' : 'jpg';

    const form = new FormData();
    form.append('model', MODEL);
    form.append('image[]', photo, `garment.${ext}`);
    form.append('prompt', studioPrompt(item.category, item.name));
    form.append('size', '1024x1024');
    form.append('quality', QUALITY);
    form.append('background', 'transparent');
    form.append('output_format', 'webp');
    form.append('n', '1');

    const aiRes = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });
    if (!aiRes.ok) {
      let detail = `openai error ${aiRes.status}`;
      try {
        const err = await aiRes.json();
        detail = err?.error?.message ?? detail;
      } catch {
        // keep generic
      }
      return json({ error: detail }, 502);
    }
    const ai = await aiRes.json();
    const b64: string | undefined = ai?.data?.[0]?.b64_json;
    if (!b64) return json({ error: 'openai_empty_result' }, 502);
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    // Unique name: storage objects are cached for a year, never overwrite one.
    const path = `${userId}/${clothingId}-studio-${Date.now()}.webp`;
    const { error: uploadErr } = await supabase.storage
      .from('clothes')
      .upload(path, bytes, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    if (uploadErr) return json({ error: uploadErr.message }, 500);

    const { data: pub } = supabase.storage.from('clothes').getPublicUrl(path);
    return json({ url: pub.publicUrl, model: MODEL });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'unknown_error' }, 500);
  }
});
