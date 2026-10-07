-- Business profile for the staff console Settings page.
--
-- The console keeps its own toggles in system_settings, one row per switch, and
-- that table's value column is a boolean. It therefore has nowhere to keep the
-- business profile: name, address, contact details, express surcharge and the
-- loyalty settings. Until now the Settings page addressed a flat `settings`
-- table with one column per field, which was never created, so the page showed
-- built-in values and refused every save.
--
-- This table holds the profile as a single JSON row, written only by an admin
-- and readable by any authenticated staff member, matching the policy shape of
-- system_settings and security_config in migration 001.

create table if not exists public.business_settings (
  id smallint primary key default 1 check (id = 1),
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.business_settings is
  'Singleton row (id = 1) holding the staff console business profile as JSON.';

alter table public.business_settings enable row level security;

drop policy if exists "staff reads business settings" on public.business_settings;
drop policy if exists "admin manages business settings" on public.business_settings;

create policy "staff reads business settings"
  on public.business_settings for select to authenticated
  using (public.is_chapman_staff());

create policy "admin manages business settings"
  on public.business_settings for all to authenticated
  using (public.is_chapman_admin())
  with check (public.is_chapman_admin());

-- The row exists from the start, so the page only ever writes to it.
insert into public.business_settings (id, profile)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
