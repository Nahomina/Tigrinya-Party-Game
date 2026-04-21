-- ═══════════════════════════════════════════════════════════════════════════════
--  Migration 002: Fix Rarity Tier Constraints
--  Run in Supabase SQL Editor AFTER migration 001.
--
--  Fixes two real bugs in migration 001:
--    1. word_count_actual was computed by counting ASCII colons (:) in the
--       tigrinya text. Tigrinya proverbs use SPACES (and sometimes the Ge'ez
--       wordspace ፡ U+1361), not ASCII colons. This left every proverb with
--       word_count_actual = 1, which fails the CHECK constraint as soon as any
--       proverb_rarity other than 'starter' is assigned.
--
--    2. The word_length / word_count CHECK ranges overlap at their boundaries
--       (e.g. a word of length 5 satisfies BOTH 'starter' and 'intermediate').
--       Non-overlapping ranges make tier membership unambiguous and prevent
--       silent tier-creep when an admin updates a row.
--
--  This migration is idempotent: it drops the old constraints, recomputes the
--  counts correctly, and reinstates tightened CHECKs.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Drop the broken constraints so we can recompute data ──────────
ALTER TABLE words     DROP CONSTRAINT IF EXISTS word_length_by_rarity;
ALTER TABLE proverbs  DROP CONSTRAINT IF EXISTS proverb_length_by_rarity;

-- ── STEP 2: Recompute word_count_actual from real separators ──────────────
-- A "word" in a Tigrinya proverb is separated by either a regular space or
-- the Ge'ez wordspace (፡ U+1361). Count occurrences of either and add 1.
-- REGEXP_REPLACE with the 'g' flag removes every whitespace/Ge'ez-ws run,
-- and we compare lengths to get a separator count.
UPDATE proverbs
SET word_count_actual =
  CASE
    WHEN tigrinya IS NULL OR LENGTH(TRIM(tigrinya)) = 0 THEN 0
    ELSE
      -- Number of separator runs (consecutive spaces / ፡ collapsed to one run)
      -- plus 1 gives the word count.
      (LENGTH(REGEXP_REPLACE(TRIM(tigrinya), '[\s፡]+', 'X', 'g'))
        - LENGTH(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(tigrinya), '[\s፡]+', 'X', 'g'), 'X', '', 'g'))
        + 1)
  END;

-- Sanity: no proverb should have word_count_actual = 0 after the update.
-- (If any remain, the CHECK below will reject them — investigate before rerunning.)

-- ── STEP 3: Recompute word_length robustly ────────────────────────────────
-- LENGTH() in Postgres returns character count for TEXT, which is what we want
-- for Ge'ez script (each fidel glyph = 1 char). Still recompute in case earlier
-- rows had NULL or were inserted before migration 001.
UPDATE words
SET word_length = CHAR_LENGTH(TRIM(word))
WHERE word IS NOT NULL;

-- ── STEP 4: Re-tag any proverbs that violated the old (wrong) constraint ──
-- Migration 001 left proverbs pinned at 'starter' because word_count_actual
-- was stuck at 1. Re-tag using the corrected counts with NON-OVERLAPPING
-- boundaries:
--    starter      : 2–4 words
--    intermediate : 5–7 words
--    advanced     : 8–10 words
--    expert       : 11+ words
UPDATE proverbs SET proverb_rarity = 'starter'      WHERE word_count_actual BETWEEN 2 AND 4;
UPDATE proverbs SET proverb_rarity = 'intermediate' WHERE word_count_actual BETWEEN 5 AND 7;
UPDATE proverbs SET proverb_rarity = 'advanced'     WHERE word_count_actual BETWEEN 8 AND 10;
UPDATE proverbs SET proverb_rarity = 'expert'       WHERE word_count_actual >= 11;

-- Anything with 0 or 1 words is malformed — leave as 'starter' and surface via audit query.

-- ── STEP 5: Re-tag words with non-overlapping ranges ──────────────────────
--    starter      : 2–5 chars
--    intermediate : 6–7 chars
--    advanced     : 8–9 chars
--    expert       : 10+ chars
UPDATE words SET word_rarity = 'starter'      WHERE word_length BETWEEN 2 AND 5;
UPDATE words SET word_rarity = 'intermediate' WHERE word_length BETWEEN 6 AND 7;
UPDATE words SET word_rarity = 'advanced'     WHERE word_length BETWEEN 8 AND 9;
UPDATE words SET word_rarity = 'expert'       WHERE word_length >= 10;

-- ── STEP 6: Reinstate tightened, non-overlapping CHECK constraints ────────
ALTER TABLE words ADD CONSTRAINT word_length_by_rarity
  CHECK (
    (word_rarity = 'starter'      AND word_length BETWEEN 2 AND 5)  OR
    (word_rarity = 'intermediate' AND word_length BETWEEN 6 AND 7)  OR
    (word_rarity = 'advanced'     AND word_length BETWEEN 8 AND 9)  OR
    (word_rarity = 'expert'       AND word_length >= 10)
  );

ALTER TABLE proverbs ADD CONSTRAINT proverb_length_by_rarity
  CHECK (
    (proverb_rarity = 'starter'      AND word_count_actual BETWEEN 2 AND 4)  OR
    (proverb_rarity = 'intermediate' AND word_count_actual BETWEEN 5 AND 7)  OR
    (proverb_rarity = 'advanced'     AND word_count_actual BETWEEN 8 AND 10) OR
    (proverb_rarity = 'expert'       AND word_count_actual >= 11)
  );

-- ── STEP 7: Audit queries (run manually after migration) ──────────────────
-- Sanity-check distribution:
--   SELECT proverb_rarity, COUNT(*), MIN(word_count_actual), MAX(word_count_actual)
--     FROM proverbs GROUP BY proverb_rarity ORDER BY proverb_rarity;
--
--   SELECT word_rarity, COUNT(*), MIN(word_length), MAX(word_length)
--     FROM words GROUP BY word_rarity ORDER BY word_rarity;
--
-- Flag malformed proverbs (should return zero rows):
--   SELECT id, tigrinya, word_count_actual FROM proverbs WHERE word_count_actual < 2;
