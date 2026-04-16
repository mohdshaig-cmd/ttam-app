-- ═══════════════════════════════════════════════════════════════
-- TTAM – Full Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════

-- ── Sequences ────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS booking_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS member_seq START 1;

-- ── Profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID REFERENCES auth.users PRIMARY KEY,
  full_name           TEXT NOT NULL,
  phone               TEXT,
  national_id         TEXT UNIQUE,
  date_of_birth       DATE,
  role                TEXT DEFAULT 'member' CHECK (role IN ('member','guest','admin','superadmin')),
  member_id           TEXT UNIQUE,
  membership_type     TEXT DEFAULT 'senior' CHECK (membership_type IN ('junior','senior','elite')),
  membership_status   TEXT DEFAULT 'active' CHECK (membership_status IN ('active','expired','suspended')),
  membership_expiry   DATE,
  avatar_url          TEXT,
  national_ranking    INTEGER,
  rating_points       INTEGER DEFAULT 0,
  email               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-assign member_id on insert
CREATE OR REPLACE FUNCTION assign_member_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.member_id IS NULL THEN
    NEW.member_id := 'TTAM-' || LPAD(NEXTVAL('member_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_profile_insert
BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION assign_member_id();

-- Copy email from auth on profile create
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Tables ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT NOT NULL,
  number                INTEGER NOT NULL UNIQUE,
  status                TEXT DEFAULT 'available' CHECK (status IN ('available','maintenance','retired')),
  hourly_rate_member    NUMERIC DEFAULT 50,
  hourly_rate_guest     NUMERIC DEFAULT 150,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tables (name, number, hourly_rate_member, hourly_rate_guest) VALUES
  ('Table 1', 1, 50, 150), ('Table 2', 2, 50, 150),
  ('Table 3', 3, 50, 150), ('Table 4', 4, 50, 150),
  ('Table 5', 5, 50, 150), ('Table 6', 6, 50, 150),
  ('Table 7', 7, 50, 150), ('Table 8', 8, 50, 150)
ON CONFLICT (number) DO NOTHING;

-- ── Bookings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref     TEXT UNIQUE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  table_id        UUID REFERENCES tables(id),
  booking_type    TEXT DEFAULT 'member' CHECK (booking_type IN ('member','guest','training','tournament')),
  booking_date    DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  duration_hours  NUMERIC NOT NULL,
  amount          NUMERIC NOT NULL,
  status          TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes           TEXT,
  cancelled_at    TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate bookings (same table, same date, same start_time, not cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS no_double_booking
ON bookings (table_id, booking_date, start_time)
WHERE status != 'cancelled';

-- Auto generate booking_ref
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_ref := 'BK-' || TO_CHAR(NOW(), 'YYYY-MMDD') || '-' ||
    LPAD(NEXTVAL('booking_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_booking_ref
BEFORE INSERT ON bookings
FOR EACH ROW WHEN (NEW.booking_ref IS NULL)
EXECUTE FUNCTION generate_booking_ref();

-- ── Guests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  nationality   TEXT,
  guest_type    TEXT DEFAULT 'day' CHECK (guest_type IN ('day','week','accompanying')),
  invited_by    UUID REFERENCES profiles(id),
  valid_from    DATE NOT NULL,
  valid_until   DATE NOT NULL,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','expired')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_ref      TEXT UNIQUE,
  user_id          UUID REFERENCES profiles(id),
  booking_id       UUID REFERENCES bookings(id),
  amount           NUMERIC NOT NULL,
  currency         TEXT DEFAULT 'MVR',
  payment_method   TEXT CHECK (payment_method IN ('BML','MIB','MCB','mFaisa','MePay','cash')),
  transaction_ref  TEXT,
  slip_url         TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  verified_by      UUID REFERENCES profiles(id),
  verified_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Invoices ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number  TEXT UNIQUE,
  user_id         UUID REFERENCES profiles(id),
  booking_id      UUID REFERENCES bookings(id),
  payment_id      UUID REFERENCES payments(id),
  amount          NUMERIC NOT NULL,
  due_date        DATE,
  status          TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue','cancelled')),
  pdf_url         TEXT,
  emailed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate invoice_number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(NEXTVAL('invoice_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

-- Auto-create invoice when booking is confirmed
CREATE OR REPLACE FUNCTION create_invoice_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO invoices (user_id, booking_id, amount, due_date)
  VALUES (
    NEW.user_id,
    NEW.id,
    NEW.amount,
    (NEW.booking_date + INTERVAL '7 days')::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER auto_create_invoice
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_invoice_on_booking();

-- ── Tournaments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                TEXT NOT NULL,
  description         TEXT,
  type                TEXT CHECK (type IN ('national','inter-island','juniors','open','international')),
  status              TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','registration','ongoing','completed')),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  venue               TEXT,
  max_participants    INTEGER,
  registration_fee    NUMERIC DEFAULT 0,
  prize_pool          TEXT,
  category            TEXT,
  banner_url          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id   UUID REFERENCES tournaments(id),
  user_id         UUID REFERENCES profiles(id),
  category        TEXT,
  status          TEXT DEFAULT 'registered' CHECK (status IN ('registered','confirmed','withdrawn')),
  payment_status  TEXT DEFAULT 'pending',
  registered_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- ── International Results ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS international_results (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_name  TEXT NOT NULL,
  tournament_type  TEXT,
  year             INTEGER NOT NULL,
  player_id        UUID REFERENCES profiles(id),
  player_name      TEXT NOT NULL,
  category         TEXT,
  result           TEXT NOT NULL,
  location         TEXT,
  notes            TEXT
);

-- ── Notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id),
  type        TEXT CHECK (type IN ('booking','payment','invoice','tournament','announcement','system')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-notify on booking confirmation
CREATE OR REPLACE FUNCTION notify_on_booking()
RETURNS TRIGGER AS $$
DECLARE tbl_name TEXT;
BEGIN
  SELECT name INTO tbl_name FROM tables WHERE id = NEW.table_id;
  INSERT INTO notifications (user_id, type, title, body, action_url)
  VALUES (
    NEW.user_id,
    'booking',
    'Booking Confirmed ✓',
    'Your ' || tbl_name || ' is booked for ' ||
      TO_CHAR(NEW.booking_date, 'DD Mon YYYY') || ' at ' ||
      TO_CHAR(NEW.start_time, 'HH12:MI AM') || '.',
    '/my-bookings'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER booking_notification
AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION notify_on_booking();

-- Auto-notify on payment verified
CREATE OR REPLACE FUNCTION notify_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (
      NEW.user_id,
      'payment',
      'Payment Verified ✓',
      'Your payment of MVR ' || NEW.amount || ' has been verified.',
      '/invoices'
    );
    UPDATE invoices SET status = 'paid' WHERE booking_id = NEW.booking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER payment_notification
AFTER UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION notify_on_payment();

-- ── Exco Members ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exco_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name     TEXT NOT NULL,
  position      TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  bio           TEXT,
  photo_url     TEXT,
  term_start    DATE,
  term_end      DATE,
  display_order INTEGER,
  is_active     BOOLEAN DEFAULT TRUE
);

INSERT INTO exco_members (full_name, position, email, display_order, is_active) VALUES
  ('Ahmed Hassan', 'President', 'president@ttam.mv', 1, TRUE),
  ('Fatima Mohamed', 'Vice President', 'vp@ttam.mv', 2, TRUE),
  ('Ibrahim Rasheed', 'General Secretary', 'secretary@ttam.mv', 3, TRUE),
  ('Zainab Ahmed', 'Treasurer', 'treasurer@ttam.mv', 4, TRUE),
  ('Hassan Manik', 'Technical Director', 'technical@ttam.mv', 5, TRUE),
  ('Mohamed Ali', 'Competitions Manager', 'competitions@ttam.mv', 6, TRUE),
  ('Laila Rasheed', 'Youth Development Officer', 'youth@ttam.mv', 7, TRUE),
  ('Yoosuf Amir', 'Communications Officer', 'comms@ttam.mv', 8, TRUE)
ON CONFLICT DO NOTHING;

-- ── International Results seed data ──────────────────────────────
INSERT INTO international_results (tournament_name, year, player_name, category, result, location) VALUES
  ('OTTF Open Championships', 2025, 'Hassan Manik', 'Men''s Singles', 'Gold', 'Auckland'),
  ('South Asian Games', 2025, 'Fatima Mohamed', 'Women''s Singles', 'Bronze', 'Colombo'),
  ('ITTF South Asia Open', 2024, 'Ibrahim Rasheed', 'Men''s Singles', 'Silver', 'Dhaka'),
  ('Indian Ocean Islands Games', 2024, 'Hassan Manik', 'Men''s Singles', 'Gold', 'Male'''),
  ('SAARC Table Tennis Championships', 2023, 'Ahmed Hassan', 'Men''s Doubles', 'Silver', 'Kathmandu')
ON CONFLICT DO NOTHING;

-- ── Sample Tournaments ────────────────────────────────────────────
INSERT INTO tournaments (name, type, status, start_date, end_date, venue, max_participants, prize_pool, category) VALUES
  ('National Championship 2026', 'national', 'registration', '2026-05-15', '2026-05-18', 'Male'' Sports Complex', 32, 'MVR 5,000', 'Men''s & Women''s Singles'),
  ('Inter-Island Cup 2026', 'inter-island', 'upcoming', '2026-06-03', '2026-06-05', 'Addu Sports Facility', 64, 'MVR 3,000', 'Teams & Singles'),
  ('Juniors Open 2026', 'juniors', 'upcoming', '2026-07-10', '2026-07-10', 'Male'' Sports Complex', 16, 'Trophies', 'Singles U-18')
ON CONFLICT DO NOTHING;

-- ── Contact messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name      TEXT,
  email     TEXT,
  subject   TEXT,
  message   TEXT,
  read      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Storage bucket ────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-slips', 'payment-slips', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Members can upload slips" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can view slips" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-slips' AND (
    auth.uid() = (storage.foldername(name))[1]::UUID OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  )
);

-- ── Row Level Security ────────────────────────────────────────────
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages      ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Bookings
CREATE POLICY "Users read own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create bookings"   ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own"        ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage bookings"  ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Payments
CREATE POLICY "Users read own payments"   ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create payments"     ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage payments"    ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Invoices
CREATE POLICY "Users read own invoices"  ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage invoices"   ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Notifications
CREATE POLICY "Users read own notifs"    ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifs"  ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifs" ON notifications FOR INSERT WITH CHECK (true);

-- Public tables (read only)
CREATE POLICY "Tables public"         ON tables         FOR SELECT USING (true);
CREATE POLICY "Tournaments public"    ON tournaments    FOR SELECT USING (true);
CREATE POLICY "Results public"        ON international_results FOR SELECT USING (true);
CREATE POLICY "Exco public"           ON exco_members   FOR SELECT USING (true);

-- Tournament registrations
CREATE POLICY "Users register"        ON tournament_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own regs"    ON tournament_registrations FOR SELECT USING (auth.uid() = user_id);

-- Contact messages
CREATE POLICY "Anyone can submit"     ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read messages"  ON contact_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- ═══════════════════════════════════════════════════════════════
-- Create first admin user (run AFTER signing up with your email)
-- Replace 'your-email@example.com' with your actual email
-- ═══════════════════════════════════════════════════════════════
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
