-- ============================================================
-- TradeX — Part 3: Finance Tables (Deposits, Withdrawals, Settlement)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. DEPOSIT REQUESTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS deposit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('upi', 'neft', 'rtgs', 'imps', 'bank_transfer', 'wire', 'cash')),
  utr_number TEXT, -- Unique Transaction Reference
  bank_reference TEXT,
  proof_url TEXT, -- uploaded receipt
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'processing')),
  flag_reason TEXT,
  reject_reason TEXT,
  -- Processing
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES admin_users(id),
  rejected_at TIMESTAMPTZ,
  credited_to_wallet BOOLEAN DEFAULT false,
  -- Metadata
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 2. WITHDRAWAL REQUESTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('upi', 'neft', 'rtgs', 'imps', 'bank_transfer', 'wire')),
  -- Bank details
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'processing', 'completed', 'failed')),
  flag_reason TEXT,
  reject_reason TEXT,
  -- Friction engine delays
  hold_until TIMESTAMPTZ, -- withdrawal friction delay
  hold_reason TEXT,
  -- Processing
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES admin_users(id),
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transaction_reference TEXT,
  -- Balance snapshot at time of request
  balance_at_request NUMERIC(15,2),
  open_positions_count INT DEFAULT 0,
  -- Metadata
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 3. EOD SETTLEMENTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS eod_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_date DATE NOT NULL UNIQUE,
  -- Aggregates
  total_clients_settled INT DEFAULT 0,
  total_profit_credited NUMERIC(15,2) DEFAULT 0,
  total_losses_debited NUMERIC(15,2) DEFAULT 0,
  total_swap_charged NUMERIC(15,2) DEFAULT 0,
  total_house_pnl NUMERIC(15,2) DEFAULT 0,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  started_by UUID REFERENCES admin_users(id),
  -- Details stored as JSON for audit
  settlement_details JSONB DEFAULT '{}',
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 4. SYSTEM SETTINGS (Global config)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'trading', 'finance', 'risk', 'spread', 'fees', 'notifications')),
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 5. AUDIT LOG (Admin actions)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL, -- 'approve_deposit', 'force_square_off', 'change_tier', etc.
  target_type TEXT, -- 'user', 'order', 'position', 'withdrawal', 'system'
  target_id TEXT, -- ID of the affected record
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 6. MARGIN SETTINGS (Per-segment leverage rules)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS margin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment TEXT NOT NULL,
  name TEXT NOT NULL,
  leverage NUMERIC(6,2) DEFAULT 5,
  margin_required_pct NUMERIC(8,4) DEFAULT 20,
  warning_threshold NUMERIC(6,2) DEFAULT 80,
  margin_call_threshold NUMERIC(6,2) DEFAULT 85,
  auto_liquidation_threshold NUMERIC(6,2) DEFAULT 95,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 7. SPREAD PROFILES (Per-tier spread config)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS spread_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL,
  segment TEXT NOT NULL,
  base_spread_pct NUMERIC(8,4) DEFAULT 0.05,
  slippage_min_pct NUMERIC(8,4) DEFAULT 0,
  slippage_max_pct NUMERIC(8,4) DEFAULT 0.05,
  execution_delay_min_ms INT DEFAULT 0,
  execution_delay_max_ms INT DEFAULT 200,
  house_favor_pct NUMERIC(6,2) DEFAULT 70, -- % of time slippage favors house
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tier, segment)
);

-- ══════════════════════════════════════════════════════════════
-- 8. INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created ON deposit_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created ON withdrawal_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- RLS
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY deposits_select_own ON deposit_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY withdrawals_select_own ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER deposits_updated_at BEFORE UPDATE ON deposit_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER withdrawals_updated_at BEFORE UPDATE ON withdrawal_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER margin_settings_updated_at BEFORE UPDATE ON margin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER spread_profiles_updated_at BEFORE UPDATE ON spread_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
