// packs.js — Pack catalogue metadata for UI rendering
// Premium word/proverb content is NEVER stored here.
// It arrives only via the validate-code Edge Function after a valid unlock.
//
// ── Gumroad product URLs ─────────────────────────────────────────
//  Replace the gumroadUrl values with your actual Gumroad product links
//  once you have created them.  Format: https://tigrinyapartygames.gumroad.com/l/SLUG
// ────────────────────────────────────────────────────────────────

const PACK_CATALOGUE = [
  {
    slug:         'classic',
    nameGeez:     'ክላሲክ',
    nameLatin:    'Classic',
    nameEn:       'Classic Pack',
    description:  'The original 60 words & 25 proverbs',
    priceGbp:     0,
    isFree:       true,
    wordCount:    60,
    proverbCount: 25,
    accentColor:  '#e63946',
    gumroadUrl:   null,
  },
  {
    slug:         'hadar',
    nameGeez:     'ሓዳር',
    nameLatin:    'Hadar',
    nameEn:       'Wedding & Family',
    description:  'Marriage, bridal traditions & kinship proverbs',
    priceGbp:     4.99,
    isFree:       false,
    wordCount:    40,
    proverbCount: 40,
    accentColor:  '#c77dff',
    gumroadUrl:   'https://nahomworks0.gumroad.com/l/xzcczm',
  },
  {
    slug:         'adi',
    nameGeez:     'ዓዲ',
    nameLatin:    'Adi',
    nameEn:       'Homeland & Places',
    description:  'Villages, geography, landscape & diaspora journeys',
    priceGbp:     4.99,
    isFree:       false,
    wordCount:    40,
    proverbCount: 40,
    accentColor:  '#4cc9f0',
    gumroadUrl:   null, // add Gumroad URL once product is created
  },
  {
    slug:         'weledo',
    nameGeez:     'ወለዶ',
    nameLatin:    'Weledo',
    nameEn:       'Generations & Wisdom',
    description:  'Advanced proverbs across generations — for expert players',
    priceGbp:     4.99,
    isFree:       false,
    wordCount:    40,
    proverbCount: 40,
    accentColor:  '#f4a261',
    gumroadUrl:   null, // add Gumroad URL once product is created
  },
];
