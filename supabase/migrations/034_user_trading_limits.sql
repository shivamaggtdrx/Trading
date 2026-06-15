-- ============================================================
-- Migration 034: User Trading Limits
-- Per-user configurable trading limits enforced at risk layer.
-- Columns with NULL value = no limit applied (global default).
-- ============================================================

CREATE TABLE IF NOT EXISTS user_trading_limits (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Order frequency control
  daily_order_limit    INTEGER DEFAULT NULL CHECK (daily_order_limit IS NULL OR daily_order_limit > 0),

  -- Size controls
  max_position_size    INTEGER DEFAULT NULL CHECK (max_position_size IS NULL OR max_position_size > 0),
  max_open_positions   INTEGER DEFAULT NULL CHECK (max_open_positions IS NULL OR max_open_positions > 0),

  -- Administrative notes
  notes                TEXT,
  created_by           UUID,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- RLS
ALTER TABLE user_trading_limits ENABLE ROW LEVEL SECURITY;

-- Only service role (backend) can read/write
CREATE POLICY "service_role_full_access_trading_limits"
  ON user_trading_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_trading_limits_user_id
  ON user_trading_limits(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_trading_limits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_trading_limits_updated_at ON user_trading_limits;
CREATE TRIGGER set_user_trading_limits_updated_at
  BEFORE UPDATE ON user_trading_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_trading_limits_timestamp();

-- Also add is_bracket_order column to positions and orders tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_bracket_order BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(15,4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS take_profit NUMERIC(15,4);
ALTER TABLE positions ADD COLUMN IF NOT EXISTS is_bracket_order BOOLEAN DEFAULT FALSE;

