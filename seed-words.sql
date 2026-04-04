-- Mayim: Tigrinya Party Game - Word Database Seed
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)

-- ═══════════════════════════════════════════════════════════════════════════════
-- Step 1: Create the words table (if it doesn't exist)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  latin TEXT NOT NULL,
  english TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Step 2: Enable Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read" ON words;
DROP POLICY IF EXISTS "Allow authenticated insert" ON words;
DROP POLICY IF EXISTS "Allow authenticated update" ON words;
DROP POLICY IF EXISTS "Allow authenticated delete" ON words;

-- Allow public READ (for game players)
CREATE POLICY "Allow public read" ON words
  FOR SELECT
  USING (true);

-- Allow authenticated users to INSERT (for admin panel)
CREATE POLICY "Allow authenticated insert" ON words
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to UPDATE (for admin panel)
CREATE POLICY "Allow authenticated update" ON words
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to DELETE (for admin panel)
CREATE POLICY "Allow authenticated delete" ON words
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════════════════
-- Step 3: Seed 70 Tigrinya words (Food, Culture, Daily Life categories)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Clear existing data (optional - comment out if you want to keep old words)
-- DELETE FROM words;

-- Food category (20 words)
INSERT INTO words (word, latin, english, category) VALUES
  ('እንጀራ', 'Injera', 'Sourdough flatbread', 'Food'),
  ('ጽብሒ', 'Tsebhi', 'Spicy stew', 'Food'),
  ('ቆሎ', 'Kolo', 'Roasted barley snack', 'Food'),
  ('ሂምባሻ', 'Himbasha', 'Celebration bread', 'Food'),
  ('ሽሮ', 'Shiro', 'Chickpea flour stew', 'Food'),
  ('ቃርሳ', 'Qarsa', 'Fresh butter', 'Food'),
  ('ቅንጬ', 'Kinche', 'Cracked wheat porridge', 'Food'),
  ('ቡን', 'Bun', 'Coffee', 'Food'),
  ('ሻሂ', 'Shahi', 'Tea', 'Food'),
  ('ማይ', 'May', 'Water', 'Food'),
  ('ጸባ', 'Tseba', 'Milk', 'Food'),
  ('ቢራ', 'Bira', 'Beer', 'Food'),
  ('ዝግኒ', 'Zigni', 'Spicy beef stew', 'Food'),
  ('ኣሊጫ', 'Alicha', 'Mild vegetable stew', 'Food'),
  ('ጥብስ', 'Tibs', 'Sautéed meat', 'Food'),
  ('ዳቦ', 'Dabo', 'Bread', 'Food'),
  ('መዓር', 'Me''ar', 'Honey', 'Food'),
  ('ሓምሊ', 'Hamli', 'Collard greens', 'Food'),
  ('ትምቲሞ', 'Timtimo', 'Red lentil stew', 'Food'),
  ('ፊንጃል', 'Finjal', 'Small coffee cup', 'Food');

-- Culture category (20 words)
INSERT INTO words (word, latin, english, category) VALUES
  ('መሰንቆ', 'Masenqo', 'Single-stringed lute', 'Culture'),
  ('ክራር', 'Kirar', 'Lyre-like instrument', 'Culture'),
  ('ዙረት', 'Zuret', 'Traditional dance', 'Culture'),
  ('ዙርያ', 'Zuria', 'Traditional dress', 'Culture'),
  ('ነጸላ', 'Netsela', 'Traditional white shawl', 'Culture'),
  ('ኣውደዓመት', 'Awde-amet', 'New Year / Holiday', 'Culture'),
  ('ጋሻ', 'Gasha', 'Guest / Visitor', 'Culture'),
  ('ምርዓ', 'Mir''a', 'Wedding ceremony', 'Culture'),
  ('ጥምቀት', 'Timqet', 'Epiphany celebration', 'Culture'),
  ('መስቀል', 'Mesqel', 'Finding of the True Cross', 'Culture'),
  ('ጅብና', 'Jebena', 'Clay coffee pot', 'Culture'),
  ('መሶብ', 'Mesob', 'Woven injera basket', 'Culture'),
  ('ጓይላ', 'Guayla', 'Celebratory party / dance', 'Culture'),
  ('እልልታ', 'Elelta', 'Ululation (joy call)', 'Culture'),
  ('ሽማግለ', 'Shimagile', 'Community elder', 'Culture'),
  ('ባህሊ', 'Bahli', 'Culture / Tradition', 'Culture'),
  ('ቋንቋ', 'Quanqua', 'Language', 'Culture'),
  ('ሃገር', 'Hager', 'Country / Nation', 'Culture'),
  ('ሰላም', 'Selam', 'Peace / Hello', 'Culture'),
  ('ፍቕሪ', 'Fiqri', 'Love', 'Culture');

-- Daily Life category (20 words)
INSERT INTO words (word, latin, english, category) VALUES
  ('መኪና', 'Mekina', 'Car / Automobile', 'Daily Life'),
  ('ገዛ', 'Geza', 'House / Home', 'Daily Life'),
  ('መንገዲ', 'Mengedi', 'Road / Path', 'Daily Life'),
  ('ዕዳጋ', 'Edaga', 'Market / Bazaar', 'Daily Life'),
  ('ትምህርቲ', 'Timhirti', 'Education / School', 'Daily Life'),
  ('ስራሕ', 'Sirah', 'Work / Job', 'Daily Life'),
  ('ገንዘብ', 'Genzeb', 'Money', 'Daily Life'),
  ('ቴሌፎን', 'Telephon', 'Telephone', 'Daily Life'),
  ('መጽሓፍ', 'Mets''haf', 'Book', 'Daily Life'),
  ('ደቂ', 'Deqi', 'Children', 'Daily Life'),
  ('ደቀባት', 'Deqebat', 'Indigenous / Local people', 'Daily Life'),
  ('ጎረቤት', 'Gorebet', 'Neighbour', 'Daily Life'),
  ('ጸሓይ', 'Tsehay', 'Sun', 'Daily Life'),
  ('ወርሒ', 'Werhi', 'Moon / Month', 'Daily Life'),
  ('ንፋስ', 'Nifas', 'Wind / Breeze', 'Daily Life'),
  ('ክዳን', 'Kidan', 'Clothes / Garment', 'Daily Life'),
  ('ጫማ', 'Chama', 'Shoes', 'Daily Life'),
  ('ደቂስካ', 'Deqiska', 'Sleeping', 'Daily Life'),
  ('ምሳሕ', 'Misah', 'Lunch', 'Daily Life'),
  ('ድራር', 'Dirar', 'Dinner', 'Daily Life');

-- ═══════════════════════════════════════════════════════════════════════════════
-- Verification: Check that all 60 words were inserted
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this to verify:
-- SELECT COUNT(*) as total_words, category, COUNT(*) as count FROM words GROUP BY category;
--
-- Expected output:
-- total_words | category   | count
-- ────────────┼────────────┼───────
--      20     | Food       | 20
--      20     | Culture    | 20
--      20     | Daily Life | 20
--      60     | (total)    | 60
