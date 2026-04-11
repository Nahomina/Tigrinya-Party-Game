// ═══════════════════════════════════════════════════════════════
//  pack-proverbs.js  —  ADMIN REFERENCE FILE
//  Premium-pack proverb content for Tigrinya Party Games
//
//  ► This file is NOT loaded by index.html or game.html.
//    It is your local editing source-of-truth.
//  ► To publish changes, paste the matching INSERT block from
//    seed-packs.sql into the Supabase SQL Editor and run it.
//  ► Format matches proverbs.js exactly:
//      tigrinya  — Ge'ez script (copy/paste from PDF)
//      latin     — romanisation (for player reference)
//      english   — meaning in English
//      difficulty — 'easy' | 'medium' | 'hard'
//
//  HOW TO ADD / EDIT A PROVERB
//  1. Find the pack object below (HADAR_PROVERBS / ADI_PROVERBS / WELEDO_PROVERBS)
//  2. Add or edit an entry in the array
//  3. Open Supabase SQL Editor → run the matching UPDATE/INSERT (see bottom of file)
//  4. The Edge Function will serve the new content automatically on next unlock
// ═══════════════════════════════════════════════════════════════

// ── ሓዳር  ·  HADAR  —  Wedding & Family (15 proverbs) ────────────
const HADAR_PROVERBS = [
  {
    tigrinya:   'ሃላይ ሰበይቲ፡ ጸብሓ ይጥዕማ',
    latin:      'Halay sebeiti, tsebHa ytima',
    english:    'A caring wife\'s cooking always tastes best',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ልቢ ወላዲ ቀጥቀጥ፣ ልቢ ውሉድ ቀጥ',
    latin:      'Libi weladi qetqet, libi wulud qet',
    english:    'A parent\'s heart beats with worry; a child\'s heart beats free',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ራዛ ናይ ኣቡኡ ሓዛ',
    latin:      'Raza nay abu\'u Haza',
    english:    'A son takes on his father\'s nature',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ዋናኣ ዝኣመነት በጊዕ፡ ኮልኮላ ደገ ይሓድር',
    latin:      'Wana\'a zaament begi\', kolkola dege yHadir',
    english:    'The sheep that trusts its owner ends up sleeping outside the fence',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሓደ ከይጽምብሩ: ጾሞም ይሓድሩ',
    latin:      'Hade keytsmibru, tsomom yHadru',
    english:    'Rather than feast alone, they choose to fast together',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ነዲኣ ገዲፋስ፡ ሓትናኣ ትናፍቕ',
    latin:      'Nedi\'a gedifas, Hatna\'a tnafeq',
    english:    'She leaves her own mother yet longs for her sister-in-law',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዋሕስካ ንቕድሜኻ፡ ወላዲኻ ንድሕሬኻ',
    latin:      'WaHiska nqdmeka, weladika ndHreka',
    english:    'Your guarantor walks before you; your parent watches from behind',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሓደ ዝወሳዲኡ: ብዙሓት ተሓማይኡ',
    latin:      'Hade zwesadi\'u, bzuHat teHamayi\'u',
    english:    'The one who inherits has many who envy him',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ባዕላ ወሊዳቶ ኣይመሰለን',
    latin:      'Ba\'ela welidato aymeselen',
    english:    'She who gave birth to it did not recognise it as her own',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሰበይቲ ዝለኣኸቶ ሞት ኣይፈርሕን',
    latin:      'Sebeiti zle\'aketo mot ayferHn',
    english:    'A death dispatched by a determined wife holds no fear',
    difficulty: 'medium',
  },
  {
    tigrinya:   'መርዓዊ ከይሓዛ ዓርኪ ሓዛ',
    latin:      'Meria\'wi keyHaZa arki HaZa',
    english:    'She found a best friend before she ever found a groom',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሓቢኤን ይጠንስኦ፡ ዓዲ ኣኪበን\'ከ ይወልደኦ',
    latin:      'Habie\'en ytensi\'o, adi akibe\'nke yweldie\'o',
    english:    'They conceive in secret but give birth before the whole village',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ኣንስቲ ኣይለምና፡ እንተ ለመና ኸኣ፡ ኣይስኣና',
    latin:      'Anisti aylemna, ente lemena ke\'a, aysia\'na',
    english:    'Women do not beg, but if they do, they never go without',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ወዲ ኣማኒኻ ሓንግሮ፡ ወድኻ ኣታትዮ',
    latin:      'Wedi amani\'ka Hangro, wedka atatyo',
    english:    'Discipline your trusted friend\'s son strictly; guide your own with care',
    difficulty: 'hard',
  },
  {
    tigrinya:   'መርዑት ከይሓዛ መርዓ ክቋጸራ ይወዛወዛ',
    latin:      'Meriut keyHaZa meria kwatsera ywezaweza',
    english:    'They rush to plan the wedding before a bride has even been found',
    difficulty: 'hard',
  },
];


// ── ዓዲ  ·  ADI  —  Homeland & Places (15 proverbs) ─────────────
const ADI_PROVERBS = [
  {
    tigrinya:   'ሩባ ዘለዎ ፈሳሲ፣ ጎቦ ዘለዎ መላሲ',
    latin:      'Ruba zelew fesasi, gobo zelew melasi',
    english:    'One with a river has flow; one with a mountain has an echo',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ማይ ካብ ሩቡኡ፡ ሓሩጭ ካብ ቦኹሩኡ',
    latin:      'May kab rubu\'u, HaruH kab bokuru\'u',
    english:    'Water from its source; ginger from its root',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ዕንዳይ ናብ\'ንኡ፡ ማይ ኣብ ሩባኡ',
    latin:      'Inday nab\'n\'u, may ab ruba\'u',
    english:    'A bird returns to its nest; water returns to its river',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ሻራ ከም ባይቶኻ፡ ታሪኽ ከም ዓድኻ',
    latin:      'Shara kem baytoka, tarik kem adka',
    english:    'Wear your shawl like your council; carry your history like your village',
    difficulty: 'easy',
  },
  {
    tigrinya:   'መንገዲ ጥዕና፡ ዓመት ኪዶ',
    latin:      'Mengedi ti\'na, amet kido',
    english:    'The road to good health — walk it for a whole year',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ሕልፈት ንዘይፈልጥ፡ ዑና ዓዲ ኣርእዮ',
    latin:      'Hilfet nzeyfelT, una adi ar\'iyo',
    english:    'Show the ruined village to the one who does not know loss',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሰማይ ሰማይሲ ይትረፍክን፡ ምድሪ ምድሩ ይባርኸልክን',
    latin:      'Semay semaisi ytrefkn, midri midru ybarkelkn',
    english:    'Let the sky remain as sky; may the earth below bless you',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዓዲ ምስ ሰመረ፡ ንህቢ ምስ ዓመረ — የውህብካ\'ምበረ',
    latin:      'Adi mis semere, nihbi mis amere — yewhbka\'mbere',
    english:    'When the village unites and the bees swarm together — only then will you receive',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዓዲ ነልምዕ ተዓሻሺና፡ ዓዲ ኣይነጥፍእ ተዋራዚና',
    latin:      'Adi nelme\'e te\'ashasina, adi ayneTfi\'e tewarazina',
    english:    'We develop the land by uniting; we destroy it by fighting among ourselves',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዓዲ ክዝመት፡ ዓይንኻ አይዕመት',
    latin:      'Adi kzmet, aynka ay\'imet',
    english:    'While the homeland is being plundered, do not let your eyes go blind',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዕንጸይቲ እንተወደቐ ኣብ ጉንዱ፡ ሰብ እንተሸገሮ ኣብ ዘመዱ',
    latin:      'Intseyti entewedqe ab gundu, seb enteshegero ab zemdu',
    english:    'When a tree falls it rests on its stump; when a person struggles they rest on their kin',
    difficulty: 'medium',
  },
  {
    tigrinya:   'መንገዲ እንተ ጠፍአካ፡ ጓል መንገዲ ድለ',
    latin:      'Mengedi ente Tefaeka, gual mengedi dle',
    english:    'If you lose the main road, seek the side path',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ካብ ሃገሩ ዝወጸ ክሳብ ዝምለስ እንተጸዓንዎ ኣድጊ፡ እንተለጐምዎ ፈረስ',
    latin:      'Kab hageru zwetse ksab zmeles entetse\'anwo adgi, entelgomwo feres',
    english:    'One who leaves their homeland — until they return, load them and they are a donkey; rein them and they are a horse',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ዝረገጽክምዎ ለምለም፡ ዝተዛረብክምዎ ድማ ቀለም ይኹነልኩም',
    latin:      'Zrgets\'kmwo lemlim, ztezarebkmwo dma qelem ykunelkum',
    english:    'May the ground you tread be green; may the words you speak be lasting as ink',
    difficulty: 'hard',
  },
  {
    tigrinya:   'መን ምዃንካ ክነግረካ፡ ምስ መን ከም ትኸይድ ንገረኒ',
    latin:      'Men mkuanke knegreeka, mis men kem tkeyd ngereni',
    english:    'To tell you who you are, first tell me who you walk with',
    difficulty: 'hard',
  },
];


// ── ወለዶ  ·  WELEDO  —  Generations & Wisdom (15 proverbs) ──────
const WELEDO_PROVERBS = [
  {
    tigrinya:   'ልሳን ዓጽሚ የብሉን፡ ግና ዓጽሚ ይሰብር',
    latin:      'Lisan atsmi yebilun, gna atsmi ysiebir',
    english:    'The tongue has no bone, yet it breaks bones',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ስም ተራፊ፡ ብልዒ ሓላፊ',
    latin:      'Sim terafi, bil\'i Halafi',
    english:    'A name endures; food passes',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ቃል ህዝቢ፡ ቃል እዝጊ',
    latin:      'Qal hizbi, qal izgi',
    english:    'The word of the people is the word of God',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ምኽሪ ንዝሰምዑ፡ ማይ ንዝጸምኡ',
    latin:      'Mkhri nzsemiu, may nztsemiu',
    english:    'Counsel is for those who listen; water is for those who thirst',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ሓደ ግዜ ካብ ምዝራብ፡ ሰለስተ ግዜ ምሕሳብ',
    latin:      'Hade gize kab mzrab, seleste gize mHisab',
    english:    'Think three times before you speak once',
    difficulty: 'easy',
  },
  {
    tigrinya:   'ለባም ይሓስብ ናይ ዓመት፡ ዓሻ ይሓስብ ናይ ዕለት',
    latin:      'Lebam yHasib nay amet, asha yHasib nay ilet',
    english:    'The wise person plans for a year; the fool plans only for today',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሓቂ ንሓንቲ መዓልቲ ጭንቂ፣ ንዘለኣለም ጽድቂ',
    latin:      'Haqi nHanti me\'alti tsienqi, nzele\'alem tsiidqi',
    english:    'Truth brings anxiety for one day but righteousness forever',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሓቂ እናሓደረ ይኹላዕ ከም ወርቂ',
    latin:      'Haqi inaHadere ykula\'i kem worqi',
    english:    'Truth, as it ages, gleams ever brighter — like gold',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ንለባም ኣምተሉ፡ ንዓሻ ዶርጉሓሉ',
    latin:      'Nlebam amtelu, nasha dorguhalu',
    english:    'Listen attentively to the wise; back well away from the fool',
    difficulty: 'medium',
  },
  {
    tigrinya:   'በትሪ ሓቂ ትቀጥን\'ምበር ኣይትስበርን',
    latin:      'Betri Haqi tqetn\'mber aytsibern',
    english:    'The rod of truth may grow thin but it never breaks',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዕረ ዘይጠዓመ፡ መቐረት መዓር ኣይፈልጥን',
    latin:      'Ire zeytea\'me, meqeret me\'ar ayfeltn',
    english:    'One who has never tasted bitterness does not know the sweetness of honey',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ዕርቂ ደም መድረቒ፡ ባእሲ ደም መተርከሲ',
    latin:      'Irqi dem medreqi, ba\'isi dem meterkesi',
    english:    'Reconciliation dries blood; conflict only spills more',
    difficulty: 'medium',
  },
  {
    tigrinya:   'ሓቂ ብርእሳ እንተቐበርካያ ብእግራ ትወጽእ',
    latin:      'Haqi bri\'sa entequberkaya bi\'igra twetsei',
    english:    'If you bury truth headfirst, it will emerge feet-first',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ዓበቕ ዘምጽአ ፈጣሪ፡ መሕከኺ ኣይከልአ ጽፍሪ',
    latin:      'Abeq zemts\'ae fetari, meHkexi aykele\'a tsifri',
    english:    'God who brought the itch did not forbid the fingernail to scratch',
    difficulty: 'hard',
  },
  {
    tigrinya:   'ዝሰሓተ ይምከርካ፣ ዝወዓለ ይንገርካ',
    latin:      'Zsehate ymkerkka, zwea\'le yngerkka',
    english:    'One who has erred will advise you best; one who has journeyed will inform you',
    difficulty: 'hard',
  },
];

// ─────────────────────────────────────────────────────────────────
//  HOW TO SYNC TO SUPABASE AFTER EDITING
// ─────────────────────────────────────────────────────────────────
//
//  Open Supabase Dashboard → SQL Editor → paste and run one block:
//
//  ► ADD one new proverb to the ሓዳር pack:
//
//    INSERT INTO proverbs (tigrinya, latin, english, difficulty, pack_id)
//    VALUES (
//      'your Ge'ez text here',
//      'your latin here',
//      'your English meaning here',
//      'easy',   -- or 'medium' or 'hard'
//      (SELECT id FROM packs WHERE slug = 'hadar')
//    );
//
//  ► UPDATE an existing proverb (find its id in Table Editor first):
//
//    UPDATE proverbs
//    SET english = 'corrected meaning'
//    WHERE tigrinya = 'ሓቂ ብርእሳ እንተቐበርካያ ብእግራ ትወጽእ';
//
//  ► DELETE a proverb:
//
//    DELETE FROM proverbs
//    WHERE tigrinya = 'the Ge\'ez text'
//      AND pack_id = (SELECT id FROM packs WHERE slug = 'hadar');
//
//  See seed-packs.sql for the full initial INSERT of all 45 proverbs.
// ─────────────────────────────────────────────────────────────────
