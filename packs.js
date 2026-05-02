// packs.js — Pack / Tier catalogue  (v8)
// Slugs match the database — do NOT rename them.
// Premium content unlocked via Stripe payment only.
// Counts are exact — pulled from DB 2026-04-19.
//
// Tier structure: two levels only.
//   Level 1 — Gasha (Free)       : everyday starter content
//   Level 2 — Shimagile (Paid)   : full expert unlock — everything

const PACK_CATALOGUE = [
  {
    // ── LEVEL 1 ───────────────────────────────────────────────
    slug:          'gasha',
    tier:          'starter',
    sequenceOrder: 1,

    // Display
    nameGeez:    'ጋሻ',
    nameLatin:   'Gasha',
    nameEn:      'Gasha',
    tierLabel:   'Starter',
    icon:        '🟢',
    accentColor: '#43a047',

    description:  "The Guest. You're just arriving — core vocabulary & easy proverbs.",
    wordCount:    35,
    proverbCount: 68,

    priceGbp: 0,
    isFree:   true,

    wordProfile:    '35 words · everyday vocabulary',
    proverbProfile: '68 proverbs · easy to follow',
  },
  {
    // ── LEVEL 2 (Full Unlock) ─────────────────────────────────
    slug:          'shimagile',
    tier:          'expert',
    sequenceOrder: 2,

    nameGeez:    'ሽማግለ',
    nameLatin:   'Shimagile',
    nameEn:      'Shimagile',
    tierLabel:   'Expert',
    icon:        '🟠',
    accentColor: '#f4511e',

    description:  "The Village Elder. You are the person everyone asks — full vocab, all proverbs & cultural wisdom.",
    wordCount:    58,
    proverbCount: 104,

    priceGbp:         9.99,
    isFree:           false,
    soldIndividually: false,
    bundleSlug:       'mayim-pass',

    wordProfile:    'Full word pack · all levels unlocked',
    proverbProfile: 'Full proverb pack · advanced wisdom',
  },
];

// ── Game Pass Catalogue ──────────────────────────────────────────────────────
// One pass unlocks ALL paid tiers for a single game. Better value than buying
// individual packs. All-games bundle covers every game forever.
const GAME_PASS_CATALOGUE = [
  {
    slug:        'mayim-pass',
    game:        'mayim',           // also covers misla (shared packs)
    nameEn:      'MAYIM & MISLA Pass',
    nameGeez:    'ማይም ፓስ',
    nameLatin:   'Mayim Pass',
    icon:        '🔴',
    accentColor: '#e53935',
    description: "Unlock the full Shimagile tier for MAYIM (word guessing) and MISLA (proverbs) — every word & proverb unlocked.",
    priceGbp:    6.99,
    // Buying this cascades: shimagile (includes all content)
    cascadeSlugs: ['shimagile'],
  },
  {
    slug:        'hito-pass',
    game:        'hito',
    nameEn:      'HITO Pass',
    nameGeez:    'ሕቶ ፓስ',
    nameLatin:   'Hito Pass',
    icon:        '🟠',
    accentColor: '#f4511e',
    description: "Unlock all difficulty tiers for HITO trivia — Qol'a (medium) and Gobez (hard) questions.",
    priceGbp:    4.99,
    cascadeSlugs: [],
  },
  {
    slug:        'hinqle-pass',
    game:        'hinqle',
    nameEn:      'Hinqle Hinqilitey Pass',
    nameGeez:    'ሕንቅሊተይ ፓስ',
    nameLatin:   'Hinqle Pass',
    icon:        '🟢',
    accentColor: '#00897b',
    description: "Unlock all difficulty tiers for Hinqle Hinqilitey — Qol'a and Gobez riddles.",
    priceGbp:    4.99,
    cascadeSlugs: [],
  },
  {
    slug:        'all-games',
    game:        'all',
    nameEn:      'All Games — Forever',
    nameGeez:    'ኩሉ ጸወታ',
    nameLatin:   'All Games',
    icon:        '⭐',
    accentColor: '#ffd600',
    description: 'All 4 games, every tier, forever. The best value — one purchase, nothing locked.',
    priceGbp:    12.99,
    cascadeSlugs: ['shimagile'], // + hito-pass + hinqle-pass handled in webhook
  },
];
