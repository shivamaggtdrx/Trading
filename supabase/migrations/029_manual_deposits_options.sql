-- Migration: 029_manual_deposits_options
-- Description: Create payment_methods table and update deposit_requests for manual uploads

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot INTEGER NOT NULL UNIQUE CHECK (slot IN (1, 2, 3)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  upi_id TEXT,
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  qr_code_url TEXT,
  instructions TEXT DEFAULT 'Transfer the amount to the details below, copy the UTR, upload screenshot and click Submit.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default methods for the three slots
INSERT INTO public.payment_methods (slot, upi_id, bank_name, account_name, account_number, ifsc_code, is_active)
VALUES 
  (1, 'upi1@bank', 'HDFC Bank', 'Trading Company Ltd', '1234567890', 'HDFC0001234', true),
  (2, 'upi2@bank', 'ICICI Bank', 'Trading Company Ltd', '0987654321', 'ICIC0005678', true),
  (3, 'upi3@bank', 'SBI Bank', 'Trading Company Ltd', '1122334455', 'SBIN0009999', true)
ON CONFLICT (slot) DO NOTHING;

-- Drop method check constraint on deposit_requests so it can take custom option method names or slots
ALTER TABLE public.deposit_requests 
  DROP CONSTRAINT IF EXISTS deposit_requests_method_check;

-- Add payment_method_slot column to deposit_requests to track which slot was used
ALTER TABLE public.deposit_requests
  ADD COLUMN IF NOT EXISTS payment_method_slot INTEGER CHECK (payment_method_slot IN (1, 2, 3));

-- Enable Row Level Security (RLS) on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active payment methods
CREATE POLICY select_payment_methods ON public.payment_methods
  FOR SELECT TO authenticated USING (true);
