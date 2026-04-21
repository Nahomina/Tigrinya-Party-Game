-- Migration 003: Rename pack slugs to match tier names
-- Run in Supabase SQL Editor AFTER migrations 001 and 002.
-- Renames hadar→intermediate, adi→advanced, weledo→expert
-- user_pack_unlocks uses pack_id FK (not slug) so no rows need updating there.

BEGIN;

UPDATE packs SET slug = 'intermediate' WHERE slug = 'hadar';
UPDATE packs SET slug = 'advanced'     WHERE slug = 'adi';
UPDATE packs SET slug = 'expert'       WHERE slug = 'weledo';

-- Verify
SELECT slug, name_en, rarity, sequence_order FROM packs ORDER BY sequence_order;

COMMIT;
