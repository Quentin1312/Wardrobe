// Supabase Edge Function: suggest-outfits
// Analyzes the user's wardrobe + current weather with Groq (Llama) and
// returns 2-3 coherent outfits, persisting them to the `outfits` table.
//
// Deploy:  supabase functions deploy suggest-outfits
// Secret:  supabase secrets set GROQ_API_KEY=xxx
//
// The client sends either a day request or
// { mode: 'week', days: [{ date: 'YYYY-MM-DD', weather: {...} | null }] }.
// and its user JWT in the Authorization header.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;
const GROQ_MODEL = 'openai/gpt-oss-120b';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ClothingRow {
  id: string;
  name: string | null;
  category: string | null;
  dominant_color: string | null;
  style_tags: string[] | null;
  dirty: boolean | null;
}

/** Hex → French colour name, so the stylist reads "bleu marine" not "#273659". */
function colorFr(hex: string | null): string | null {
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
  if (l < 0.15) return 'noir';
  if (l > 0.9 && s < 0.3) return 'blanc';
  if (s < 0.13) return l > 0.66 ? 'gris clair' : l > 0.34 ? 'gris' : 'anthracite';
  if (h >= 20 && h < 50 && s < 0.5 && l > 0.62) return 'beige';
  if (h >= 10 && h < 45 && l < 0.4) return 'marron';
  if (h >= 22 && h < 45 && l <= 0.62) return 'camel';
  if (h < 10 || h >= 345) return l < 0.32 ? 'bordeaux' : 'rouge';
  if (h < 38) return 'orange';
  if (h >= 45 && h < 100 && s < 0.5 && l < 0.5) return 'kaki';
  if (h < 65) return 'jaune';
  if (h < 170) return l < 0.3 ? 'vert foncé' : 'vert';
  if (h < 195) return 'bleu canard';
  if (h < 255) return l < 0.3 ? 'bleu marine' : l > 0.7 ? 'bleu clair' : s < 0.5 ? 'bleu jean' : 'bleu';
  if (h < 290) return 'violet';
  return 'rose';
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

    const { weather, count = 3, mode = 'day', days = [] } = await req.json().catch(() => ({}));

    const { data: clothes, error: clothesErr } = await supabase
      .from('clothes')
      .select('id, name, category, dominant_color, style_tags, dirty')
      .eq('user_id', userId);
    if (clothesErr) return json({ error: clothesErr.message }, 500);

    const wardrobe = (clothes ?? []) as ClothingRow[];
    // Dirty laundry is not available to wear today.
    const items = wardrobe.filter((c) => !c.dirty);
    if (items.length < 2) {
      return json({ error: 'not_enough_items', outfits: [] }, 200);
    }

    const weatherLine = weather
      ? `${weather.temp}°C, ${weather.condition}`
      : 'inconnue';

    const weekDays = Array.isArray(days)
      ? days
          .filter((day) => typeof day?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day.date))
          .slice(0, 7)
      : [];
    const isWeek = mode === 'week' && weekDays.length > 0;

    const catalog = items
      .map(
        (c) =>
          `- id:${c.id} | ${c.name ? `nom:"${c.name}" | ` : ''}catégorie:${c.category ?? '?'} | couleur:${
            colorFr(c.dominant_color) ?? '?'
          } | tags:${(c.style_tags ?? []).join(',') || '-'}`
      )
      .join('\n');

    // The user's taste: looks they liked or wore, and looks they turned down.
    const byId = new Map(wardrobe.map((c) => [c.id, c]));
    const describe = (ids: string[] | null) =>
      (ids ?? [])
        .map((id) => byId.get(id))
        .filter((c): c is ClothingRow => Boolean(c))
        .map((c) => `${c.name ?? c.category ?? 'pièce'} (${c.category ?? '?'}, ${colorFr(c.dominant_color) ?? '?'})`)
        .join(' + ');
    const { data: history } = await supabase
      .from('outfits')
      .select('clothes_ids, liked')
      .eq('user_id', userId)
      .not('liked', 'is', null)
      .order('generated_at', { ascending: false })
      .limit(40);
    const pick = (liked: boolean, max: number) =>
      (history ?? [])
        .filter((o) => o.liked === liked)
        .map((o) => describe(o.clothes_ids))
        .filter(Boolean)
        .slice(0, max);
    const loved = pick(true, 10);
    const refused = pick(false, 6);
    const tasteParts: string[] = [];
    if (loved.length) tasteParts.push(`Tenues aimées ou portées :\n${loved.map((l) => `- ${l}`).join('\n')}`);
    if (refused.length) tasteParts.push(`Tenues refusées :\n${refused.map((l) => `- ${l}`).join('\n')}`);
    const taste = tasteParts.length
      ? `\nGoûts de l'utilisateur (à respecter) :\n${tasteParts.join('\n')}\nInspire-toi des associations aimées (couleurs, styles) sans les recopier à l'identique, et évite ce qui ressemble aux tenues refusées.\n`
      : '';

    const assignment = isWeek
      ? `Planifie exactement une tenue pour chacun de ces jours :\n${weekDays
          .map((day) => `- ${day.date} : ${day.weather ? `${day.weather.temp}°C, ${day.weather.condition}` : 'météo inconnue'}`)
          .join('\n')}\n\nDiversifie la semaine et évite de réutiliser les mêmes pièces quand la garde-robe le permet.`
      : `Météo du jour : ${weatherLine}.\n\nCompose ${Math.min(Number(count) || 3, 7)} tenues cohérentes et adaptées à la météo.`;

    const outputShape = isWeek
      ? '{"outfits":[{"planned_for":"YYYY-MM-DD","clothes_ids":["id1","id2"],"rationale":"courte explication en français"}]}'
      : '{"outfits":[{"clothes_ids":["id1","id2"],"rationale":"courte explication en français"}]}';

    const prompt = `Tu es un styliste. Voici la garde-robe d'un utilisateur :
${catalog}
${taste}
${assignment}

Chaque tenue doit
combiner idéalement un haut + un bas + des chaussures, et éventuellement une
veste ou un accessoire s'ils conviennent. N'utilise QUE les id fournis ci-dessus.
Vérifie la compatibilité des couleurs et la cohérence de style.

Réponds STRICTEMENT en JSON avec ce format :
${outputShape}`;

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
    let parsed: { outfits?: { planned_for?: string; clothes_ids: string[]; rationale?: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: 'Réponse IA illisible', outfits: [] }, 502);
    }

    const validIds = new Set(items.map((i) => i.id));
    const requestedDates = new Set(weekDays.map((day) => day.date));
    const suggestions = (parsed.outfits ?? [])
      // Keep only outfits whose ids all exist in the wardrobe.
      .map((o) => ({
        planned_for: isWeek && requestedDates.has(o.planned_for ?? '') ? o.planned_for! : null,
        clothes_ids: (o.clothes_ids ?? []).filter((id) => validIds.has(id)),
        rationale: o.rationale ?? '',
      }))
      .filter((o) => o.clothes_ids.length >= 2 && (!isWeek || o.planned_for));

    const uniqueSuggestions = isWeek
      ? suggestions.filter(
          (suggestion, index, all) =>
            all.findIndex((candidate) => candidate.planned_for === suggestion.planned_for) === index
        )
      : suggestions.slice(0, Math.min(Number(count) || 3, 7));

    if (uniqueSuggestions.length === 0) {
      return json({ error: 'no_valid_outfit', outfits: [] }, 200);
    }

    if (isWeek) {
      const dates = uniqueSuggestions.map((suggestion) => suggestion.planned_for!);
      const { error: deleteErr } = await supabase
        .from('outfits')
        .delete()
        .eq('user_id', userId)
        .eq('plan_scope', 'week')
        .in('planned_for', dates);
      if (deleteErr) return json({ error: deleteErr.message }, 500);
    }

    // Persist each suggested outfit.
    const rows = uniqueSuggestions.map((s) => ({
      user_id: userId,
      clothes_ids: s.clothes_ids,
      weather_context: isWeek
        ? (() => {
            const day = weekDays.find((candidate) => candidate.date === s.planned_for);
            return day?.weather ? `${day.weather.temp}°C, ${day.weather.condition}` : null;
          })()
        : weatherLine,
      plan_scope: isWeek ? 'week' : 'day',
      planned_for: isWeek ? s.planned_for : null,
      rationale: s.rationale,
    }));
    const { data: inserted, error: insertErr } = await supabase
      .from('outfits')
      .insert(rows)
      .select();
    if (insertErr) return json({ error: insertErr.message }, 500);

    // Attach rationale back to the persisted rows (by order).
    const outfits = (inserted ?? []).map((row, i) => ({
      ...row,
      rationale: uniqueSuggestions[i]?.rationale ?? '',
    }));

    return json({ outfits });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
