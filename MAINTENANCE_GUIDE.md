# Habeshagame.com — Dumb Maintenance Guide
**Last updated: May 2026 | Written for non-devs**

---

## The Big Picture (Read This First)

Your app has 3 moving parts:
1. **Files** — HTML/JS/CSS on Vercel (your website)
2. **Database** — Supabase (stores words, proverbs, scores, users)
3. **Payments** — Stripe (handles money, sends webhooks to Supabase)

When something breaks, it's always one of these three.

---

## Part 1 — Things to Do RIGHT NOW (One-Time Setup)

### Enable Leaked Password Protection (Critical — 1 minute)
1. Go to [supabase.com](https://supabase.com) → sign in
2. Click your project → **Authentication** (left sidebar) → **Settings**
3. Scroll to **"Password Security"**
4. Toggle ON **"Leaked Password Protection"**
5. Click Save

That's it. Prevents users signing up with passwords from known data breaches.

---

## Part 2 — Adding Content (Most Common Task)

### How to Add Words
1. Go to [habeshagame.com/admin.html](https://habeshagame.com/admin.html)
2. Log in with your admin email
3. Click the **"Words"** tab
4. Fill in: Tigrinya word, Latin spelling, English meaning, category, difficulty, tier
5. Click **"Add Word"**

That's it. Live immediately.

### How to Add Proverbs
Same as words but click the **"Proverbs"** tab instead.

### How to Add Heto Questions
1. Admin panel → **"Heto"** tab
2. Fill in: question (Tigrinya + Latin), all 4 options (A/B/C/D), correct answer, category, difficulty
3. Click **"Add Question"**

### How to Add Riddles
Admin panel → **"Riddles"** tab → same pattern.

---

## Part 3 — Deploying Updates (When You Edit Files)

### Normal Update (push to GitHub)
```
1. Edit files in VS Code / any editor
2. Save
3. Open terminal in your project folder
4. Type:  git add .
5. Type:  git commit -m "what you changed"
6. Type:  git push
7. Vercel auto-deploys in ~60 seconds
```

### Check If Deploy Worked
- Go to [vercel.com](https://vercel.com) → your project → **Deployments**
- Green checkmark = success
- Red X = something broke → click it to see the error

### After Any Code Change — Bump the Service Worker
Open `sw.js`, change line 7:
```
const CACHE_VERSION = 'mayim-v35';  →  'mayim-v36'
```
This forces all users' browsers to refresh their cache. If you forget this, users may see the old version for days.

---

## Part 4 — Supabase (Database) Checks

### Monthly Check (5 minutes)
1. Go to [supabase.com](https://supabase.com) → your project
2. Click **"Table Editor"** — make sure tables still have data
3. Click **"Authentication"** → **"Users"** — see who's signed up
4. Click **"Logs"** → **"Edge Functions"** — look for red errors

### If Supabase Pauses Your Project
Supabase free tier pauses inactive projects after 7 days. If your site shows "Error connecting to database":
1. Go to supabase.com → your project
2. Click the green **"Restore Project"** button
3. Wait 2 minutes
4. Site works again

**Fix permanently:** Upgrade to Pro plan ($25/month) or just restore it manually when it happens.

### Generate New Unlock Codes
Run this in Supabase → **SQL Editor**:
```sql
-- Replace 'gasha' with the pack slug you want
-- Replace 10 with how many codes you want
SELECT * FROM mint_pack_codes('gasha', 10);
```
Copy the codes that appear — they're only shown ONCE. Store them somewhere safe.

---

## Part 5 — Stripe (Payments)

### Check Revenue
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Homepage shows today's revenue, MRR, etc.

### If a Customer Says Their Payment Didn't Work
1. Stripe Dashboard → **Customers** → search their email
2. Check if the payment shows as "Succeeded" or "Failed"
3. If succeeded but they don't have access: go to admin.html → **Grants** tab → manually grant them the pack

### Manual Grant (for customer support)
1. Admin panel → **"Grants"** tab
2. Enter user email, select game pass
3. Click **"Grant Access"**
4. Done — they have access immediately

### Check Webhook Health
1. Stripe Dashboard → **Developers** → **Webhooks**
2. Your endpoint should show recent events
3. Green = working. Red = something broke, check Supabase Edge Function logs

---

## Part 6 — Auth Email Templates (Customize Branding)

Your password reset emails currently look generic. To brand them:
1. Supabase → **Authentication** → **Email Templates**
2. You'll see: **"Confirm signup"**, **"Reset password"**, **"Magic Link"**

### Paste this for "Reset Password" email:
```html
<h2>Reset your Habeshagame password</h2>

<p>Hi there,</p>

<p>Someone requested a password reset for your Habeshagame account.</p>

<p><a href="{{ .ConfirmationURL }}" style="background:#e53935;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">Reset Password</a></p>

<p>If you didn't request this, ignore this email — your password won't change.</p>

<p>— The Habeshagame Team<br>
<small>habeshagame.com · ሕቶ · ምስላ · ማይም</small></p>
```

### Paste this for "Confirm Signup" email:
```html
<h2>Welcome to Habeshagame! ሰላም 👋</h2>

<p>Thanks for joining Tigrinya Party Games.</p>

<p>Click below to confirm your email and start playing:</p>

<p><a href="{{ .ConfirmationURL }}" style="background:#e53935;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">Confirm Email</a></p>

<p>Once confirmed, you can unlock packs and track your scores.</p>

<p>— The Habeshagame Team<br>
<small>habeshagame.com</small></p>
```

---

## Part 7 — When Things Break

### Site Won't Load
1. Check [vercel.com](https://vercel.com) — is the latest deploy green?
2. Check [supabase.com](https://supabase.com) — is the project running (not paused)?
3. Check browser console (F12 → Console) — any red errors?

### "Words not loading" / Game is Empty
- Supabase might be paused → restore it (see Part 4)
- Or the words.js static file is broken → check Vercel logs

### Admin Panel Not Loading
- Your session expired → log out, log back in
- Or there's a JS error → F12 → Console to see the error

### Payments Not Working
- Stripe webhooks might be failing → Stripe Dashboard → Developers → Webhooks → check recent events
- Or your Supabase Edge Function crashed → Supabase → Logs → Edge Functions

### "502 Bad Gateway" or "500 Internal Server Error"
- This is almost always Supabase being paused
- Go to supabase.com → restore project → wait 2 min

---

## Part 8 — Costs & Billing Summary

| Service | Plan | Monthly Cost | What Happens If You Stop Paying |
|---------|------|-------------|----------------------------------|
| Vercel | Hobby (free) or Pro | £0 or £20 | Free tier: site still works, slower builds |
| Supabase | Free or Pro | £0 or £25 | Free: project pauses after 7 days inactivity |
| Stripe | Pay-as-you-go | 2.9% + 30p per transaction | Nothing changes, you just don't process payments |
| Google Domains | Standard | ~£12/year | Domain expires, site unreachable |

**Minimum to keep site live:** Just pay for the domain (~£1/month).

---

## Part 9 — Files & What They Do

```
habeshagame.com/
├── index.html          ← Home page (game cards, pack showcase)
├── game.html           ← Mayim & Misla (word guessing + proverbs)
├── heto.html           ← Heto (trivia questions)
├── hinqle.html         ← Hinqle Hinqilitey (riddles)
├── admin.html          ← Your admin panel (don't share this URL)
├── profile.html        ← User profile / pack unlocking
├── app.js              ← All game logic
├── style.css           ← All styling
├── words.js            ← Static word list (backup/offline)
├── proverbs.js         ← Static proverb list (backup/offline)
├── packs.js            ← Pack/tier metadata
├── sw.js               ← Service worker (offline caching) ← BUMP VERSION AFTER CHANGES
├── manifest.json       ← PWA config
├── vercel.json         ← Security headers + routing rules
└── supabase/
    └── functions/      ← Server-side code (payments, validation)
```

---

## Part 10 — Useful Links

| What | URL |
|------|-----|
| Your site | https://habeshagame.com |
| Admin panel | https://habeshagame.com/admin.html |
| Vercel dashboard | https://vercel.com |
| Supabase dashboard | https://supabase.com |
| Stripe dashboard | https://dashboard.stripe.com |
| GitHub repo | https://github.com (your repo) |

---

## Part 11 — Security Fixes Applied (May 2026)

The following were fixed by your developer. No action needed, just for reference:

- ✅ `mint_pack_codes` function search_path locked (SQL injection prevention)
- ✅ Public execute revoked on internal functions
- ✅ `user_pack_unlocks` RLS fixed — users can only see their own unlocks (was leaking)
- ✅ `words` RLS fixed — premium words now genuinely gated (old blanket "Allow public read" removed)
- ✅ `proverbs` RLS fixed — same fix, premium proverbs gated properly
- ⚠️ **TODO:** Enable Leaked Password Protection in Supabase → Auth → Settings (1-click)

---

*Keep this file. Read it before panicking.*
