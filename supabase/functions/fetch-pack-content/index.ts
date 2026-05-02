import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return err('Method not allowed', 405);

  // ── Auth ──────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return err('Not authenticated', 401);

  const sbAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
  if (authErr || !user) return err('Not authenticated', 401);

  // ── Parse ─────────────────────────────────────────────────
  let body: { pack_slug: string };
  try { body = await req.json(); } catch { return err('Invalid JSON', 400); }

  const { pack_slug } = body;
  if (!pack_slug || pack_slug === 'gasha' || pack_slug === 'classic') return err('Invalid pack', 400);

  // ── Service-role client to read premium content ───────────
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Look up pack
  const { data: pack, error: packErr } = await sb
    .from('packs').select('id').eq('slug', pack_slug).single();
  if (packErr || !pack) return err('Pack not found', 404);

  // Verify user has an ACTIVE unlock (subscription_status must be active or one_time,
  // not cancelled or past_due).
  const { data: unlock } = await sb
    .from('user_pack_unlocks')
    .select('id, subscription_status')
    .eq('user_id', user.id)
    .eq('pack_id', pack.id)
    .maybeSingle();

  if (!unlock) return err('Not unlocked', 403);

  // Reject if subscription has been cancelled
  if (unlock.subscription_status === 'cancelled') {
    return err('Subscription cancelled', 402);
  }

  // Fetch words + proverbs
  const [{ data: words }, { data: proverbs }] = await Promise.all([
    sb.from('words').select('word,latin,english,category').eq('pack_id', pack.id),
    sb.from('proverbs').select('tigrinya,latin,english,difficulty').eq('pack_id', pack.id),
  ]);

  return new Response(JSON.stringify({
    success:             true,
    pack_slug,
    subscription_status: unlock.subscription_status,
    words:               words    ?? [],
    proverbs:            proverbs ?? [],
  }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});

function err(msg: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
