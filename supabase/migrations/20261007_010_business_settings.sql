-- Business profile for the staff console Settings page.
--
-- The console keeps its own toggles in system_settings, one row per switch, and
-- that table's value column is a boolean. It therefore has nowhere to keep the
-- business profile: name, address, contact details, express surcharge and the
-- loyalty settings. Until now the Settings page addressed a flat `settings`
-- table with one column per field, which was never created, so the page showed
-- built-in values and refused every save.
--
-- This table holds the profile as a single JSON row. Everything below is
-- written to be safe to run twice, because it has to be applied by hand in the
-- Supabase SQL editor and the page offers the same statements.

create table if not exists public.business_settings (
  id smallint primary key default 1 check (id = 1),
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.business_settings is
  'Singleton row (id = 1) holding the staff console business profile as JSON.';

alter table public.business_settings enable row level security;

-- Table privileges. Row level security decides which rows a role may read or
-- write, but the role needs the table privilege first, or the database refuses
-- the request before any policy is consulted. A table created through raw SQL
-- does not necessarily inherit the privileges that Supabase's table tooling
-- hands to authenticated, which is exactly how this page came to be refused.
grant select, insert, update, delete on public.business_settings to authenticated;
grant all on public.business_settings to service_role;
revoke all on public.business_settings from anon;

drop policy if exists "staff reads business settings" on public.business_settings;
drop policy if exists "admin manages business settings" on public.business_settings;
drop policy if exists "staff with edit rights manage business settings" on public.business_settings;

create policy "staff reads business settings"
  on public.business_settings for select to authenticated
  using (public.is_chapman_staff());

-- Admins, and any role the console's own permission table lets edit Settings.
-- The database now enforces the same rule the page shows, so a role that the
-- System Admin screen grants edit rights to can actually save.
create policy "staff with edit rights manage business settings"
  on public.business_settings for all to authenticated
  using (
    public.is_chapman_admin()
    or exists (
      select 1
      from public.role_permissions p
      join public.staff s on s.id = auth.uid()
      where p.role = lower(coalesce(s.role, ''))
        and p.page = 'settings'
        and coalesce(p.can_edit, false)
    )
  )
  with check (
    public.is_chapman_admin()
    or exists (
      select 1
      from public.role_permissions p
      join public.staff s on s.id = auth.uid()
      where p.role = lower(coalesce(s.role, ''))
        and p.page = 'settings'
        and coalesce(p.can_edit, false)
    )
  );

-- The row exists from the start, so the page only ever writes to it.
insert into public.business_settings (id, profile)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
