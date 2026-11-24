-- Run in Supabase SQL editor after backing up; does not alter Google Sheets.
ALTER TABLE public.referral_leads ADD COLUMN IF NOT EXISTS referral_payout_generated_at timestamptz;
-- Preserve first successful referral payout timestamp even if status changes later.
CREATE OR REPLACE FUNCTION public.referral_leads_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 NEW.updated_at := now();
 IF tg_op='UPDATE' AND (
  new.form_answers IS DISTINCT FROM old.form_answers OR
  new.stage_flags IS DISTINCT FROM old.stage_flags OR
  new.sheet_extra IS DISTINCT FROM old.sheet_extra OR
  new.first_file_amount IS DISTINCT FROM old.first_file_amount OR
  new.duplicate_label IS DISTINCT FROM old.duplicate_label OR
  new.referral_payout_generated IS DISTINCT FROM old.referral_payout_generated OR
  new.referral_payout_generated_at IS DISTINCT FROM old.referral_payout_generated_at OR
  new.referrer_dsa_code IS DISTINCT FROM old.referrer_dsa_code
 ) THEN NEW.sync_version := old.sync_version + 1; END IF;
 RETURN NEW;
END;
$$;
