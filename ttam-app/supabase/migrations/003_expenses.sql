-- ═══════════════════════════════════════════════════════════════
-- TTAM – Expense Management Migration
-- ═══════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS expense_seq START 1;

CREATE TABLE IF NOT EXISTS expenses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_ref     TEXT UNIQUE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN (
                    'equipment','venue','events','travel','administrative','training','other'
                  )),
  amount          NUMERIC NOT NULL CHECK (amount > 0),
  description     TEXT,
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','reimbursed')),
  admin_notes     TEXT,
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-assign expense_ref
CREATE OR REPLACE FUNCTION assign_expense_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expense_ref IS NULL THEN
    NEW.expense_ref := 'EXP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('expense_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_expense_insert
BEFORE INSERT ON expenses
FOR EACH ROW EXECUTE FUNCTION assign_expense_ref();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_expense_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_expense_update
BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_expense_timestamp();

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Members can view their own expenses
CREATE POLICY "members_view_own_expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all expenses
CREATE POLICY "admins_view_all_expenses" ON expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Members can insert their own expenses
CREATE POLICY "members_insert_own_expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Members can update their own pending expenses
CREATE POLICY "members_update_own_pending" ON expenses
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can update any expense (for approve/reject)
CREATE POLICY "admins_update_any_expense" ON expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

-- Storage bucket for receipts (run separately in dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('expense-receipts', 'expense-receipts', false) ON CONFLICT DO NOTHING;
