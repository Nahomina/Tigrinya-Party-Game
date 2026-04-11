// validate-code — Supabase Edge Function
// 1. Extracts user_id from JWT Authorization header
// 2. Verifies Gumroad license key (increments use count to prevent sharing)
// 3. Binds code to user account in user_pack_unlocks table
// 4. Returns pack content from Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtDecode } from 'https://esm.sh/jwt-decode@4.0.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://tigrinya-party-game.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Map pack slug → Gumroad product permalink
// Update these when you create the Gumroad products
const PACK_PERMALINKS: Record<string, string> = {
  hadar:  'xzcczm',  // nahomworks0.gumroad.com/l/xzcczm ✅
  adi:    '',        // add permalink once product created
  weledo: '',        // add permalink once product created
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  // ── Extract user_id from Authorization header ────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('Unauthorized: Missing authorization header', 401);
  }

  let userId: string;
  try {
    const token = authHeader.slice(7); // Remove 'Bearer '
    const decoded = jwtDecode<{ sub: string }>(token);
    userId = decoded.sub;
  } catch {
    return jsonError('Unauthorized: Invalid token', 401);
  }

  let body: { code?: string; pack_slug?: string };
  try { body = await req.json(); }
  catch { return jsonError('Invalid JSON body', 400); }

  const { code, pack_slug } = body;
  if (!code || typeof code !== 'string' || code.trim().length < 8) return jsonError('Invalid code', 400);
  if (!pack_slug || !PACK_PERMALINKS.hasOwnProperty(pack_slug)) return jsonError('Invalid pack', 400);

  const permalink = PACK_PERMALINKS[pack_slug];
  if (!permalink) return jsonError('Pack not available yet', 404);

  // ── Hash the submitted code (SHA-256) ────────────────────────────────
  const encoded = new TextEncoder().encode(code.trim().toUpperCase());
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  const codeHash = Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // ── Verify with Gumroad API (increment_uses_count: true prevents sharing) ─
  const gumroadRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      product_permalink: permalink,
      license_key: code.trim(),
      increment_uses_count: 'true',  // ← Changed from 'false': mark code as used globally
    }),
  });

  const gumroadData = await gumroadRes.json();

  if (!gumroadData.success) {
    await delay(400 + Math.random() * 200); // timing-attack prevention
    return jsonError('Invalid or already used code', 403);
  }

  // ── Fetch content from Supabase (service_role bypasses RLS) ──────
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const { data: packRow } = await sb.from('packs').select('id').eq('slug', pack_slug).single();
  if (!packRow) return jsonError('Pack config error', 500);

  // ── Bind code to user account ────────────────────────────────────────
  // Check if user already unlocked this code
  const { data: existingUnlock } = await sb
    .from('user_pack_unlocks')
    .select('id')
    .eq('user_id', userId)
    .eq('code_hash', codeHash)
    .eq('pack_id', packRow.id)
    .single();

  // If this is a new unlock, insert into user_pack_unlocks
  if (!existingUnlock) {
    const { error: insertError } = await sb
      .from('user_pack_unlocks')
      .insert({
        user_id: userId,
        pack_id: packRow.id,
        code_hash: codeHash,
      });

    if (insertError) {
      console.error('Failed to insert unlock:', insertError);
      return jsonError('Failed to record unlock', 500);
    }
  }

  // ── Fetch pack content ──────────────────────────────────────────────
  const { data: proverbs, error: proverbsErr } = await sb
    .from('proverbs')
    .select('tigrinya, latin, english, difficulty')
    .eq('pack_id', packRow.id);

  if (proverbsErr) return jsonError('Error fetching content', 500);

  const { data: words } = await sb
    .from('words')
    .select('word, latin, english, category')
    .eq('pack_id', packRow.id);

  return new Response(
    JSON.stringify({ success: true, pack_slug, words: words ?? [], proverbs: proverbs ?? [] }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
});

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
