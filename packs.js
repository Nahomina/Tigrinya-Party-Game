// packs.js — Pack / Tier catalogue  (v3)
// Slugs match the database — do NOT rename them.
// Premium content arrives only via validate-code Edge Function after unlock.

const PACK_CATALOGUE = [
  {
    // ── TIER 1 ────────────────────────────────────────────────
    slug:          'classic',
    tier:          'starter',
    sequenceOrder: 1,

    // Display
    nameGeez:    'ጀማሪ',
    nameLatin:   'Jemari',
    nameEn:      'Starter',
    tierLabel:   'Tier 1',
    icon:        '🟢',
    accentColor: '#43a047',          // green

    description:  'Core vocabulary — everyday words & simple proverbs.',
    wordCount:    60,
    proverbCount: 25,

    priceGbp: 0,
    isFree:   true,
    gumroadUrl: null,

    // Word characteristics for this tier
    wordProfile: '2–5 character words · daily household vocabulary',
    proverbProfile: '2–4 word sayings · easy to follow',
  },
  {
    // ── TIER 2 ────────────────────────────────────────────────
    slug:          'hadar',
    tier:          'intermediate',
    sequenceOrder: 2,

    nameGeez:    'መካከለኛ',
    nameLatin:   'Mekakelegna',
    nameEn:      'Intermediate',
    tierLabel:   'Tier 2',
    icon:        '🔵',
    accentColor: '#1e88e5',          // blue

    description:  'Thematic vocabulary — food, family, travel & culture.',
    wordCount:    40,
    proverbCount: 15,

    priceGbp: 1.99,
    isFree:   false,
    gumroadUrl: null,

    wordProfile: '5–7 character words · themed groups',
    proverbProfile: '4–7 word proverbs · cultural references',
  },
  {
    // ── TIER 3 ────────────────────────────────────────────────
    slug:          'adi',
    tier:          'advanced',
    sequenceOrder: 3,

    nameGeez:    'ምዕቡል',
    nameLatin:   'Mi\'ebul',
    nameEn:      'Advanced',
    tierLabel:   'Tier 3',
    icon:        '🟣',
    accentColor: '#8e24aa',          // purple

    description:  'Complex vocabulary — synonyms, idioms & poetic language.',
    wordCount:    40,
    proverbCount: 15,

    priceGbp: 4.99,
    isFree:   false,
    gumroadUrl: null,

    wordProfile: '6–9 character words · synonyms & archaic terms',
    proverbProfile: '8–10 word proverbs · idioms & deeper meaning',
  },
  {
    // ── TIER 4 ────────────────────────────────────────────────
    slug:          'weledo',
    tier:          'expert',
    sequenceOrder: 4,

    nameGeez:    'ክኢላ',
    nameLatin:   'K\'ela',
    nameEn:      'Expert',
    tierLabel:   'Tier 4',
    icon:        '🟠',
    accentColor: '#f4511e',          // deep orange

    description:  'Rare & complex — slang, cultural wisdom & full proverbs.',
    wordCount:    40,
    proverbCount: 15,

    priceGbp: 9.99,
    isFree:   false,
    gumroadUrl: null,

    wordProfile: '7–12 character words · slang & cultural terms',
    proverbProfile: '10+ word proverbs · advanced metaphors',
  },
];
