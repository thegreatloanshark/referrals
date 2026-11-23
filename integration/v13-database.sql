-- Run once if your database hasn't already received the V13 migration.
-- Applied to project evsmmzkgyuxajoqvdnnj on 2026-11-23.
alter table public.referral_leads
 add column if not exists duplicate_label text not null default 'New',
 add column if not exists original_lead_id uuid references public.referral_leads(id),
 add column if not exists referral_payout_generated text not null default 'Pending',
 add column if not exists first_file_amount numeric(15,2);
create index if not exists referral_leads_referred_mobile_idx on public.referral_leads ((form_answers->>'referredMobile'));
create index if not exists referral_leads_referred_email_idx on public.referral_leads (lower(form_answers->>'referredEmail'));
-- Constraint additions are already applied on the connected project.

-- Include new first-file and duplicate fields in the existing sync trigger versioning.
create or replace function public.referral_leads_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
 new.updated_at := now();
 if tg_op='UPDATE' and (
    new.form_answers is distinct from old.form_answers or
    new.stage_flags is distinct from old.stage_flags or
    new.sheet_extra is distinct from old.sheet_extra or
    new.first_file_amount is distinct from old.first_file_amount or
    new.duplicate_label is distinct from old.duplicate_label or
    new.referral_payout_generated is distinct from old.referral_payout_generated
 ) then new.sync_version := old.sync_version + 1;
 end if;
 return new;
end;
$$;
