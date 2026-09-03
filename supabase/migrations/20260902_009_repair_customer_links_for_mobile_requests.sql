begin;

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

  select u.phone into v_phone
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

  select c.id into v_client_id
  from public.clients c
  where public.normalize_ghana_phone(c.phone) = v_phone
  order by c.created_at asc nulls last
  limit 1;

  if v_client_id is null then
    insert into public.clients (name, full_name, phone, type, tier, active)
    values (trim(p_full_name), trim(p_full_name), v_phone, 'Individual', 'Standard', true)
    returning id into v_client_id;
  end if;

  insert into public.customer_accounts (
    auth_user_id, client_id, phone, full_name, email, gender, avatar_style,
    profile_completed_at, updated_at
  )
  values (
    v_auth_user_id, v_client_id, v_phone, trim(p_full_name),
    nullif(trim(p_email), ''), p_gender,
    case when p_gender = 'female' then 'female' when p_gender = 'male' then 'male' else 'neutral' end,
    now(), now()
  )
  on conflict (auth_user_id) do update
  set client_id = coalesce(customer_accounts.client_id, excluded.client_id),
      phone = coalesce(customer_accounts.phone, excluded.phone),
      full_name = excluded.full_name,
      email = excluded.email,
      gender = excluded.gender,
      avatar_style = excluded.avatar_style,
      profile_completed_at = coalesce(customer_accounts.profile_completed_at, now()),
      updated_at = now()
  returning * into v_account;

  return v_account;
end;
$$;

revoke all on function public.complete_customer_onboarding(text, text, text) from public;
grant execute on function public.complete_customer_onboarding(text, text, text) to authenticated;

commit;
