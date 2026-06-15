-- Migration: 032_fix_positions_quantity_check
-- Description: Updates the quantity check constraint on positions table to allow 0 quantity for closed positions.

ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_quantity_check;
ALTER TABLE public.positions ADD CONSTRAINT positions_quantity_check CHECK (quantity >= 0);
