-- ═══════════════════════════════════════════════════════════════
--  seed-packs.sql  —  Run ONCE in Supabase SQL Editor
--  Seeds all 3 premium packs + 45 proverbs from the PDF
--
--  ORDER:
--  1. Run Step A  (create packs table if not done yet)
--  2. Run Step B  (add pack_id column to proverbs)
--  3. Run Step C  (insert the 45 proverbs)
--  4. Run Step D  (unlock_codes table for Gumroad keys)
--  5. Run Step E  (RLS policies)
--  6. Run Step F  (mint your first batch of Gumroad codes)
-- ═══════════════════════════════════════════════════════════════


-- ── STEP A  Create packs table ────────────────────────────────
CREATE TABLE IF NOT EXISTS packs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name_geez     TEXT NOT NULL,
  name_latin    TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  description   TEXT,
  price_gbp     NUMERIC(6,2) DEFAULT 0,
  is_free       BOOLEAN DEFAULT FALSE,
  word_count    INT DEFAULT 0,
  proverb_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packs_public_read" ON packs;
CREATE POLICY "packs_public_read" ON packs FOR SELECT USING (true);

INSERT INTO packs (slug, name_geez, name_latin, name_en, description, price_gbp, is_free, word_count, proverb_count)
VALUES
  ('classic', 'ክላሲክ', 'Classic',  'Classic Pack',        'Original words & proverbs',                   0.00, TRUE,  60, 25),
  ('hadar',   'ሓዳር',   'Hadar',    'Wedding & Family',    'Marriage, kinship and family life',            4.99, FALSE,  0, 15),
  ('adi',     'ዓዲ',    'Adi',      'Homeland & Places',   'Villages, geography and diaspora journeys',   4.99, FALSE,  0, 15),
  ('weledo',  'ወለዶ',   'Weledo',   'Generations & Wisdom','Advanced proverbs across generations',        4.99, FALSE,  0, 15)
ON CONFLICT (slug) DO NOTHING;


-- ── STEP B  Add pack_id to proverbs ──────────────────────────
ALTER TABLE proverbs ADD COLUMN IF NOT EXISTS pack_id UUID REFERENCES packs(id);
UPDATE proverbs
SET pack_id = (SELECT id FROM packs WHERE slug = 'classic')
WHERE pack_id IS NULL;


-- ── STEP C  Insert 45 premium proverbs ───────────────────────

-- ── ሓዳር  ·  Hadar  —  Wedding & Family ──────────────────────
INSERT INTO proverbs (tigrinya, latin, english, difficulty, pack_id) VALUES
  ('ሃላይ ሰበይቲ፡ ጸብሓ ይጥዕማ',
   'Halay sebeiti, tsebHa ytima',
   'A caring wife''s cooking always tastes best',
   'easy',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ልቢ ወላዲ ቀጥቀጥ፣ ልቢ ውሉድ ቀጥ',
   'Libi weladi qetqet, libi wulud qet',
   'A parent''s heart beats with worry; a child''s heart beats free',
   'easy',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ራዛ ናይ ኣቡኡ ሓዛ',
   'Raza nay abu''u Haza',
   'A son takes on his father''s nature',
   'easy',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ዋናኣ ዝኣመነት በጊዕ፡ ኮልኮላ ደገ ይሓድር',
   'Wana''a zaament begi'', kolkola dege yHadir',
   'The sheep that trusts its owner ends up sleeping outside the fence',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ሓደ ከይጽምብሩ: ጾሞም ይሓድሩ',
   'Hade keytsmibru, tsomom yHadru',
   'Rather than feast alone, they choose to fast together',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ነዲኣ ገዲፋስ፡ ሓትናኣ ትናፍቕ',
   'Nedi''a gedifas, Hatna''a tnafeq',
   'She leaves her own mother yet longs for her sister-in-law',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ዋሕስካ ንቕድሜኻ፡ ወላዲኻ ንድሕሬኻ',
   'WaHiska nqdmeka, weladika ndHreka',
   'Your guarantor walks before you; your parent watches from behind',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ሓደ ዝወሳዲኡ: ብዙሓት ተሓማይኡ',
   'Hade zwesadi''u, bzuHat teHamayi''u',
   'The one who inherits has many who envy him',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ባዕላ ወሊዳቶ ኣይመሰለን',
   'Ba''ela welidato aymeselen',
   'She who gave birth to it did not recognise it as her own',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ሰበይቲ ዝለኣኸቶ ሞት ኣይፈርሕን',
   'Sebeiti zle''aketo mot ayferHn',
   'A death dispatched by a determined wife holds no fear',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('መርዓዊ ከይሓዛ ዓርኪ ሓዛ',
   'Meria''wi keyHaZa arki HaZa',
   'She found a best friend before she ever found a groom',
   'medium',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ሓቢኤን ይጠንስኦ፡ ዓዲ ኣኪበን''ከ ይወልደኦ',
   'Habie''en ytensi''o, adi akibe''nke yweldie''o',
   'They conceive in secret but give birth before the whole village',
   'hard',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ኣንስቲ ኣይለምና፡ እንተ ለመና ኸኣ፡ ኣይስኣና',
   'Anisti aylemna, ente lemena ke''a, aysia''na',
   'Women do not beg, but if they do, they never go without',
   'hard',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('ወዲ ኣማኒኻ ሓንግሮ፡ ወድኻ ኣታትዮ',
   'Wedi amani''ka Hangro, wedka atatyo',
   'Discipline your trusted friend''s son strictly; guide your own with care',
   'hard',
   (SELECT id FROM packs WHERE slug = 'hadar')),

  ('መርዑት ከይሓዛ መርዓ ክቋጸራ ይወዛወዛ',
   'Meriut keyHaZa meria kwatsera ywezaweza',
   'They rush to plan the wedding before a bride has even been found',
   'hard',
   (SELECT id FROM packs WHERE slug = 'hadar'));


-- ── ዓዲ  ·  Adi  —  Homeland & Places ────────────────────────
INSERT INTO proverbs (tigrinya, latin, english, difficulty, pack_id) VALUES
  ('ሩባ ዘለዎ ፈሳሲ፣ ጎቦ ዘለዎ መላሲ',
   'Ruba zelew fesasi, gobo zelew melasi',
   'One with a river has flow; one with a mountain has an echo',
   'easy',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ማይ ካብ ሩቡኡ፡ ሓሩጭ ካብ ቦኹሩኡ',
   'May kab rubu''u, HaruH kab bokuru''u',
   'Water from its source; ginger from its root',
   'easy',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ዕንዳይ ናብ''ንኡ፡ ማይ ኣብ ሩባኡ',
   'Inday nab''n''u, may ab ruba''u',
   'A bird returns to its nest; water returns to its river',
   'easy',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ሻራ ከም ባይቶኻ፡ ታሪኽ ከም ዓድኻ',
   'Shara kem baytoka, tarik kem adka',
   'Wear your shawl like your council; carry your history like your village',
   'easy',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('መንገዲ ጥዕና፡ ዓመት ኪዶ',
   'Mengedi ti''na, amet kido',
   'The road to good health — walk it for a whole year',
   'easy',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ሕልፈት ንዘይፈልጥ፡ ዑና ዓዲ ኣርእዮ',
   'Hilfet nzeyfelT, una adi ar''iyo',
   'Show the ruined village to the one who does not know loss',
   'medium',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ሰማይ ሰማይሲ ይትረፍክን፡ ምድሪ ምድሩ ይባርኸልክን',
   'Semay semaisi ytrefkn, midri midru ybarkelkn',
   'Let the sky remain as sky; may the earth below bless you',
   'medium',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ዓዲ ምስ ሰመረ፡ ንህቢ ምስ ዓመረ — የውህብካ''ምበረ',
   'Adi mis semere, nihbi mis amere — yewhbka''mbere',
   'When the village unites and the bees swarm together — only then will you receive',
   'medium',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ዓዲ ነልምዕ ተዓሻሺና፡ ዓዲ ኣይነጥፍእ ተዋራዚና',
   'Adi nelme''e te''ashasina, adi ayneTfi''e tewarazina',
   'We develop the land by uniting; we destroy it by fighting among ourselves',
   'medium',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ዓዲ ክዝመት፡ ዓይንኻ አይዕመት',
   'Adi kzmet, aynka ay''imet',
   'While the homeland is being plundered, do not let your eyes go blind',
   'medium',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ዕንጸይቲ እንተወደቐ ኣብ ጉንዱ፡ ሰብ እንተሸገሮ ኣብ ዘመዱ',
   'Intseyti entewedqe ab gundu, seb enteshegero ab zemdu',
   'When a tree falls it rests on its stump; when a person struggles they rest on their kin',
   'medium',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('መንገዲ እንተ ጠፍአካ፡ ጓል መንገዲ ድለ',
   'Mengedi ente Tefaeka, gual mengedi dle',
   'If you lose the main road, seek the side path',
   'medium',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ካብ ሃገሩ ዝወጸ ክሳብ ዝምለስ እንተጸዓንዎ ኣድጊ፡ እንተለጐምዎ ፈረስ',
   'Kab hageru zwetse ksab zmeles entetse''anwo adgi, entelgomwo feres',
   'One who leaves their homeland — until they return, load them and they are a donkey; rein them and they are a horse',
   'hard',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('ዝረገጽክምዎ ለምለም፡ ዝተዛረብክምዎ ድማ ቀለም ይኹነልኩም',
   'Zrgets''kmwo lemlim, ztezarebkmwo dma qelem ykunelkum',
   'May the ground you tread be green; may the words you speak be lasting as ink',
   'hard',
   (SELECT id FROM packs WHERE slug = 'adi')),

  ('መን ምዃንካ ክነግረካ፡ ምስ መን ከም ትኸይድ ንገረኒ',
   'Men mkuanke knegreeka, mis men kem tkeyd ngereni',
   'To tell you who you are, first tell me who you walk with',
   'hard',
   (SELECT id FROM packs WHERE slug = 'adi'));


-- ── ወለዶ  ·  Weledo  —  Generations & Wisdom ─────────────────
INSERT INTO proverbs (tigrinya, latin, english, difficulty, pack_id) VALUES
  ('ልሳን ዓጽሚ የብሉን፡ ግና ዓጽሚ ይሰብር',
   'Lisan atsmi yebilun, gna atsmi ysiebir',
   'The tongue has no bone, yet it breaks bones',
   'easy',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ስም ተራፊ፡ ብልዒ ሓላፊ',
   'Sim terafi, bil''i Halafi',
   'A name endures; food passes',
   'easy',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ቃል ህዝቢ፡ ቃል እዝጊ',
   'Qal hizbi, qal izgi',
   'The word of the people is the word of God',
   'easy',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ምኽሪ ንዝሰምዑ፡ ማይ ንዝጸምኡ',
   'Mkhri nzsemiu, may nztsemiu',
   'Counsel is for those who listen; water is for those who thirst',
   'easy',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ሓደ ግዜ ካብ ምዝራብ፡ ሰለስተ ግዜ ምሕሳብ',
   'Hade gize kab mzrab, seleste gize mHisab',
   'Think three times before you speak once',
   'easy',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ለባም ይሓስብ ናይ ዓመት፡ ዓሻ ይሓስብ ናይ ዕለት',
   'Lebam yHasib nay amet, asha yHasib nay ilet',
   'The wise person plans for a year; the fool plans only for today',
   'medium',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ሓቂ ንሓንቲ መዓልቲ ጭንቂ፣ ንዘለኣለም ጽድቂ',
   'Haqi nHanti me''alti tsienqi, nzele''alem tsiidqi',
   'Truth brings anxiety for one day but righteousness forever',
   'medium',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ሓቂ እናሓደረ ይኹላዕ ከም ወርቂ',
   'Haqi inaHadere ykula''i kem worqi',
   'Truth, as it ages, gleams ever brighter — like gold',
   'medium',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ንለባም ኣምተሉ፡ ንዓሻ ዶርጉሓሉ',
   'Nlebam amtelu, nasha dorguhalu',
   'Listen attentively to the wise; back well away from the fool',
   'medium',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('በትሪ ሓቂ ትቀጥን''ምበር ኣይትስበርን',
   'Betri Haqi tqetn''mber aytsibern',
   'The rod of truth may grow thin but it never breaks',
   'medium',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ዕረ ዘይጠዓመ፡ መቐረት መዓር ኣይፈልጥን',
   'Ire zeytea''me, meqeret me''ar ayfeltn',
   'One who has never tasted bitterness does not know the sweetness of honey',
   'medium',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ዕርቂ ደም መድረቒ፡ ባእሲ ደም መተርከሲ',
   'Irqi dem medreqi, ba''isi dem meterkesi',
   'Reconciliation dries blood; conflict only spills more',
   'medium',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ሓቂ ብርእሳ እንተቐበርካያ ብእግራ ትወጽእ',
   'Haqi bri''sa entequberkaya bi''igra twetsei',
   'If you bury truth headfirst, it will emerge feet-first',
   'hard',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ዓበቕ ዘምጽአ ፈጣሪ፡ መሕከኺ ኣይከልአ ጽፍሪ',
   'Abeq zemts''ae fetari, meHkexi aykele''a tsifri',
   'God who brought the itch did not forbid the fingernail to scratch',
   'hard',
   (SELECT id FROM packs WHERE slug = 'weledo')),

  ('ዝሰሓተ ይምከርካ፣ ዝወዓለ ይንገርካ',
   'Zsehate ymkerkka, zwea''le yngerkka',
   'One who has erred will advise you best; one who has journeyed will inform you',
   'hard',
   (SELECT id FROM packs WHERE slug = 'weledo'));


-- ── STEP D  unlock_codes table ────────────────────────────────
CREATE TABLE IF NOT EXISTS unlock_codes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash            TEXT NOT NULL UNIQUE,
  pack_id              UUID NOT NULL REFERENCES packs(id),
  redeemed_at          TIMESTAMPTZ,
  redeemed_fingerprint TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE unlock_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no_anon_read"   ON unlock_codes;
DROP POLICY IF EXISTS "no_anon_insert" ON unlock_codes;
CREATE POLICY "no_anon_read"   ON unlock_codes FOR SELECT USING (false);
CREATE POLICY "no_anon_insert" ON unlock_codes FOR INSERT WITH CHECK (false);


-- ── STEP E  RLS: only classic proverbs readable by anon ───────
-- Enable RLS on proverbs if not already on
ALTER TABLE proverbs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON proverbs;
DROP POLICY IF EXISTS "proverbs_free_public"  ON proverbs;
DROP POLICY IF EXISTS "proverbs_premium_svc"  ON proverbs;
DROP POLICY IF EXISTS "proverbs_auth_write"   ON proverbs;

CREATE POLICY "proverbs_free_public" ON proverbs
  FOR SELECT USING (
    pack_id IS NULL
    OR pack_id = (SELECT id FROM packs WHERE slug = 'classic')
  );

CREATE POLICY "proverbs_premium_svc" ON proverbs
  FOR SELECT USING (
    pack_id != (SELECT id FROM packs WHERE slug = 'classic')
    AND auth.role() = 'service_role'
  );

CREATE POLICY "proverbs_auth_write" ON proverbs
  FOR ALL USING (auth.role() = 'authenticated');


-- ── STEP F  Code-minting function for Gumroad keys ────────────
-- Requires pgcrypto extension (free on Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION mint_pack_codes(p_slug TEXT, p_count INT DEFAULT 10)
RETURNS TABLE(raw_code TEXT) AS $$
DECLARE
  v_pack_id UUID;
  v_raw     TEXT;
  v_hash    TEXT;
BEGIN
  SELECT id INTO v_pack_id FROM packs WHERE slug = p_slug;
  IF v_pack_id IS NULL THEN
    RAISE EXCEPTION 'Pack not found: %', p_slug;
  END IF;
  FOR i IN 1..p_count LOOP
    v_raw  := upper(replace(gen_random_uuid()::text, '-', ''));
    v_hash := encode(digest(v_raw, 'sha256'), 'hex');
    INSERT INTO unlock_codes (code_hash, pack_id) VALUES (v_hash, v_pack_id);
    raw_code := v_raw;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── To generate your first 50 Gumroad codes per pack, run: ───
--   SELECT * FROM mint_pack_codes('hadar',  50);
--   SELECT * FROM mint_pack_codes('adi',    50);
--   SELECT * FROM mint_pack_codes('weledo', 50);
--
-- ⚠  Copy the raw_code column IMMEDIATELY — it is NEVER stored in plaintext.
--    Paste the codes into Gumroad as "License Keys" (one per line).
-- ─────────────────────────────────────────────────────────────
