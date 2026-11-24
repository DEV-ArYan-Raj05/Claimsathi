-- ClaimSathi: user profiles for Supabase Auth (PRD §3.7, §6.1; rules.md §8, §10).
-- One row per auth user, created by a trigger on sign-up (email/password, Google or phone).
-- Row-level security: a signed-in user can read, edit and delete only their own row.
-- Trusted columns (email, phone, providers, WhatsApp verification) are never writable from the
-- browser: column grants block them, and they change only through the SECURITY DEFINER functions
-- below, which read auth.users rather than anything the user typed.
-- Safe to re-run: no data is dropped.

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  email text,
  avatar_url text,
  phone text,
  auth_providers text[] not null default '{}',
  language text not null default 'en' check (language in ('en', 'hi')),
  state text not null default '' check (char_length(state) <= 60),
  district text not null default '' check (char_length(district) <= 60),
  last_track text not null default 'health' check (last_track in ('health', 'crop')),
  tracks text[] not null default '{health,crop}'
    check (cardinality(tracks) >= 1 and tracks <@ array['health', 'crop']::text[]),
  call_consent boolean not null default false,
  is_onboarded boolean not null default false,
  whatsapp_phone text,
  whatsapp_verified_at timestamptz,
  whatsapp_opt_in boolean not null default false,
  whatsapp_opt_in_at timestamptz,
  whatsapp_lang text check (whatsapp_lang in ('en', 'hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- PRD §3.7: WhatsApp updates only after the number is verified.
  constraint profiles_opt_in_needs_verified
    check (not whatsapp_opt_in or whatsapp_verified_at is not null)
);

comment on table public.profiles is
  'One row per auth user (PRD §6.1). RLS: own row only. Owner feature: profile.';

-- ---------------------------------------------------------------------------------------------
-- Create / sync the row from auth.users (trusted source).
-- ---------------------------------------------------------------------------------------------

create or replace function private.providers_of(app_meta jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(app_meta -> 'providers') = 'array'
      then array(select jsonb_array_elements_text(app_meta -> 'providers'))
    else '{}'::text[]
  end;
$$;

create or replace function private.create_profile_for(uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url, phone, auth_providers)
  select
    u.id,
    u.email,
    left(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), 80),
    u.raw_user_meta_data ->> 'avatar_url',
    u.phone,
    private.providers_of(u.raw_app_meta_data)
  from auth.users u
  where u.id = uid
  on conflict (id) do nothing;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.create_profile_for(new.id);
  return new;
end;
$$;

create or replace function private.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set email = new.email,
         phone = new.phone,
         auth_providers = private.providers_of(new.raw_app_meta_data)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, phone, raw_app_meta_data on auth.users
  for each row execute function private.handle_user_updated();

-- updated_at, and when the WhatsApp opt-in was given (PRD §3.8: recorded opt-in).
create or replace function private.profiles_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.whatsapp_opt_in and not old.whatsapp_opt_in then
    new.whatsapp_opt_in_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function private.profiles_touch();

-- Accounts that signed up before this migration.
insert into public.profiles (id)
select u.id from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
update public.profiles p
   set email = u.email,
       phone = u.phone,
       name = case when p.name = '' then left(btrim(coalesce(
         u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), 80)
         else p.name end,
       auth_providers = private.providers_of(u.raw_app_meta_data)
  from auth.users u
 where u.id = p.id and p.email is distinct from u.email;

-- ---------------------------------------------------------------------------------------------
-- Row-level security and privileges.
-- ---------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Supabase grants everything on new public tables to anon/authenticated by default: undo that,
-- then grant only what the app needs. anon gets nothing. service_role (backend) bypasses RLS.
revoke all on table public.profiles from anon, authenticated;
grant select, delete on table public.profiles to authenticated;
grant update (
  name, language, state, district, last_track, tracks,
  call_consent, is_onboarded, whatsapp_opt_in, whatsapp_lang
) on table public.profiles to authenticated;
-- No INSERT grant: rows are created by the trigger or ensure_my_profile().

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------------------------
-- RPCs the browser may call (each acts only on auth.uid()).
-- ---------------------------------------------------------------------------------------------

-- Recreate the caller's row if it's missing (e.g. after "Delete my data").
create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  result public.profiles;
begin
  if uid is null then
    raise exception 'Sign in to continue' using errcode = '28000';
  end if;
  perform private.create_profile_for(uid);
  select * into result from public.profiles where id = uid;
  return result;
end;
$$;

-- Mark the WhatsApp number verified, but only if Supabase Auth has confirmed that exact number on
-- the caller's own account (after verifyOtp type 'phone_change'). PRD §3.7 "known issue" guard.
-- TODO(PRD §3.7): clearing stale phone_change values on other accounts needs the backend
-- (service role, /api/v1/me/whatsapp/confirm).
create or replace function public.confirm_my_whatsapp(p_phone text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  confirmed_phone text;
  result public.profiles;
begin
  if uid is null then
    raise exception 'Sign in to continue' using errcode = '28000';
  end if;
  select u.phone into confirmed_phone
    from auth.users u
   where u.id = uid and u.phone_confirmed_at is not null;
  -- Supabase phone numbers use international format (typically +countrycode...).
  -- Normalize both values before comparing so the '+' does not cause a false mismatch.
  if confirmed_phone is null
     or regexp_replace(confirmed_phone, '\D', '', 'g')
        <> regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') then
    raise exception 'This number is not verified on your account' using errcode = '42501';
  end if;
  update public.profiles
     set whatsapp_phone = '+' || regexp_replace(confirmed_phone, '\D', '', 'g'),
         whatsapp_verified_at = now()
   where id = uid
  returning * into result;
  return result;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
revoke all on function public.confirm_my_whatsapp(text) from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;
grant execute on function public.confirm_my_whatsapp(text) to authenticated;

revoke all on all functions in schema private from public, anon, authenticated;
