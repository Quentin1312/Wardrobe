// Supabase Edge Function: suggest-outfits
// Analyzes the user's wardrobe + current weather with Groq (Llama) and
// returns 2-3 coherent outfits, persisting them to the `outfits` table.
//
// Deploy:  supabase functions deploy suggest-outfits
// Secret:  supabase secrets set GROQ_API_KEY=xxx
//
// The client sends: { weather: { temp: number, condition: string }, count?: number }
// and its user JWT in the Authorization header.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;
const GROQ_MODEL = 'llama-3.1-8b-instant';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ClothingRow {
  id: string;
  category: string | null;
  dominant_color: string | null;
  style_tags: string[] | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    // Client scoped to the caller's JWT — RLS ensures they only see their rows.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { weather, count = 3 } = await req.json().catch(() => ({}));

    const { data: clothes, error: clothesErr } = await supabase
      .from('clothes')
      .select('id, category, dominant_color, style_tags')
      .eq('user_id', userId);
    if (clothesErr) return json({ error: clothesErr.message }, 500);

    const items = (clothes ?? []) as ClothingRow[];
    if (items.length < 2) {
      return json({ error: 'not_enough_items', outfits: [] }, 200);
    }

    const weatherLine = weather
      ? `${weather.temp}°C, ${weather.condition}`
      : 'inconnue';

    const catalog = items
      .map(
        (c) =>
          `- id:${c.id} | catégorie:${c.category ?? '?'} | couleur:${
            c.dominant_color ?? '?'
          } | tags:${(c.style_tags ?? []).join(',') || '-'}`
      )
      .join('\n');

    const prompt = `Tu es un styliste. Voici la garde-robe d'un utilisateur :
${catalog}

Météo du jour : ${weatherLine}.

Compose ${count} tenues cohérentes et adaptées à la météo. Chaque tenue doit
combiner idéalement un haut + un bas + des chaussures, et éventuellement une
veste ou un accessoire s'ils conviennent. N'utilise QUE les id fournis ci-dessus.
Vérifie la compatibilité des couleurs et la cohérence de style.

Réponds STRICTEMENT en JSON avec ce format :
{"outfits":[{"clothes_ids":["id1","id2"],"rationale":"courte explication en français"}]}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Tu réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      return json({ error: `Groq error: ${text}` }, 502);
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content ?? '{}';
    let parsed: { outfits?: { clothes_ids: string[]; rationale?: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: 'Réponse IA illisible', outfits: [] }, 502);
    }

    const validIds = new Set(items.map((i) => i.id));
    const suggestions = (parsed.outfits ?? [])
      // Keep only outfits whose ids all exist in the wardrobe.
      .map((o) => ({
        clothes_ids: (o.clothes_ids ?? []).filter((id) => validIds.has(id)),
        rationale: o.rationale ?? '',
      }))
      .filter((o) => o.clothes_ids.length >= 2)
      .slice(0, count);

    if (suggestions.length === 0) {
      return json({ error: 'no_valid_outfit', outfits: [] }, 200);
    }

    // Persist each suggested outfit.
    const rows = suggestions.map((s) => ({
      user_id: userId,
      clothes_ids: s.clothes_ids,
      weather_context: weatherLine,
    }));
    const { data: inserted, error: insertErr } = await supabase
      .from('outfits')
      .insert(rows)
      .select();
    if (insertErr) return json({ error: insertErr.message }, 500);

    // Attach rationale back to the persisted rows (by order).
    const outfits = (inserted ?? []).map((row, i) => ({
      ...row,
      rationale: suggestions[i]?.rationale ?? '',
    }));

    return json({ outfits });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
