import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Admin whitelist ────────────────────────────────────────
const ADMIN_EMAILS = ['mnahom23@gmail.com', 'nahom.developer@gmail.com'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return err('Method not allowed', 405);

  // ── Verify caller is an admin ──────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return err('Not authenticated', 401);

  const sbAnon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await sbAnon.auth.getUser();
  if (authErr || !user) return err('Not authenticated', 401);
  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) return err('Forbidden', 403);

  // ── Parse body ─────────────────────────────────────────
  let body: { target_email: string; pack_slug: string };
  try { body = await req.json(); } catch { return err('Invalid JSON', 400); }

  const { target_email, pack_slug } = body;
  if (!target_email || !pack_slug) return err('target_email and pack_slug required', 400);

  // ── Service role client for privileged ops ─────────────
  const sbAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── Look up target user by email ───────────────────────
  const { data: usersData, error: listErr } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return err('Could not look up users: ' + listErr.message, 500);

  const targetUser = usersData?.users?.find(
    u => u.email?.toLowerCase() === target_email.toLowerCase()
  );
  if (!targetUser) return err(`No account found for ${target_email} — they must sign up first`, 404);

  // ── Look up pack ───────────────────────────────────────
  const { data: pack, error: packErr } = await sbAdmin
    .from('packs')
    .select('id, name_en')
    .eq('slug', pack_slug)
    .single();
  if (packErr || !pack) return err('Unknown pack: ' + pack_slug, 404);

  // ── Check if already unlocked ──────────────────────────
  const { data: existing } = await sbAdmin
    .from('user_pack_unlocks')
    .select('id')
    .eq('user_id', targetUser.id)
    .eq('pack_id', pack.id)
    .maybeSingle();
  if (existing) return ok({ message: `${target_email} already has access to ${pack.name_en}` });

  // ── Grant access ───────────────────────────────────────
  const { error: insertErr } = await sbAdmin.from('user_pack_unlocks').insert({
    user_id:        targetUser.id,
    pack_id:        pack.id,
    payment_method: 'manual',
  });
  if (insertErr) return err('Failed to grant: ' + insertErr.message, 500);

  // ── Cascade: granting higher tier also grants lower paid tiers ──
  const CASCADE: Record<string, string[]> = {
    shimagile:    ['qola', 'gobez'],
    gobez:        ['qola'],
    qola:         [],
    // legacy slug names for safety
    expert:       ['qola', 'gobez'],
    advanced:     ['qola'],
    intermediate: [],
  };
  const slugsToGrant = CASCADE[pack_slug] ?? [];
  const cascaded: string[] = [];

  for (const slug of slugsToGrant) {
    const { data: lowerPack } = await sbAdmin
      .from('packs').select('id, name_en').eq('slug', slug).single();
    if (!lowerPack) continue;

    const { data: alreadyHas } = await sbAdmin
      .from('user_pack_unlocks')
      .select('id')
      .eq('user_id', targetUser.id)
      .eq('pack_id', lowerPack.id)
      .maybeSingle();

    if (!alreadyHas) {
      await sbAdmin.from('user_pack_unlocks').insert({
        user_id:        targetUser.id,
        pack_id:        lowerPack.id,
        payment_method: 'cascade',
      });
      cascaded.push(lowerPack.name_en);
    }
  }

  const extra = cascaded.length > 0 ? ` (also granted: ${cascaded.join(', ')})` : '';
  return ok({ message: `✓ ${pack.name_en} granted to ${target_email}${extra}` });
});

function ok(body: object) {
  return new Response(JSON.stringify({ ...body, success: true }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
function err(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
