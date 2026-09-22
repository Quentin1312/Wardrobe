// Authenticated virtual try-on via OpenAI GPT Image, with garment guardrails.
// Secret:   supabase secrets set OPENAI_API_KEY=...
// Optional: OPENAI_IMAGE_MODEL (default gpt-image-2.5-flare), OPENAI_TRYON_QUALITY (default medium),
//           OPENAI_JUDGE_MODEL (default gpt-5-mini)
// Deploy:   supabase functions deploy generate-tryon
//
// Pipeline:
// 1. One image edit: the user's photo + a reference image per garment, with a
//    strict "copy the garments exactly" brief listing each piece.
// 2. Guardrail: a vision model compares the result with every reference
//    (colour, pattern, logos, cut, details) and with the person's face.
// 3. If something drifted, one corrective attempt that names the problems;
//    the attempt with the fewest problems wins.
// 4. The result is stored privately; any remaining doubt is returned to the
//    app as warnings instead of being hidden.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-2.5-flare';
const QUALITY = Deno.env.get('OPENAI_TRYON_QUALITY') ?? 'medium';
const JUDGE_MODEL = Deno.env.get('OPENAI_JUDGE_MODEL') ?? 'gpt-5-mini';
/** Set OPENAI_INPUT_FIDELITY=high for image models that support it. */
const USE_FIDELITY = Deno.env.get('OPENAI_INPUT_FIDELITY') === 'high';

/** Don't start a corrective attempt past this point (edge functions have a wall-clock limit). */
const RETRY_BUDGET_MS = 70_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Category = 'top' | 'mid' | 'bottom' | 'shoes' | 'jacket' | 'accessory';

interface ClothingRow {
  id: string;
  name: string | null;
  photo_url: string;
  photo_clean_url: string | null;
  category: Category | null;
  dominant_color: string | null;
}

interface Verdict {
  garments: { index: number; ok: boolean; problem?: string }[];
  person_ok: boolean;
  person_problem?: string;
  /** Garment the model added on its own (a jacket nobody asked for). */
  extra?: string;
}

interface Attempt {
  bytes: Uint8Array;
  problems: string[];
  verified: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Accessories worn on the head or face render well; small ones do not. */
const HEAD_WORDS =
  /casquette|bob|bonnet|chapeau|beret|béret|capuche|lunette|solaire|cap\b|hat|beanie|bucket|glasses|sunglasses|visor|headband|bandana/i;

const CATEGORY_EN: Record<Category, string> = {
  jacket: 'jacket / outer layer',
  mid: 'jumper / sweatshirt worn over the top',
  top: 'top',
  bottom: 'trousers / skirt / shorts',
  shoes: 'shoes',
  accessory: 'accessory worn on the head or face',
};
const ORDER: Category[] = ['jacket', 'mid', 'top', 'bottom', 'shoes', 'accessory'];

/** Rough colour word for the brief, so the model has a textual anchor too. */
function colorWord(hex: string | null): string | null {
  const m = hex ? /^#?([0-9a-f]{6})$/i.exec(hex.trim()) : null;
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = d === 0 ? 0 : max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (l < 0.15) return 'black';
  if (l > 0.9 && s < 0.3) return 'white';
  if (s < 0.13) return l > 0.66 ? 'light grey' : l > 0.34 ? 'grey' : 'charcoal';
  if (h >= 20 && h < 50 && s < 0.5 && l > 0.62) return 'beige';
  if (h >= 10 && h < 45 && l < 0.4) return 'brown';
  if (h < 10 || h >= 345) return l < 0.32 ? 'burgundy' : 'red';
  if (h < 45) return 'orange / camel';
  if (h < 100 && s < 0.5 && l < 0.5) return 'khaki';
  if (h < 65) return 'yellow';
  if (h < 170) return 'green';
  if (h < 255) return l < 0.3 ? 'navy' : 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

function describe(g: ClothingRow, index: number): string {
  const parts = [CATEGORY_EN[g.category ?? 'accessory']];
  if (g.name) parts.push(`"${g.name}"`);
  const colour = colorWord(g.dominant_color);
  if (colour) parts.push(`mainly ${colour}`);
  return `- Image ${index}: ${parts.join(', ')}`;
}

/** Spells out the layers that are NOT part of this look. */
function missingLayers(garments: ClothingRow[]): string {
  const has = (category: Category) => garments.some((g) => g.category === category);
  const missing = [
    has('jacket') ? null : 'no jacket, coat, overshirt or blazer',
    has('mid') ? null : 'no jumper, sweatshirt or hoodie',
    has('accessory') ? null : 'no hat, cap or glasses',
  ].filter(Boolean);
  if (missing.length === 0) return '';
  return `This look has exactly ${garments.length} garment(s): ${missing.join(', ')}. The person wears nothing else.`;
}

function tryOnPrompt(garments: ClothingRow[], fixes: string[]): string {
  const hasShoes = garments.some((g) => g.category === 'shoes');
  return [
    'Virtual try-on. Image 1 is the person. The other images are reference photos of the exact garments to put on them:',
    ...garments.map((g, i) => describe(g, i + 2)),
    '',
    'Layer them in the right order: top first, then the jumper over it, then the jacket on top — each visible the way it would really be worn.',
    'Dress the person from image 1 in exactly these garments and show a realistic full-body photo, head to feet, standing naturally, facing the camera, on a plain light studio background.',
    'GARMENTS MUST BE COPIED EXACTLY from their reference images: same colour and shade, same fabric texture, same pattern or print, same logos and text, same buttons, zips, pockets, collar, sleeve length, trouser length and cut. Only adapt them to the body with natural folds and fit.',
    'Do not add any garment, layer, accessory, jewellery or logo that is not listed. Do not recolour, simplify, restyle or "improve" any garment.',
    'Keep everything the person already wears in image 1 that is not replaced: watch, jewellery, rings, piercings, glasses, hair accessories — same items, same wrist or side.',
    hasShoes ? '' : 'Shoes are not provided: keep simple neutral shoes that do not draw attention.',
    garments.some((g) => g.category === 'accessory')
      ? 'Accessories listed here are worn on the head or face (cap, hat, beanie, glasses): place each one naturally, the right way round and at the right size, without hiding the face. Glasses go on the eyes, a cap or hat on the head — both can be worn together.'
      : '',
    missingLayers(garments),
    'THE PERSON MUST STAY THE SAME: same face and identity, same hairstyle and hair colour, same skin tone, same body shape and height. Do not beautify, slim or age them.',
    fixes.length ? `A previous attempt had these problems, fix them precisely: ${fixes.join(' ; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function download(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image_fetch_failed ${res.status}`);
  return new Blob([await res.arrayBuffer()], { type: res.headers.get('content-type') ?? 'image/jpeg' });
}

function extOf(type: string) {
  return type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
}

async function toDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`;
}

async function renderOnce(person: Blob, garments: { row: ClothingRow; blob: Blob }[], fixes: string[]): Promise<Uint8Array> {
  const build = (withFidelity: boolean) => {
    const form = new FormData();
    form.append('model', IMAGE_MODEL);
    form.append('image[]', person, `person.${extOf(person.type)}`);
    garments.forEach((g, i) => form.append('image[]', g.blob, `garment-${i + 2}.${extOf(g.blob.type)}`));
    form.append('prompt', tryOnPrompt(garments.map((g) => g.row), fixes));
    form.append('size', '1024x1536');
    form.append('quality', QUALITY);
    form.append('output_format', 'jpeg');
    form.append('n', '1');
    // Keeps faces and garment details closest to the inputs, where supported.
    if (withFidelity) form.append('input_fidelity', 'high');
    return form;
  };
  const call = (form: FormData) =>
    fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });

  // gpt-image-2.5-flare rejects input_fidelity; only send it when asked to.
  let res = await call(build(USE_FIDELITY));
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const message: string = err?.error?.message ?? `openai error ${res.status}`;
    // Some models don't take input_fidelity: retry once without it.
    if (res.status === 400 && /input_fidelity/i.test(message)) res = await call(build(false));
    else throw new Error(message);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? `openai error ${res.status}`);
  }
  const data = await res.json();
  const b64: string | undefined = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('openai_empty_result');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Is this accessory worn on the head or face (so worth rendering)? */
async function isHeadAccessory(row: ClothingRow, dataUrl: string): Promise<boolean> {
  if (row.name && HEAD_WORDS.test(row.name)) return true;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: JUDGE_MODEL,
        response_format: { type: 'json_object' },
        reasoning_effort: 'low',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Is this accessory worn on the head or face — cap, bucket hat, beanie, hat, headband, bandana, glasses or sunglasses? Scarves count too. Anything small or worn elsewhere (watch, jewellery, ring, belt, bag) does not. Answer ONLY {"head":true} or {"head":false}.',
              },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return JSON.parse(data?.choices?.[0]?.message?.content ?? '{}')?.head === true;
  } catch {
    return false;
  }
}

/** Vision check of the result against every reference. Null when the check itself failed. */
async function judge(
  personUrl: string,
  garments: { row: ClothingRow; dataUrl: string }[],
  result: Uint8Array
): Promise<Verdict | null> {
  try {
    const resultUrl = await toDataUrl(new Blob([result], { type: 'image/jpeg' }));
    const content: unknown[] = [
      {
        type: 'text',
        text: [
          'You check a virtual try-on: is each garment recognisably THE SAME item as its reference photo?',
          'Image 1 is the original person. Then come the garment references, numbered as listed. The LAST image is the generated try-on.',
          ...garments.map((g, i) => describe(g.row, i + 2)),
          'Reference photos are amateur shots: wrinkled, on a hanger, open, badly lit. Being worn changes how a garment looks. So IGNORE: wrinkles vs smooth, buttoned vs open, tucked or not, drape and fit, brightness/exposure/white balance, shadows, viewing angle, labels or tags.',
          'Flag ONLY identity changes: a clearly different colour (e.g. navy became black, beige became white), a pattern/print/stripes/logo/text added, removed or changed, a different garment type, clearly different length or sleeve length, a different collar or neckline, or the garment missing.',
          'Also check the person: same face/identity, hair, skin tone and body shape as image 1.',
          'Finally, look for a garment that was ADDED: any jacket, jumper, hoodie, hat or glasses that is not one of the references above. Name it in "extra" (in French), or leave "extra" empty.',
          'When unsure, answer ok. Answer ONLY with JSON: {"garments":[{"index":2,"ok":true,"problem":""}],"person_ok":true,"person_problem":"","extra":""}. Each problem: one short sentence in French (max 12 words).',
        ].join('\n'),
      },
      { type: 'image_url', image_url: { url: personUrl } },
      ...garments.map((g) => ({ type: 'image_url', image_url: { url: g.dataUrl } })),
      { type: 'image_url', image_url: { url: resultUrl } },
    ];
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: JUDGE_MODEL,
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_object' },
        reasoning_effort: 'low',
      }),
    });
    if (!res.ok) {
      console.error('judge failed', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? 'null');
    if (!parsed || !Array.isArray(parsed.garments)) return null;
    return parsed as Verdict;
  } catch (e) {
    console.error('judge error', e);
    return null;
  }
}

function problemsOf(verdict: Verdict, garments: ClothingRow[]): string[] {
  const out: string[] = [];
  for (const g of verdict.garments) {
    if (g.ok) continue;
    const row = garments[g.index - 2];
    const label = row?.name ?? row?.category ?? `pièce ${g.index}`;
    out.push(`${label} : ${g.problem || 'différent de la photo'}`);
  }
  if (!verdict.person_ok) out.push(`visage / silhouette : ${verdict.person_problem || 'modifié'}`);
  if (verdict.extra) out.push(`pièce ajoutée par l'IA : ${verdict.extra}`);
  return out;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured' }, 503);
  const started = Date.now();

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
      supabase.from('profiles').select('profile_photo_url, profile_photo_clean_url').eq('id', userId).single(),
      supabase
        .from('clothes')
        .select('id, name, photo_url, photo_clean_url, category, dominant_color')
        .eq('user_id', userId)
        .in('id', outfit.clothes_ids),
    ]);
    if (profileError || !profile) return json({ error: 'profile_not_found' }, 404);
    if (clothesError) return json({ error: clothesError.message }, 500);
    const modelPhoto = profile.profile_photo_clean_url ?? profile.profile_photo_url;
    if (!modelPhoto) return json({ error: 'profile_photo_required' }, 400);

    const rows = ((clothes ?? []) as ClothingRow[])
      .filter((c) => Boolean(c.category))
      .sort((a, b) => ORDER.indexOf(a.category!) - ORDER.indexOf(b.category!))
      .slice(0, 7);
    if (rows.filter((r) => r.category !== 'accessory').length === 0) {
      return json({ error: 'no_compatible_garments' }, 400);
    }

    // Clean cut-outs make the best references: the garment alone, no clutter.
    const [person, ...garmentBlobs] = await Promise.all([
      download(modelPhoto),
      ...rows.map((r) => download(r.photo_clean_url ?? r.photo_url)),
    ]);
    const allUrls = await Promise.all(
      rows.map(async (row, i) => ({ row, blob: garmentBlobs[i], dataUrl: await toDataUrl(garmentBlobs[i]) }))
    );
    // A watch or a ring would only confuse the render: drop them, and say so.
    const skipped: string[] = [];
    const kept: typeof allUrls = [];
    for (const entry of allUrls) {
      if (entry.row.category === 'accessory' && !(await isHeadAccessory(entry.row, entry.dataUrl))) {
        skipped.push(entry.row.name ?? 'accessoire');
        continue;
      }
      kept.push(entry);
    }
    const garments = kept.map((g) => ({ row: g.row, blob: g.blob }));
    const personUrl = await toDataUrl(person);
    const garmentUrls = kept.map((g) => ({ row: g.row, dataUrl: g.dataUrl }));
    const keptRows = kept.map((g) => g.row);

    const attempt = async (fixes: string[]): Promise<Attempt> => {
      const bytes = await renderOnce(person, garments, fixes);
      const verdict = await judge(personUrl, garmentUrls, bytes);
      return verdict
        ? { bytes, problems: problemsOf(verdict, keptRows), verified: true }
        : { bytes, problems: [], verified: false };
    };

    let best = await attempt([]);
    let attempts = 1;
    if (best.problems.length > 0 && Date.now() - started < RETRY_BUDGET_MS) {
      try {
        const second = await attempt(best.problems);
        attempts = 2;
        if (second.problems.length < best.problems.length) best = second;
      } catch (e) {
        console.error('corrective attempt failed', e);
      }
    }

    const storagePath = `${userId}/${outfitId}-${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('tryon')
      .upload(storagePath, best.bytes, { contentType: 'image/jpeg', upsert: false });
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

    return json({
      url: signed.signedUrl,
      verified: best.verified && best.problems.length === 0,
      checked: best.verified,
      warnings: best.problems,
      skipped,
      attempts,
    });
  } catch (cause) {
    console.error('generate-tryon failed', cause);
    return json({ error: cause instanceof Error ? cause.message : 'tryon_unknown_error' }, 500);
  }
});
