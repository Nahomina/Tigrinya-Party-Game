import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

// ── Price ID map ───────────────────────────────────────────────────────────
// Set STRIPE_PRICE_<SLUG_UPPER> env vars in Supabase dashboard to override.
// Format: STRIPE_PRICE_MAYIM_PASS, STRIPE_PRICE_ALL_GAMES, etc.
const PRICE_IDS: Record<string, string> = {
  // ── Legacy per-tier packs (kept for existing customers) ─────────────────
  qola:      Deno.env.get('STRIPE_PRICE_QOLA')      ?? 'price_1TNLrDFP5Lu45Y0rsGi5Kc5p',
  gobez:     Deno.env.get('STRIPE_PRICE_GOBEZ')     ?? 'price_1TNLs6FP5Lu45Y0rJmxwQrua',
  shimagile: Deno.env.get('STRIPE_PRICE_SHIMAGILE') ?? 'price_1TNLsdFP5Lu45Y0rQcimAvV4',

  // ── Game Passes (£4.99 each) — set these in Stripe dashboard ────────────
  // Create 4 products in Stripe → Products → Add product:
  //   "MAYIM & MISLA Game Pass"         £4.99 one-time
  //   "HITO Game Pass"                  £4.99 one-time
  //   "Hinqle Hinqilitey Game Pass"     £4.99 one-time
  //   "All Games — Forever"             £12.99 one-time
  // Then paste the Price IDs in Supabase → Settings → Edge Functions → Secrets
  'mayim-pass':  Deno.env.get('STRIPE_PRICE_MAYIM_PASS')  ?? '',
  'hito-pass':   Deno.env.get('STRIPE_PRICE_HITO_PASS')   ?? '',
  'hinqle-pass': Deno.env.get('STRIPE_PRICE_HINQLE_PASS') ?? '',
  'all-games':   Deno.env.get('STRIPE_PRICE_ALL_GAMES')   ?? '',
};

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://habeshagame.com';

// ── Return URL per slug ────────────────────────────────────────────────────
const RETURN_PAGE: Record<string, string> = {
  'mayim-pass':  'game.html',
  'hito-pass':   'heto.html',
  'hinqle-pass': 'riddles.html',
  'all-games':   'index.html',
  qola:          'game.html',
  gobez:         'game.html',
  shimagile:     'game.html',
};

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST')   return err('Method not allowed', 405);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return err('Not authenticated', 401);

  const sbAuth = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
  if (authErr || !user) return err('Not authenticated', 401);

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { pack_slug: string };
  try { body = await req.json(); } catch { return err('Invalid JSON', 400); }

  const { pack_slug } = body;
  const priceId = PRICE_IDS[pack_slug];
  if (!priceId) return err(`Unknown or unconfigured pack: ${pack_slug}`, 400);

  const returnPage = RETURN_PAGE[pack_slug] ?? 'index.html';

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode:       'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata:   { pack_slug, user_id: user.id },
    customer_email: user.email,
    success_url: `${SITE_URL}/${returnPage}?payment=success&slug=${pack_slug}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${SITE_URL}/${returnPage}?payment=cancelled`,
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
