// packs.js — Pack / Tier catalogue  (v9)
// Slugs match the database — do NOT rename them.
// Premium content unlocked via game pass subscriptions only.
// All pricing handled through game pass bundles, not individual tier prices.

const PACK_CATALOGUE = [
  {
    // ── LEVEL 1 (Free) ────────────────────────────────────────
    slug:          'gasha',
    tier:          'starter',
    sequenceOrder: 1,

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
    // ── LEVEL 2 (Premium via Game Pass) ──────────────────────
    slug:          'qola',
    tier:          'intermediate',
    sequenceOrder: 2,

    nameGeez:    'ቁልዓ',
    nameLatin:   "Qol'a",
    nameEn:      "Qol'a",
    tierLabel:   'Intermediate',
    icon:        '🔵',
    accentColor: '#1e88e5',

    description:  "The Baby. You know the basics — weddings, family & cultural vocab.",
    wordCount:    40,
    proverbCount: 30,

    priceGbp: 0,  // Pricing via game pass only
    isFree:   false,

    wordProfile:    '40 words · weddings & family',
    proverbProfile: '30 proverbs · cultural references',
  },
  {
    // ── LEVEL 3 (Premium via Game Pass) ──────────────────────
    slug:          'gobez',
    tier:          'advanced',
    sequenceOrder: 3,

    nameGeez:    'ጎበዝ',
    nameLatin:   'Gobez',
    nameEn:      'Gobez',
    tierLabel:   'Advanced',
    icon:        '🟣',
    accentColor: '#8e24aa',

    description:  "The Cool Youth. You navigate culture — homeland vocab & advanced proverbs.",
    wordCount:    40,
    proverbCount: 35,

    priceGbp: 0,  // Pricing via game pass only
    isFree:   false,

    wordProfile:    '40 words · geography & homeland',
    proverbProfile: '35 proverbs · idioms & deeper meaning',
  },
  {
    // ── LEVEL 4 (Premium via Game Pass) ──────────────────────
    slug:          'shimagile',
    tier:          'expert',
    sequenceOrder: 4,

    nameGeez:    'ሽማግለ',
    nameLatin:   'Shimagile',
    nameEn:      'Shimagile',
    tierLabel:   'Expert',
    icon:        '🟠',
    accentColor: '#f4511e',

    description:  "The Village Elder. You are the person everyone asks — full vocab, all proverbs & cultural wisdom.",
    wordCount:    58,
    proverbCount: 104,

    priceGbp: 0,  // Pricing via game pass only
    isFree:   false,

    wordProfile:    'Full word pack · all levels unlocked',
    proverbProfile: 'Full proverb pack · advanced wisdom',
  },
];

// ── Game Pass Catalogue ──────────────────────────────────────────────────────
// Monthly recurring subscriptions. One pass unlocks ALL paid tiers for a single game.
// All-games bundle covers every game for a single monthly price.
const GAME_PASS_CATALOGUE = [
  {
    slug:        'mayim-pass',
    game:        'mayim',           // also covers misla (shared packs)
    nameEn:      'MAYIM & MISLA Pass',
    nameGeez:    'ማይም ፓስ',
    nameLatin:   'Mayim Pass',
    icon:        '🔴',
    accentColor: '#e53935',
    description: "Monthly subscription. Unlock all difficulty tiers for MAYIM (word guessing) and MISLA (proverbs) — Qol'a, Gobez, and Shimagile.",
    priceGbp:    2.99,
    // Buying this cascades: qola, gobez, shimagile (includes all premium tiers)
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
    description: "Monthly subscription. Unlock all difficulty tiers for HITO trivia — Qol'a, Gobez, and Shimagile.",
    priceGbp:    1.99,
    cascadeSlugs: ['qola', 'gobez', 'shimagile'],
  },
  {
    slug:        'hinqle-pass',
    game:        'hinqle',
    nameEn:      'Hinqle Hinqilitey Pass',
    nameGeez:    'ሕንቅሊተይ ፓስ',
    nameLatin:   'Hinqle Pass',
    icon:        '🟢',
    accentColor: '#00897b',
    description: "Monthly subscription. Unlock all difficulty tiers for Hinqle Hinqilitey — Qol'a, Gobez, and Shimagile.",
    priceGbp:    1.99,
    cascadeSlugs: ['qola', 'gobez', 'shimagile'],
  },
  {
    slug:        'all-games',
    game:        'all',
    nameEn:      'All Games',
    nameGeez:    'ኩሉ ጸወታ',
    nameLatin:   'All Games',
    icon:        '⭐',
    accentColor: '#ffd600',
    description: 'Monthly subscription. All 4 games, every tier. The best value — one price, nothing locked.',
    priceGbp:    4.99,
    cascadeSlugs: ['qola', 'gobez', 'shimagile'], // + hito-pass + hinqle-pass handled in webhook
  },
];
