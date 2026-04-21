import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // ── Verify Stripe signature ───────────────────────────────
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

  // ── Handle checkout completion ────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only handle paid sessions
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

    // Resolve pack_id from slug
    const { data: pack, error: packErr } = await sb
      .from('packs').select('id').eq('slug', pack_slug).single();

    if (packErr || !pack) {
      console.error('Pack not found:', pack_slug);
      return new Response('Pack not found', { status: 400 });
    }

    // Idempotency check — don't double-unlock
    const { data: existing } = await sb
      .from('user_pack_unlocks')
      .select('id')
      .eq('user_id', user_id)
      .eq('pack_id', pack.id)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await sb.from('user_pack_unlocks').insert({
        user_id,
        pack_id:          pack.id,
        stripe_session_id: session.id,
        payment_method:   'stripe',
        unlocked_at:      new Date().toISOString(),
      });

      if (insertErr) {
        console.error('Failed to record unlock:', insertErr);
        return new Response('DB error', { status: 500 });
      }
      console.log(`✓ Unlocked ${pack_slug} for user ${user_id}`);
    }

    // ── Cascade: higher tiers auto-unlock all lower paid tiers ──
    // Tier order: qola (L2) → gobez (L3) → shimagile (L4)
    // Buying Shimagile = get Qol'a + Gobez free.
    // Buying Gobez = get Qol'a free.
    const CASCADE: Record<string, string[]> = {
      shimagile:    ['qola', 'gobez'],
      gobez:        ['qola'],
      qola:         [],
      // legacy slug names (in case any existing webhook events reference them)
      expert:       ['qola', 'gobez'],
      advanced:     ['qola'],
      intermediate: [],
    };
    const slugsToGrant = CASCADE[pack_slug] ?? [];

    for (const slug of slugsToGrant) {
      const { data: lowerPack } = await sb
        .from('packs').select('id').eq('slug', slug).single();
      if (!lowerPack) continue;

      const { data: alreadyHas } = await sb
        .from('user_pack_unlocks')
        .select('id')
        .eq('user_id', user_id)
        .eq('pack_id', lowerPack.id)
        .maybeSingle();

      if (!alreadyHas) {
        await sb.from('user_pack_unlocks').insert({
          user_id,
          pack_id:        lowerPack.id,
          payment_method: 'cascade',       // marks as automatically granted
          unlocked_at:    new Date().toISOString(),
        });
        console.log(`✓ Cascade-unlocked ${slug} for user ${user_id} (bought ${pack_slug})`);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
