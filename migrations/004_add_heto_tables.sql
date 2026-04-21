-- Migration: 004_add_heto_tables
-- Adds Heto (Questions) game tables and leaderboard

-- heto_questions table: Trivia questions with multiple choice answers
CREATE TABLE IF NOT EXISTS heto_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  question_latin TEXT NOT NULL,
  options JSONB NOT NULL,  -- [{label: 'A', text: '...', latin: '...'}]
  correct_option TEXT NOT NULL,  -- 'A', 'B', 'C', or 'D'
  explanation TEXT,
  category TEXT NOT NULL,  -- Geography, History, Culture, Language, Music, General
  difficulty TEXT NOT NULL DEFAULT 'medium',  -- 'easy', 'medium', 'hard'
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- heto_scores table: Leaderboard of game sessions
CREATE TABLE IF NOT EXISTS heto_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  score INT NOT NULL,
  total_possible INT NOT NULL,
  percentage INT NOT NULL,
  category TEXT,
  difficulty TEXT,
  rounds INT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE heto_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heto_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read questions
CREATE POLICY "heto_questions_public_read" ON heto_questions
  FOR SELECT USING (true);

-- RLS Policy: Authenticated users can insert/update/delete questions (for admin panel)
CREATE POLICY "heto_questions_auth_insert" ON heto_questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "heto_questions_auth_update" ON heto_questions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "heto_questions_auth_delete" ON heto_questions
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policy: Anyone can read scores (public leaderboard)
CREATE POLICY "heto_scores_public_read" ON heto_scores
  FOR SELECT USING (true);

-- RLS Policy: Anyone can insert scores (submit game results)
CREATE POLICY "heto_scores_public_insert" ON heto_scores
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_heto_questions_pack ON heto_questions(pack_id);
CREATE INDEX idx_heto_questions_difficulty ON heto_questions(difficulty);
CREATE INDEX idx_heto_questions_category ON heto_questions(category);
CREATE INDEX idx_heto_scores_played ON heto_scores(played_at DESC);
CREATE INDEX idx_heto_scores_user ON heto_scores(user_id);
