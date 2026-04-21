import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

// ── Map pack slugs → Stripe Price IDs ─────────────────────
// Prefer environment variables so staging/test/prod can ship different Price IDs
// without a code change. Hardcoded values are production fallbacks so existing
// deployments keep working if the env vars are unset.
const PRICE_IDS: Record<string, string> = {
  // New slug names (v3) — same Stripe Price IDs, only map keys renamed
  qola:      Deno.env.get('STRIPE_PRICE_QOLA')      ?? Deno.env.get('STRIPE_PRICE_INTERMEDIATE') ?? 'price_1TNLrDFP5Lu45Y0rsGi5Kc5p',   // Qol'a / Level 2 (live)
  gobez:     Deno.env.get('STRIPE_PRICE_GOBEZ')     ?? Deno.env.get('STRIPE_PRICE_ADVANCED')     ?? 'price_1TNLs6FP5Lu45Y0rJmxwQrua',   // Gobez / Level 3 (live)
  shimagile: Deno.env.get('STRIPE_PRICE_SHIMAGILE') ?? Deno.env.get('STRIPE_PRICE_EXPERT')       ?? 'price_1TNLsdFP5Lu45Y0rQcimAvV4',   // Shimagile / Level 4 (live)
};

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://habeshagame.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return err('Method not allowed', 405);

  // ── Verify the user is logged in ──────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return err('Not authenticated', 401);

  const sbAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
  if (authErr || !user) return err('Not authenticated', 401);

  // ── Parse body ────────────────────────────────────────────
  let body: { pack_slug: string };
  try { body = await req.json(); } catch { return err('Invalid JSON', 400); }

  const { pack_slug } = body;
  const priceId = PRICE_IDS[pack_slug];
  if (!priceId) return err('Unknown pack', 400);

  // ── Create Stripe Checkout Session ────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',           // one-time purchase
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { pack_slug, user_id: user.id },
    customer_email: user.email,
    success_url: `${SITE_URL}/game.html?payment=success&slug=${pack_slug}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${SITE_URL}/game.html?payment=cancelled`,
    // Collect billing address for VAT/tax compliance
    billing_address_collection: 'auto',
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});

function err(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
