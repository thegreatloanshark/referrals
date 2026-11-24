-- V14 manual migration; run in Supabase SQL editor after a database backup.
-- Preserve existing dsa_code as canonical VH attribution; do not rename or drop it.
ALTER TABLE public.referral_leads
  ADD COLUMN IF NOT EXISTS referrer_dsa_code text;
-- Existing leads may not have a referrer code; do not fabricate historical values.
CREATE INDEX IF NOT EXISTS referral_leads_referrer_dsa_code_idx
  ON public.referral_leads(referrer_dsa_code);
UPDATE public.referral_leads
SET referrer_dsa_code = NULLIF(btrim(form_answers->>'referrerDsaCode'), '')
WHERE referrer_dsa_code IS NULL
  AND form_answers ? 'referrerDsaCode';
-- Ensure code edits are exported to the sheet through existing version-based sync jobs.
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
  new.referrer_dsa_code IS DISTINCT FROM old.referrer_dsa_code
 ) THEN new.sync_version := old.sync_version + 1;
 END IF;
 RETURN new;
END;
$$;
