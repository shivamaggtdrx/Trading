-- ============================================================
-- TradeX — Part 2: Trading Tables (Orders, Positions, Trades)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. ORDERS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  symbol TEXT NOT NULL,
  -- Order details
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop_loss', 'stop_limit')),
  quantity NUMERIC(15,4) NOT NULL CHECK (quantity > 0),
  price NUMERIC(15,4), -- for limit orders
  trigger_price NUMERIC(15,4), -- for stop loss
  -- Execution
  filled_quantity NUMERIC(15,4) DEFAULT 0,
  avg_fill_price NUMERIC(15,4),
  -- Slippage applied (house edge)
  requested_price NUMERIC(15,4),
  executed_price NUMERIC(15,4),
  slippage_amount NUMERIC(15,4) DEFAULT 0,
  spread_markup NUMERIC(15,4) DEFAULT 0,
  execution_delay_ms INT DEFAULT 0,
  -- Margin
  margin_required NUMERIC(15,2) DEFAULT 0,
  margin_blocked NUMERIC(15,2) DEFAULT 0,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired')),
  reject_reason TEXT,
  cancel_reason TEXT,
  -- Timestamps
  placed_at TIMESTAMPTZ DEFAULT now(),
  filled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 2. POSITIONS (Open positions)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  symbol TEXT NOT NULL,
  order_id UUID REFERENCES orders(id), -- opening order
  -- Position details
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  quantity NUMERIC(15,4) NOT NULL CHECK (quantity > 0),
  entry_price NUMERIC(15,4) NOT NULL,
  current_price NUMERIC(15,4) DEFAULT 0,
  -- P&L
  unrealized_pnl NUMERIC(15,2) DEFAULT 0,
  realized_pnl NUMERIC(15,2) DEFAULT 0,
  -- Margin
  margin_used NUMERIC(15,2) DEFAULT 0,
  leverage NUMERIC(6,2) DEFAULT 1,
  margin_pct NUMERIC(8,4) DEFAULT 0, -- margin utilization %
  -- Stop loss / Take profit
  stop_loss NUMERIC(15,4),
  take_profit NUMERIC(15,4),
  trailing_stop NUMERIC(15,4),
  -- Swap fees accumulated
  total_swap_fees NUMERIC(15,2) DEFAULT 0,
  last_swap_charged_at TIMESTAMPTZ,
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed', 'liquidated')),
  close_reason TEXT, -- 'manual', 'stop_loss', 'take_profit', 'margin_call', 'admin_force', 'eod_settlement', 'profit_ceiling'
  closed_at TIMESTAMPTZ,
  -- B-Book routing
  routing TEXT DEFAULT 'b_book' CHECK (routing IN ('b_book', 'a_book')),
  -- Timestamps
  opened_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 3. TRADES (Closed / completed trade records)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  position_id UUID REFERENCES positions(id),
  symbol TEXT NOT NULL,
  -- Trade details
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC(15,4) NOT NULL,
  entry_price NUMERIC(15,4) NOT NULL,
  exit_price NUMERIC(15,4) NOT NULL,
  -- P&L
  gross_pnl NUMERIC(15,2) NOT NULL,
  charges NUMERIC(15,2) DEFAULT 0, -- spread + slippage + swap
  net_pnl NUMERIC(15,2) NOT NULL,
  -- Revenue breakdown (what house earned)
  spread_revenue NUMERIC(15,2) DEFAULT 0,
  slippage_revenue NUMERIC(15,2) DEFAULT 0,
  swap_revenue NUMERIC(15,2) DEFAULT 0,
  -- Routing
  routing TEXT DEFAULT 'b_book',
  -- Settlement
  settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'settled', 'disputed')),
  settled_at TIMESTAMPTZ,
  -- Timestamps
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 4. INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_placed ON orders(placed_at DESC);

CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_routing ON positions(routing);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_closed ON trades(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_settlement ON trades(settlement_status);

-- ══════════════════════════════════════════════════════════════
-- 5. RLS
-- ══════════════════════════════════════════════════════════════
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY positions_select_own ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY trades_select_own ON trades FOR SELECT USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
