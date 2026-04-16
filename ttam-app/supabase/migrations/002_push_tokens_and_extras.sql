-- ════════════════════════════════════════════════════════════════
-- TTAM Migration 002 – Push tokens & admin setup helpers
-- Run this in Supabase SQL Editor AFTER 001_initial.sql
-- ════════════════════════════════════════════════════════════════

-- ── Push notification tokens (for Capacitor mobile) ─────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  token       TEXT NOT NULL,
  platform    TEXT CHECK (platform IN ('ios','android','web','unknown')),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- ── Hall closure / holiday schedule ─────────────────────────────
CREATE TABLE IF NOT EXISTS hall_closures (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  closure_date  DATE NOT NULL,
  reason        TEXT,
  all_day       BOOLEAN DEFAULT TRUE,
  start_time    TIME,
  end_time      TIME,
  created_by    UUID REFERENCES profiles(id)
);

ALTER TABLE hall_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read closures" ON hall_closures FOR SELECT USING (true);
CREATE POLICY "Admins manage closures" ON hall_closures FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ── Announcements ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT DEFAULT 'general' CHECK (type IN ('general','urgent','tournament','maintenance')),
  audience    TEXT DEFAULT 'all' CHECK (audience IN ('all','members','admins')),
  published   BOOLEAN DEFAULT FALSE,
  pinned      BOOLEAN DEFAULT FALSE,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published" ON announcements
  FOR SELECT USING (published = TRUE);
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ── Membership fee schedule ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_fees (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_type   TEXT NOT NULL CHECK (membership_type IN ('junior','senior','elite')),
  annual_fee        NUMERIC NOT NULL,
  valid_from        DATE NOT NULL,
  valid_until       DATE,
  currency          TEXT DEFAULT 'MVR'
);

INSERT INTO membership_fees (membership_type, annual_fee, valid_from) VALUES
  ('junior', 300,  '2026-01-01'),
  ('senior', 500,  '2026-01-01'),
  ('elite',  1000, '2026-01-01')
ON CONFLICT DO NOTHING;

-- ── Admin dashboard stats view ────────────────────────────────────
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'member') AS total_members,
  (SELECT COUNT(*) FROM profiles WHERE role = 'member' AND membership_status = 'active') AS active_members,
  (SELECT COUNT(*) FROM bookings WHERE booking_date = CURRENT_DATE) AS bookings_today,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND booking_date >= CURRENT_DATE) AS upcoming_bookings,
  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'verified' AND created_at >= date_trunc('month', NOW())) AS revenue_this_month,
  (SELECT COUNT(*) FROM payments WHERE status = 'pending') AS pending_payments,
  (SELECT COUNT(*) FROM tournaments WHERE status IN ('upcoming','registration')) AS active_tournaments;

-- ── Monthly revenue view ──────────────────────────────────────────
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(amount) AS total,
  COUNT(*) AS transactions
FROM payments
WHERE status = 'verified'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ════════════════════════════════════════════════════════════════
-- FIRST-TIME ADMIN SETUP
-- After creating your account via /register, run this with YOUR email:
-- ════════════════════════════════════════════════════════════════
-- UPDATE profiles
-- SET
--   role = 'superadmin',
--   membership_status = 'active',
--   membership_expiry = '2099-12-31'
-- WHERE email = 'your-email@example.com';
-- 
-- ════════════════════════════════════════════════════════════════
-- VERIFY EVERYTHING IS SET UP
-- ════════════════════════════════════════════════════════════════
-- SELECT * FROM admin_stats;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
