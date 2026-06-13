-- Migration: 026_manual_kyc
-- Description: Drop profiles_kyc_status_check constraint, modify check to include 'not_submitted', make default 'not_submitted', and update existing pending profiles

-- 1. Drop the check constraint on profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_kyc_status_check;

-- 2. Add updated check constraint allowing 'not_submitted'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_kyc_status_check 
  CHECK (kyc_status IN ('not_submitted', 'pending', 'submitted', 'verified', 'rejected'));

-- 3. Change default of profiles.kyc_status to 'not_submitted'
ALTER TABLE public.profiles ALTER COLUMN kyc_status SET DEFAULT 'not_submitted';

-- 4. Update existing profiles that are currently 'pending' to 'not_submitted' (since no documents exist)
UPDATE public.profiles p
SET kyc_status = 'not_submitted'
WHERE kyc_status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.kyc_documents d WHERE d.user_id = p.id
  );
