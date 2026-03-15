-- MatchMakerAI Quiz Submissions Table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE soulai_quiz_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  session_id text,

  -- Phase 1 answers (personality)
  q1_answer text,
  q2_answer text,
  q3_answer text,
  q4_answer text,
  q5_answer text,
  q6_answer text,

  -- Phase 2 answers (practical)
  q7_answer text,
  q8_answer text,
  q9_answer text,
  q10_answer text,
  q11_answer text,
  q12_answer text,

  -- 4-axis personality scores (-1 ~ +1)
  score_speed_depth float,
  score_real_creative float,
  score_logic_visual float,
  score_plan_flow float,

  -- Matched result
  result_type_id text NOT NULL,
  result_type_name text,
  main_llm text,
  recommended_tier text,

  -- Practical profile
  usage_needs text[],
  frequency text,
  priority text,
  experience text,
  budget_krw integer,

  -- Anonymous metadata
  user_agent text,
  referrer text,
  locale text
);

-- RLS: Anyone can INSERT (anonymous), only authenticated users can SELECT
ALTER TABLE soulai_quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert submissions"
  ON soulai_quiz_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only authenticated can read"
  ON soulai_quiz_submissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes for analytics queries
CREATE INDEX idx_quiz_result_type ON soulai_quiz_submissions(result_type_id);
CREATE INDEX idx_quiz_created_at ON soulai_quiz_submissions(created_at);
CREATE INDEX idx_quiz_main_llm ON soulai_quiz_submissions(main_llm);


-- ============================================================
-- Event Tracking Table
-- ============================================================

CREATE TABLE soulai_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  session_id text NOT NULL,

  -- Event type: 'screen_view' | 'share_click' | 'session_end'
  event text NOT NULL,

  -- Optional context
  screen text,               -- e.g., 'intro', 'quiz_phase1_q3', 'result'
  result_type_id text,       -- filled on result/share events
  duration_seconds integer,  -- filled on session_end
  metadata jsonb             -- flexible extra data
);

ALTER TABLE soulai_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
  ON soulai_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only authenticated can read events"
  ON soulai_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_events_event ON soulai_events(event);
CREATE INDEX idx_events_session ON soulai_events(session_id);
CREATE INDEX idx_events_created ON soulai_events(created_at);
