-- ============================================================
-- TradeX Dabba Trading Platform
-- Migration: 020_user_watchlists
-- Purpose: Move watchlists from localStorage to DB for cross-device sync
-- ============================================================

CREATE TABLE IF NOT EXISTS user_watchlists (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{"active": "MW-1", "lists": {"MW-1": [], "MW-2": [], "MW-3": [], "MW-4": [], "MW-5": []}}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);

-- RLS
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watchlists" 
    ON user_watchlists 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER user_watchlists_updated_at 
    BEFORE UPDATE ON user_watchlists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

-- Backfill trigger for new users
CREATE OR REPLACE FUNCTION create_watchlist_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_watchlists (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_watchlist
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_watchlist_for_new_user();

-- Backfill existing users
INSERT INTO user_watchlists (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;
