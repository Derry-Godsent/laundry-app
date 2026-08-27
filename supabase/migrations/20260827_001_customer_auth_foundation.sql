-- Chapman Prestige customer authentication foundation.
--
-- This migration is intentionally additive. It keeps the existing staff tables
-- and staff workflows, adds a customer-to-client link, and replaces only the
-- unsafe public database policies that would expose data to a customer app.
-- Apply first to a Supabase development branch. Do not apply to production
-- until the policy test plan in docs/customer-auth-rollout.md has passed.

begin;

create table if not exists public.customer_accounts (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid unique references public.clients(id) on delete set null,
  phone text not null unique,
  full_name text,
  email text,
  gender text check (gender in ('female', 'male', 'prefer_not_to_say')),
  avatar_style text check (avatar_style in ('female', 'male', 'neutral')),
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_accounts_client_id_idx
  on public.customer_accounts(client_id);

-- Normalise Ghana mobile values for matching only. Historic client phone
-- records are left unchanged, so this migration does not alter staff data.
create or replace function public.normalize_ghana_phone(p_phone text)
returns text
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  with phone_value as (
    select regexp_replace(coalesce(p_phone, ''), '[^0-9]+', '', 'g') as digits
  )
  select case
    when digits ~ '^0[0-9]{9}$' then '+233' || substring(digits from 2)
    when digits ~ '^233[0-9]{9}$' then '+' || digits
    when digits ~ '^[25][0-9]{8}$' then '+233' || digits
    else null
  end
  from phone_value;
$$;

create index if not exists clients_normalized_ghana_phone_idx
  on public.clients (public.normalize_ghana_phone(phone))
  where public.normalize_ghana_phone(phone) is not null;

create or replace function public.is_chapman_staff()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = auth.uid()
      and coalesce(s.is_banned, false) = false
  );
$$;

create or replace function public.is_chapman_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = auth.uid()
      and coalesce(s.is_banned, false) = false
      and lower(coalesce(s.role, '')) in ('admin', 'gm', 'manager')
  );
$$;

-- Creates or completes the authenticated customer's account after a verified
-- phone OTP. Client matching is done only by the server with the verified
-- Auth phone number; the app cannot choose another customer's client_id.
create or replace function public.complete_customer_onboarding(
  p_full_name text,
  p_gender text default 'prefer_not_to_say',
  p_email text default null
)
returns public.customer_accounts
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_phone text;
  v_client_id uuid;
  v_account public.customer_accounts;
begin
  if v_auth_user_id is null then
    raise exception 'An authenticated customer session is required';
  end if;

  select u.phone
  into v_phone
  from auth.users u
  where u.id = v_auth_user_id;

  v_phone := public.normalize_ghana_phone(v_phone);

  if v_phone is null then
    raise exception 'A verified phone number is required';
  end if;

  if nullif(trim(p_full_name), '') is null then
    raise exception 'Full name is required';
  end if;

  if p_gender not in ('female', 'male', 'prefer_not_to_say') then
    raise exception 'Invalid gender value';
  end if;

  -- Prefer an existing client record with the same verified phone. This does
  -- not modify its commercial fields, history, tier, or totals.
  select c.id
  into v_client_id
  from public.clients c
  where public.normalize_ghana_phone(c.phone) = v_phone
  order by c.created_at asc nulls last
  limit 1;

  if v_client_id is null then
    insert into public.clients (name, full_name, phone, type, tier, active)
    values (
      trim(p_full_name),
      trim(p_full_name),
      v_phone,
      'Individual',
      'Standard',
      true
    )
    returning id into v_client_id;
  end if;

  insert into public.customer_accounts (
    auth_user_id,
    client_id,
    phone,
    full_name,
    email,
    gender,
    avatar_style,
    profile_completed_at,
    updated_at
  )
  values (
    v_auth_user_id,
    v_client_id,
    v_phone,
    trim(p_full_name),
    nullif(trim(p_email), ''),
    p_gender,
    case
      when p_gender = 'female' then 'female'
      when p_gender = 'male' then 'male'
      else 'neutral'
    end,
    now(),
    now()
  )
  on conflict (auth_user_id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      gender = excluded.gender,
      avatar_style = excluded.avatar_style,
      profile_completed_at = coalesce(customer_accounts.profile_completed_at, now()),
      updated_at = now()
  returning * into v_account;

  return v_account;
end;
$$;

revoke all on function public.is_chapman_staff() from public;
revoke all on function public.is_chapman_admin() from public;
revoke all on function public.complete_customer_onboarding(text, text, text) from public;
revoke all on function public.normalize_ghana_phone(text) from public;
grant execute on function public.is_chapman_staff() to authenticated, service_role;
grant execute on function public.is_chapman_admin() to authenticated, service_role;
grant execute on function public.complete_customer_onboarding(text, text, text) to authenticated, service_role;

-- These legacy security-definer functions are not called by the staff client.
-- Keep any trigger use intact, but prevent callers from invoking them directly.
alter function public.handle_new_user_role() set search_path = pg_catalog, public;
alter function public.log_security_change() set search_path = pg_catalog, public;
revoke all on function public.handle_new_user_role() from public, anon, authenticated;
revoke all on function public.log_security_change() from public, anon, authenticated;
grant execute on function public.handle_new_user_role() to service_role;
grant execute on function public.log_security_change() to service_role;

alter table public.customer_accounts enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.security_config enable row level security;
alter table public.system_settings enable row level security;
alter table public.branches enable row level security;

-- Remove known permissive policies before replacing them with scoped policies.
drop policy if exists "Allow all" on public.clients;
drop policy if exists "Clients: Public can delete" on public.clients;
drop policy if exists "Clients: Public can insert" on public.clients;
drop policy if exists "Clients: Public can read" on public.clients;
drop policy if exists "Clients: Public can update" on public.clients;
drop policy if exists "Allow all" on public.orders;
drop policy if exists "Allow all" on public.order_items;
drop policy if exists "Allow all" on public.services;
drop policy if exists "Allow all access to role_permissions" on public.role_permissions;
drop policy if exists "Allow all access to audit_logs" on public.audit_logs;
drop policy if exists "Allow all access to settings" on public.system_settings;
drop policy if exists "Staff can create staff records" on public.staff;
drop policy if exists "Staff can delete staff records" on public.staff;
drop policy if exists "Staff can update staff records" on public.staff;
drop policy if exists "Staff can view staff records" on public.staff;
drop policy if exists "Admins can read audit logs" on public.audit_logs;
drop policy if exists "Admins can update security config" on public.security_config;
drop policy if exists "Staff can read security config" on public.security_config;
drop policy if exists "Staff can view active branches" on public.branches;
drop policy if exists "User roles: Admins can manage all" on public.user_roles;
drop policy if exists "User roles: Users can read own role" on public.user_roles;

-- Customer accounts: customers can only read their own link. Profile changes
-- are intentionally routed through complete_customer_onboarding.
create policy "customer reads own account"
  on public.customer_accounts for select to authenticated
  using (auth_user_id = auth.uid());

create policy "staff manages customer accounts"
  on public.customer_accounts for all to authenticated
  using (public.is_chapman_staff())
  with check (public.is_chapman_staff());

-- Preserve current staff operational behaviour while allowing a customer to
-- see only their own client profile and completed orders.
create policy "staff manages clients"
  on public.clients for all to authenticated
  using (public.is_chapman_staff())
  with check (public.is_chapman_staff());

create policy "customer reads linked client"
  on public.clients for select to authenticated
  using (
    id = (
      select ca.client_id
      from public.customer_accounts ca
      where ca.auth_user_id = auth.uid()
    )
  );

create policy "staff manages orders"
  on public.orders for all to authenticated
  using (public.is_chapman_staff())
  with check (public.is_chapman_staff());

create policy "customer reads own orders"
  on public.orders for select to authenticated
  using (
    client_id = (
      select ca.client_id
      from public.customer_accounts ca
      where ca.auth_user_id = auth.uid()
    )
  );

create policy "staff manages order items"
  on public.order_items for all to authenticated
  using (public.is_chapman_staff())
  with check (public.is_chapman_staff());

create policy "customer reads own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      join public.customer_accounts ca on ca.client_id = o.client_id
      where o.id = order_items.order_id
        and ca.auth_user_id = auth.uid()
    )
  );

-- Customers can discover services but cannot alter pricing or service setup.
create policy "signed in users read services"
  on public.services for select to authenticated
  using (true);

create policy "staff manages services"
  on public.services for all to authenticated
  using (public.is_chapman_staff())
  with check (public.is_chapman_staff());

create policy "staff reads staff directory"
  on public.staff for select to authenticated
  using (public.is_chapman_staff());

create policy "admin manages staff directory"
  on public.staff for all to authenticated
  using (public.is_chapman_admin())
  with check (public.is_chapman_admin());

create policy "staff reads role permissions"
  on public.role_permissions for select to authenticated
  using (public.is_chapman_staff());

create policy "admin manages role permissions"
  on public.role_permissions for all to authenticated
  using (public.is_chapman_admin())
  with check (public.is_chapman_admin());

create policy "staff reads own role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "admin manages user roles"
  on public.user_roles for all to authenticated
  using (public.is_chapman_admin())
  with check (public.is_chapman_admin());

create policy "admin reads audit logs"
  on public.audit_logs for select to authenticated
  using (public.is_chapman_admin());

create policy "staff reads branches"
  on public.branches for select to authenticated
  using (public.is_chapman_staff());

create policy "admin manages branches"
  on public.branches for all to authenticated
  using (public.is_chapman_admin())
  with check (public.is_chapman_admin());

create policy "staff reads system settings"
  on public.system_settings for select to authenticated
  using (public.is_chapman_staff());

create policy "admin manages system settings"
  on public.system_settings for all to authenticated
  using (public.is_chapman_admin())
  with check (public.is_chapman_admin());

create policy "staff reads security configuration"
  on public.security_config for select to authenticated
  using (public.is_chapman_staff());

create policy "admin manages security configuration"
  on public.security_config for all to authenticated
  using (public.is_chapman_admin())
  with check (public.is_chapman_admin());

commit;
