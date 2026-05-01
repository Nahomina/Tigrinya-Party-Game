-- Migration 007: riddles_scores leaderboard table
-- Mirrors heto_scores. Public read, public insert (anonymous play allowed).

CREATE TABLE IF NOT EXISTS riddles_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name       TEXT NOT NULL,
  score           INT  NOT NULL CHECK (score >= 0),
  total_possible  INT  NOT NULL CHECK (total_possible > 0),
  percentage      INT  NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  difficulty      TEXT NOT NULL,
  rounds          INT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  played_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE riddles_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "riddles_scores_public_read"   ON riddles_scores FOR SELECT USING (true);
CREATE POLICY "riddles_scores_public_insert" ON riddles_scores FOR INSERT WITH CHECK (true);

CREATE INDEX idx_riddles_scores_played_at  ON riddles_scores (played_at DESC);
CREATE INDEX idx_riddles_scores_percentage ON riddles_scores (percentage DESC, score DESC);
CREATE INDEX idx_riddles_scores_user_id    ON riddles_scores (user_id);

-- Enable Realtime so the leaderboard modal can subscribe to live INSERTs
ALTER PUBLICATION supabase_realtime ADD TABLE riddles_scores;

-- Same for heto_scores if not already enabled (idempotent).
-- If heto_scores is already in the publication, this is a no-op error you can ignore.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE heto_scores;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
