-- Migration: 027_speed_up_indexes
-- Description: Create composite indexes for pagination and filters on trades and orders

-- 1. Create composite index on trades for paginated history queries
CREATE INDEX IF NOT EXISTS idx_trades_user_closed ON public.trades (user_id, closed_at DESC);

-- 2. Create composite index on orders for status filtering queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders (user_id, status);
