// Checks that the user's try-on photo is usable: one person, full body, facing
// the camera, clearly visible. Cheap vision call (fraction of a cent).
// Secret: OPENAI_API_KEY (shared with studio-photo / generate-tryon)
// Optional: OPENAI_JUDGE_MODEL (default gpt-5-mini)
// Deploy: supabase functions deploy check-body-photo

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const JUDGE_MODEL = Deno.env.get('OPENAI_JUDGE_MODEL') ?? 'gpt-5-mini';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CODES = [
  'no_person',
  'several_people',
  'not_full_body',
  'not_facing_front',
  'face_hidden',
  'mirror_selfie',
  'arms_covering_body',
  'bulky_clothes',
  'too_dark',
  'blurry',
] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY is not configured' }, 503);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);

    // Always check the caller's own stored photo, never an arbitrary URL.
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', userData.user.id)
      .single();
    const url = profile?.profile_photo_url;
    if (!url) return json({ error: 'profile_photo_required' }, 400);

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
                text: [
                  'This photo will be used for a virtual try-on: the AI will dress this person in other clothes.',
                  'It is GOOD if: exactly one person, the whole body visible from head to feet, standing and facing the camera, face visible, arms relaxed and slightly away from the body, reasonably fitted clothes, decent light and focus.',
                  `List the problems among these codes only: ${CODES.join(', ')}.`,
                  '"not_full_body" if the head or the feet are cut off or the person is sitting. "bulky_clothes" only for a big coat/dress that hides the body shape. Be tolerant: a slightly imperfect but usable photo has no problem.',
                  'Answer ONLY with JSON: {"issues":[]}',
                ].join('\n'),
              },
              { type: 'image_url', image_url: { url } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return json({ error: err?.error?.message ?? `openai error ${res.status}` }, 502);
    }
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}');
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.filter((c: string) => (CODES as readonly string[]).includes(c))
      : [];
    return json({ issues });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'unknown_error' }, 500);
  }
});
