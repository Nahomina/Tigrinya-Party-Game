-- ═══════════════════════════════════════════════════════════════════════════════
--  Migration: Add Rarity Tier System
--  Run this in Supabase SQL Editor AFTER the existing seed-words.sql and seed-packs.sql
--
--  This migration:
--  1. Adds word_rarity and word_length columns to words table
--  2. Adds proverb_rarity and word_count_actual columns to proverbs table
--  3. Creates CHECK constraints for tier compliance
--  4. Creates indexes for query performance
--  5. Provides a data migration script to tag existing words/proverbs
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Add tier columns to words table ────────────────────────────────
ALTER TABLE words ADD COLUMN IF NOT EXISTS word_rarity TEXT DEFAULT 'starter';
ALTER TABLE words ADD COLUMN IF NOT EXISTS word_length INT;

-- Calculate word_length from Tigrinya word (character count)
UPDATE words SET word_length = LENGTH(word) WHERE word_length IS NULL;

-- ── STEP 2: Add CHECK constraint for word length by tier ───────────────────
ALTER TABLE words ADD CONSTRAINT word_length_by_rarity
  CHECK (
    (word_rarity = 'starter' AND word_length <= 5) OR
    (word_rarity = 'intermediate' AND word_length BETWEEN 5 AND 7) OR
    (word_rarity = 'advanced' AND word_length BETWEEN 6 AND 9) OR
    (word_rarity = 'expert' AND word_length BETWEEN 7 AND 12)
  );

-- Create index for word_rarity queries
CREATE INDEX IF NOT EXISTS idx_words_word_rarity ON words(word_rarity);
CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);

-- ── STEP 3: Add tier columns to proverbs table ────────────────────────────
ALTER TABLE proverbs ADD COLUMN IF NOT EXISTS proverb_rarity TEXT DEFAULT 'starter';
ALTER TABLE proverbs ADD COLUMN IF NOT EXISTS word_count_actual INT;

-- Calculate proverb word count (count spaces + 1)
-- Approximate: split by spaces to count words in Tigrinya/Latin text
UPDATE proverbs
SET word_count_actual = (LENGTH(tigrinya) - LENGTH(REPLACE(tigrinya, ':', '')) + 1)
WHERE word_count_actual IS NULL;

-- ── STEP 4: Add CHECK constraint for proverb length by tier ───────────────
ALTER TABLE proverbs ADD CONSTRAINT proverb_length_by_rarity
  CHECK (
    (proverb_rarity = 'starter' AND word_count_actual BETWEEN 2 AND 4) OR
    (proverb_rarity = 'intermediate' AND word_count_actual BETWEEN 4 AND 7) OR
    (proverb_rarity = 'advanced' AND word_count_actual BETWEEN 8 AND 10) OR
    (proverb_rarity = 'expert' AND word_count_actual >= 10)
  );

-- Create index for proverb_rarity queries
CREATE INDEX IF NOT EXISTS idx_proverbs_proverb_rarity ON proverbs(proverb_rarity);
CREATE INDEX IF NOT EXISTS idx_proverbs_difficulty ON proverbs(difficulty);

-- ── STEP 5: Update packs table with rarity info ────────────────────────────
ALTER TABLE packs ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'starter';
ALTER TABLE packs ADD COLUMN IF NOT EXISTS sequence_order INT DEFAULT 1;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS include_lower_tiers BOOLEAN DEFAULT TRUE;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS difficulty_min TEXT DEFAULT 'easy';
ALTER TABLE packs ADD COLUMN IF NOT EXISTS difficulty_max TEXT DEFAULT 'hard';

-- Update existing packs with tier info
UPDATE packs SET rarity = 'starter', sequence_order = 1 WHERE slug = 'classic';
UPDATE packs SET rarity = 'intermediate', sequence_order = 2 WHERE slug = 'intermediate';
UPDATE packs SET rarity = 'advanced', sequence_order = 3 WHERE slug = 'advanced';
UPDATE packs SET rarity = 'expert', sequence_order = 4 WHERE slug = 'expert';

-- Set difficulty ranges per tier
UPDATE packs SET difficulty_min = 'easy', difficulty_max = 'medium' WHERE rarity = 'starter';
UPDATE packs SET difficulty_min = 'medium', difficulty_max = 'hard' WHERE rarity = 'intermediate';
UPDATE packs SET difficulty_min = 'hard', difficulty_max = 'hard' WHERE rarity = 'advanced';
UPDATE packs SET difficulty_min = 'hard', difficulty_max = 'expert' WHERE rarity = 'expert';

-- ── STEP 6: Data Migration - Auto-assign word_rarity based on word_length ───
-- This assigns tiers to existing words based on their character length

-- Clear any existing tier assignments (optional - comment out to preserve)
UPDATE words SET word_rarity = 'starter' WHERE word_rarity IS NULL;

-- Auto-assign based on character count (approximate)
-- Starter: 2-5 chars = basic words (ሰብ, ሰነይ, ገዛ, ቤት)
UPDATE words
SET word_rarity = 'starter'
WHERE word_rarity = 'starter' AND word_length BETWEEN 2 AND 5;

-- Intermediate: 6-8 chars = medium words (ምግብቲ, ምሰናይ)
UPDATE words
SET word_rarity = 'intermediate'
WHERE word_length BETWEEN 6 AND 8;

-- Advanced: 9-11 chars = complex words (ሕብረተሰብ, ምግብርግብ)
UPDATE words
SET word_rarity = 'advanced'
WHERE word_length BETWEEN 9 AND 11;

-- Expert: 12+ chars = very rare/complex words
UPDATE words
SET word_rarity = 'expert'
WHERE word_length > 11;

-- ── STEP 7: Verification Queries ────────────────────────────────────────────
-- Run these to verify the migration succeeded:
--
-- SELECT COUNT(*) as total, word_rarity, COUNT(DISTINCT category) as categories
--   FROM words
--   GROUP BY word_rarity
--   ORDER BY word_rarity;
--
-- SELECT COUNT(*) as total, proverb_rarity, COUNT(DISTINCT difficulty) as difficulties
--   FROM proverbs
--   GROUP BY proverb_rarity
--   ORDER BY proverb_rarity;
--
-- SELECT slug, rarity, sequence_order, difficulty_min, difficulty_max
--   FROM packs
--   ORDER BY sequence_order;

-- ── STEP 8: Summary ───────────────────────────────────────────────────────
-- Migration completed. Expected results:
--
-- Words by Rarity:
--   starter      ≈ 30-40 words
--   intermediate ≈ 15-25 words
--   advanced     ≈ 5-10 words
--   expert       ≈ 1-5 words
--
-- Proverbs by Rarity:
--   starter      ≈ 10-15 proverbs (2-4 words)
--   intermediate ≈ 15-20 proverbs (4-7 words)
--   advanced     ≈ 10-15 proverbs (8-10 words)
--   expert       ≈ 5-10 proverbs (10+ words)
--
-- Packs:
--   classic (Starter) → sequence_order=1, difficulty_min='easy'
--   intermediate (Intermediate) → sequence_order=2, difficulty_min='medium'
--   advanced (Advanced) → sequence_order=3, difficulty_min='hard'
--   expert (Expert) → sequence_order=4, difficulty_min='hard'
