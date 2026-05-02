import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

// ── Cascade map: buying X also unlocks these slugs ────────────────────────
// Game passes unlock all tiers for their game.
// All-games bundle unlocks every game pass + every tier pack.
const CASCADE: Record<string, string[]> = {
  // Shimagile is now the single full-unlock tier.
  // Legacy slugs kept so existing customers who bought qola/gobez keep access.
  shimagile:    [],                     // full unlock — no further cascade needed
  gobez:        [],                     // legacy (maps to shimagile-level content)
  qola:         [],                     // legacy
  expert:       [],                     // legacy slug alias
  advanced:     [],                     // legacy slug alias
  intermediate: [],                     // legacy slug alias

  // Game passes — mayim-pass unlocks shimagile (the full tier)
  'mayim-pass':  ['shimagile'],
  'hito-pass':   [],                               // standalone — checked by slug
  'hinqle-pass': [],                               // standalone — checked by slug

  // All-games bundle — cascades EVERYTHING
  'all-games':   ['shimagile', 'mayim-pass', 'hito-pass', 'hinqle-pass'],
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // ── Verify Stripe signature ───────────────────────────────────────────────
  const sig     = req.headers.get('stripe-signature');
  const rawBody = await req.text();
  const secret  = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!sig || !secret) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Webhook signature failed:', msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const pack_slug = session.metadata?.pack_slug;
  const user_id   = session.metadata?.user_id ?? session.client_reference_id;

  if (!pack_slug || !user_id) {
    console.error('Missing metadata — session:', session.id);
    return new Response('Missing metadata', { status: 400 });
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── Unlock the purchased pack + all cascade slugs ─────────────────────────
  const slugsToUnlock = [pack_slug, ...(CASCADE[pack_slug] ?? [])];

  for (const slug of slugsToUnlock) {
    // Resolve pack_id from slug (game passes are now real packs in DB)
    const { data: pack, error: packErr } = await sb
      .from('packs').select('id').eq('slug', slug).single();

    if (packErr || !pack) {
      console.warn(`Pack not found for slug: ${slug} — skipping`);
      continue;
    }

    // Idempotency check
    const { data: existing } = await sb
      .from('user_pack_unlocks')
      .select('id')
      .eq('user_id', user_id)
      .eq('pack_id', pack.id)
      .maybeSingle();

    if (!existing) {
      const method = slug === pack_slug ? 'stripe' : 'cascade';
      const { error: insertErr } = await sb.from('user_pack_unlocks').insert({
        user_id,
        pack_id:           pack.id,
        stripe_session_id: slug === pack_slug ? session.id : null,
        payment_method:    method,
        unlocked_at:       new Date().toISOString(),
      });

      if (insertErr) {
        console.error(`Failed to record unlock for ${slug}:`, insertErr);
      } else {
        console.log(`✓ ${method === 'stripe' ? 'Unlocked' : 'Cascade-unlocked'} "${slug}" for user ${user_id}`);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
