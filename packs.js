// packs.js — Pack / Tier catalogue  (v6)
// Slugs match the database — do NOT rename them.
// Premium content unlocked via Stripe payment only.
// Counts are exact — pulled from DB 2026-04-19.

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
    tierLabel:   'Level 1',
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
    // ── LEVEL 2 ───────────────────────────────────────────────
    slug:          'qola',
    tier:          'intermediate',
    sequenceOrder: 2,

    nameGeez:    'ቁልዓ',
    nameLatin:   "Qol'a",
    nameEn:      "Qol'a",
    tierLabel:   'Level 2',
    icon:        '🔵',
    accentColor: '#1e88e5',

    description:  "The Baby. You know the basics — weddings, family & cultural vocab.",
    wordCount:    9,
    proverbCount: 15,

    priceGbp: 1.99,
    isFree:   false,

    wordProfile:    "+9 words · weddings, family & kinship",
    proverbProfile: "+15 proverbs · cultural references",
  },
  {
    // ── LEVEL 3 ───────────────────────────────────────────────
    slug:          'gobez',
    tier:          'advanced',
    sequenceOrder: 3,

    nameGeez:    'ጎበዝ',
    nameLatin:   'Gobez',
    nameEn:      'Gobez',
    tierLabel:   'Level 3',
    icon:        '🟣',
    accentColor: '#8e24aa',

    description:  "The Cool Youth. You navigate a wedding and homeland vocab — but deep proverbs still trip you up.",
    wordCount:    9,
    proverbCount: 10,

    priceGbp: 4.99,
    isFree:   false,

    wordProfile:    '+9 words · geography & homeland',
    proverbProfile: '+10 proverbs · idioms & deeper meaning',
  },
  {
    // ── LEVEL 4 ───────────────────────────────────────────────
    slug:          'shimagile',
    tier:          'expert',
    sequenceOrder: 4,

    nameGeez:    'ሽማግለ',
    nameLatin:   'Shimagile',
    nameEn:      'Shimagile',
    tierLabel:   'Level 4',
    icon:        '🟠',
    accentColor: '#f4511e',

    description:  "The Village Elder. You are officially the person everyone asks. Advanced vocab, rare proverbs & cultural wisdom.",
    wordCount:    5,
    proverbCount: 11,

    priceGbp: 9.99,
    isFree:   false,

    wordProfile:    '+5 words · rare & advanced vocab',
    proverbProfile: '+11 proverbs · advanced metaphors & wisdom',
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
    description: "Unlock every tier for MAYIM (word guessing) and MISLA (proverbs) — Qol'a, Gobez & Shimagile.",
    priceGbp:    6.99,
    // Buying this cascades: qola + gobez + shimagile
    cascadeSlugs: ['qola', 'gobez', 'shimagile'],
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
    cascadeSlugs: ['qola', 'gobez', 'shimagile'], // + hito-pass + hinqle-pass handled in webhook
  },
];
