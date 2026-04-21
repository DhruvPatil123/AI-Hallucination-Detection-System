-- ============================================================
-- Nexa AI AHDS — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES — Extended user data (auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter','enterprise','dedicated')),
  api_calls_used INTEGER DEFAULT 0,
  api_calls_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 2. VERIFICATIONS — Each hallucination analysis request + result
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_text TEXT NOT NULL,
  domain TEXT DEFAULT 'general' CHECK (domain IN ('general','medical','legal','financial','technical')),
  hallucination_score NUMERIC(5,3) DEFAULT 0,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  processing_time_ms INTEGER DEFAULT 0,
  model_version TEXT DEFAULT 'ahds-v1.0.4',
  threshold NUMERIC(3,2) DEFAULT 0.40,
  span_count INTEGER DEFAULT 0,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications"
  ON verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert (for Edge Functions)
CREATE POLICY "Service role can insert verifications"
  ON verifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_verifications_user_id ON verifications(user_id);
CREATE INDEX idx_verifications_created_at ON verifications(created_at DESC);
CREATE INDEX idx_verifications_risk_level ON verifications(risk_level);


-- 3. FLAGGED SPANS — Individual hallucinated spans per verification
CREATE TABLE IF NOT EXISTS flagged_spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  span_index INTEGER DEFAULT 0,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  flagged_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('factual','citation','logical','numerical','temporal')),
  confidence NUMERIC(4,3) DEFAULT 0,
  evidence TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flagged_spans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spans"
  ON flagged_spans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spans"
  ON flagged_spans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_spans_verification_id ON flagged_spans(verification_id);
CREATE INDEX idx_spans_category ON flagged_spans(category);


-- 4. FEEDBACK — User feedback on individual spans (👍/👎)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE NOT NULL,
  span_id UUID REFERENCES flagged_spans(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correct','incorrect')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 5. AUDIT LOGS — Immutable trail of all verifications (for dashboard)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_id UUID REFERENCES verifications(id) ON DELETE SET NULL,
  model_id TEXT,
  hallucination_score NUMERIC(5,3),
  risk_level TEXT CHECK (risk_level IN ('low','medium','high','critical')),
  primary_category TEXT CHECK (primary_category IN ('factual','citation','logical','numerical','temporal')),
  span_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  domain TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_risk_level ON audit_logs(risk_level);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);


-- 6. ENABLE REALTIME on audit_logs for live dashboard feed
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;


-- 7. HELPER VIEW — Dashboard aggregate stats (last 7 days)
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  user_id,
  COUNT(*) AS total_verifications,
  COUNT(*) FILTER (WHERE risk_level IN ('high','critical')) AS flagged_count,
  ROUND(
    COUNT(*) FILTER (WHERE risk_level IN ('high','critical'))::NUMERIC 
    / NULLIF(COUNT(*), 0) * 100, 1
  ) AS detection_rate,
  ROUND(AVG(processing_time_ms)::NUMERIC, 0) AS avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms)::NUMERIC, 0) AS p95_latency_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY processing_time_ms)::NUMERIC, 0) AS p99_latency_ms,
  ROUND(AVG(hallucination_score)::NUMERIC, 3) AS avg_score
FROM verifications
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY user_id;


-- 8. HELPER VIEW — Category breakdown
CREATE OR REPLACE VIEW category_breakdown AS
SELECT
  fs.user_id,
  fs.category,
  COUNT(*) AS count,
  ROUND(
    COUNT(*)::NUMERIC / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY fs.user_id), 0) * 100, 1
  ) AS percentage
FROM flagged_spans fs
WHERE fs.created_at >= now() - INTERVAL '7 days'
GROUP BY fs.user_id, fs.category;


-- 9. HELPER VIEW — Risk level distribution
CREATE OR REPLACE VIEW risk_distribution AS
SELECT
  user_id,
  risk_level,
  COUNT(*) AS count,
  ROUND(
    COUNT(*)::NUMERIC / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY user_id), 0) * 100, 1
  ) AS percentage
FROM verifications
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY user_id, risk_level;


-- 10. Function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(uid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET api_calls_used = api_calls_used + 1, updated_at = now() WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
