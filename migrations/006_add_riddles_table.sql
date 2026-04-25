-- ── Migration 006: Add riddles table ──────────────────────────────────────
-- Game: ፍልጠለይ (Fidltelay) — Tigrinya Riddles
-- The judge reads the riddle and checks the answer verbally.

CREATE TABLE IF NOT EXISTS riddles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question    text        NOT NULL,          -- Tigrinya (Ge'ez script)
  question_latin text     NOT NULL,          -- Latin romanization
  answer      text        NOT NULL,          -- Tigrinya answer
  answer_latin text       NOT NULL,          -- Latin answer
  hint        text,                          -- Optional extra hint
  category    text        NOT NULL DEFAULT 'General',
  difficulty  text        NOT NULL DEFAULT 'medium'
                          CHECK (difficulty IN ('easy','medium','hard')),
  pack_id     uuid        REFERENCES packs(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE riddles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "riddles_public_read"  ON riddles;
DROP POLICY IF EXISTS "riddles_admin_write"  ON riddles;

CREATE POLICY "riddles_public_read"
  ON riddles FOR SELECT USING (true);

CREATE POLICY "riddles_admin_write"
  ON riddles FOR ALL
  USING     (auth.email() = 'mnahom23@gmail.com')
  WITH CHECK(auth.email() = 'mnahom23@gmail.com');

-- ── 10 Sample Tigrinya Riddles ─────────────────────────────────────────────
INSERT INTO riddles (question, question_latin, answer, answer_latin, hint, category, difficulty) VALUES

-- 1
('ኣብ ቤት ኣሎ፡ ካብ ቤት ኣይወጽእን። እንታይ ኢዩ?',
 'Ab bet alo, kab bet aywtse''n. Entay iyu?',
 'ስእሊ',
 'Se''li',
 'ኣብ ዓንቀጽ ይተሓዝ',
 'General', 'easy'),

-- 2
('ክሕዞ ኣይክእልን፡ ክርእዮ ይከኣል። እንታይ ኢዩ?',
 'Khijzo aykeln, kreoyo ykehal. Entay iyu?',
 'ጽላሎት',
 'Tslalot',
 'ፀሓይ ኸሎ ይረአ',
 'Nature', 'medium'),

-- 3
('ትበልዕ ኣይኮነን፡ ትጽው ኣይኮነን፡ ግን ሓቢሩካ ይሓድር። እንታይ ኢዩ?',
 'Tble'' aykonen, tsw aykonen, gn habirkha yhadr. Entay iyu?',
 'ስም',
 'Sm',
 'ፍሉይ ናትካ ኢዩ',
 'General', 'medium'),

-- 4
('ኩሉ ሰብ ዘለዎ፡ ንኻልእ ዝህቦ፡ ንርእሱ ዘይጥቀምሉ። እንታይ ኢዩ?',
 'Kulu seb zelew, nkhal''e zyhbo, nresu zeytqemlu. Entay iyu?',
 'ምኽሪ',
 'Mkhri',
 'ዝሓሸ ንኻልእ ይርኤ',
 'Culture', 'medium'),

-- 5
('ዓሳ ኣሎ ዘይሕምብስ፡ ዛፍ ኣሎ ዘይበቍል፡ ዑፍ ኣሎ ዘይብረር። ኣበይ ኣሎ?',
 'Asa alo zeyhmbas, zaf alo zeybequl, uf alo zeybrer. Abey alo?',
 'ኣብ ካርታ',
 'Ab karta',
 'ኣብ ወረቐት ትርእዮ',
 'General', 'hard'),

-- 6
('ምሸት ኣብ ጎልጎል ዝቕበሮ፡ ንጉሆ ዝወስዶ። እንታይ ኢዩ?',
 'Mshet ab golgoL zqbero, nguho zwesdo. Entay iyu?',
 'ዕራር',
 'Erar',
 'ሰው ዝርዑ ምሸት',
 'Daily Life', 'easy'),

-- 7
('ካብ ቤተሰብ ዘይፍለ፡ ኣፉ ዘይዛረብ፡ ዓይኑ ዘይርኤ። እንታይ ኢዩ?',
 'Kab beteseb zeyfle, afu zeyza''reb, aynu zeyre. Entay iyu?',
 'ናይ ስድራ ስም',
 'Nay sdra sm',
 'ሽም ኣቦ ወይ ኣቦሓጎ',
 'Culture', 'hard'),

-- 8
('ዝነኻዮ ዝሕምቅ፡ ዘይነኻዮ ዘይሕምቅ። እንታይ ኢዩ?',
 'Znekhayo zhmq, zeynkhayo zeyhm. Entay iyu?',
 'ዓለባ',
 'Aleba',
 'ኣብ ሰፈይ ይርከብ',
 'Daily Life', 'easy'),

-- 9
('ኣእዳዉ ብዙሕ፡ እግሩ የብሉን፡ ሰባት ዘጥቅዕ። እንታይ ኢዩ?',
 'Aedawu bzuh, egru yeblun, sebat zetq. Entay iyu?',
 'ዛፍ',
 'Zaf',
 'ቅርንጫፍ ብዙሕ ኣሎዎ',
 'Nature', 'easy'),

-- 10
('ሓደ ዓይኒ ዘለዎ ካብ ቦታ ናብ ቦታ ዝዓልብ ዝሰፍይ ወይ ዝሰምም። እንታይ ኢዩ?',
 'Hade ayni zelew kab bota nab bota zeaelb zesefy wey zesmm. Entay iyu?',
 'መርፍእ',
 'Merfe''',
 'ክዳን ይሰፍ',
 'Daily Life', 'medium');
