import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

// ── Subscription (recurring monthly) Price IDs ──────────────────────────────
const PRICE_IDS: Record<string, string> = {
  // ── Full-tier unlock (subscription) ─────────────────────────────────────
  shimagile:     Deno.env.get('STRIPE_PRICE_SHIMAGILE_SUB') ?? 'price_1TSPueFP5Lu45Y0r7kyicaCg',

  // ── Game Pass subscriptions ──────────────────────────────────────────────
  'mayim-pass':  Deno.env.get('STRIPE_PRICE_MAYIM_PASS_SUB')  ?? 'price_1TSPufFP5Lu45Y0rpKOQPpR0',
  'hito-pass':   Deno.env.get('STRIPE_PRICE_HITO_PASS_SUB')   ?? 'price_1TSPufFP5Lu45Y0rKshjm40r',
  'hinqle-pass': Deno.env.get('STRIPE_PRICE_HINQLE_PASS_SUB') ?? 'price_1TQAG9FP5Lu45Y0rU75wxdWQ',
  'all-games':   Deno.env.get('STRIPE_PRICE_ALL_GAMES_SUB')   ?? 'price_1TSPufFP5Lu45Y0r71lCUM84',

  // ── Legacy one-time slugs (kept so old links don't break) ────────────────
  qola:          Deno.env.get('STRIPE_PRICE_MAYIM_PASS_SUB')  ?? 'price_1TSPufFP5Lu45Y0rpKOQPpR0',
  gobez:         Deno.env.get('STRIPE_PRICE_MAYIM_PASS_SUB')  ?? 'price_1TSPufFP5Lu45Y0rpKOQPpR0',
};

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://habeshagame.com';

// ── Return URL per slug ────────────────────────────────────────────────────
const RETURN_PAGE: Record<string, string> = {
  'mayim-pass':  'game.html',
  'hito-pass':   'heto.html',
  'hinqle-pass': 'riddles.html',
  'all-games':   'index.html',
  shimagile:     'game.html',
  qola:          'game.html',
  gobez:         'game.html',
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

  // ── Create Stripe Checkout Session (subscription mode) ────────────────────
  const session = await stripe.checkout.sessions.create({
    mode:       'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata:   { pack_slug, user_id: user.id },
    customer_email: user.email,
    // Pass user_id through subscription metadata so the webhook can read it
    subscription_data: {
      metadata: { pack_slug, user_id: user.id },
    },
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
