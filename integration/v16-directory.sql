-- Additive migration: existing table/lead data preserved. Only service_role can execute.
create or replace function public.referral_replace_vh_directory(snapshot jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
 if jsonb_typeof(snapshot) is distinct from 'array' then raise exception 'Expected directory array'; end if;
 n := jsonb_array_length(snapshot);
 if n < 1 or n > 500 then raise exception 'Invalid snapshot size'; end if;
 lock table public.referral_vh_access in share row exclusive mode;
 -- Clear links before upserts so swaps cannot violate the Clerk unique constraint.
 update public.referral_vh_access set clerk_user_id=null;
 insert into public.referral_vh_access(dsa_code,registered_email,vh_name,mobile,access_role,clerk_user_id,live_status,qr_slug,directory_synced_at)
 select r.dsa_code,r.registered_email,r.vh_name,r.mobile,r.access_role,r.clerk_user_id,r.live_status,r.qr_slug,now()
 from jsonb_to_recordset(snapshot) as r(dsa_code text,registered_email text,vh_name text,mobile text,access_role text,clerk_user_id text,live_status text,qr_slug text)
 on conflict(dsa_code) do update set registered_email=excluded.registered_email,vh_name=excluded.vh_name,mobile=excluded.mobile,access_role=excluded.access_role,clerk_user_id=excluded.clerk_user_id,live_status=excluded.live_status,qr_slug=excluded.qr_slug,directory_synced_at=excluded.directory_synced_at;
 -- Removed entries remain as inactive tombstones for historical ownership.
 update public.referral_vh_access v set access_role=null,live_status='Inactive',clerk_user_id=null,directory_synced_at=now()
 where not exists(select 1 from jsonb_to_recordset(snapshot) as r(dsa_code text) where r.dsa_code=v.dsa_code);
 return jsonb_build_object('synced',n);
end;
$$;
revoke all on function public.referral_replace_vh_directory(jsonb) from public,anon,authenticated;
grant execute on function public.referral_replace_vh_directory(jsonb) to service_role;
