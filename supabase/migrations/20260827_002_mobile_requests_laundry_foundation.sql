-- Chapman Prestige mobile request intake, starting with Laundry.
-- This is additive: it does not alter existing clients, orders, or staff pages.

begin;

create table if not exists public.mobile_requests (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts(auth_user_id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  service_code text not null default 'laundry' check (service_code in ('laundry')),
  request_status text not null default 'pending' check (request_status in ('pending', 'under_review', 'needs_customer_confirmation', 'confirmed', 'declined', 'cancelled', 'converted')),
  requested_for date,
  confirmed_for date,
  pickup_area text,
  pickup_address text,
  pickup_window text,
  laundry_items jsonb not null default '[]'::jsonb,
  express boolean not null default false,
  estimated_total numeric(12,2) check (estimated_total is null or estimated_total >= 0),
  customer_note text,
  staff_note text,
  customer_response text check (customer_response in ('accepted', 'rejected')),
  customer_response_at timestamptz,
  reviewed_by uuid references public.staff(id) on delete set null,
  reviewed_at timestamptz,
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_requests_customer_account_idx on public.mobile_requests(customer_account_id);
create index if not exists mobile_requests_status_created_idx on public.mobile_requests(request_status, created_at desc);

create table if not exists public.mobile_request_events (
  id bigint generated always as identity primary key,
  mobile_request_id uuid not null references public.mobile_requests(id) on delete cascade,
  actor_type text not null check (actor_type in ('customer', 'staff', 'system')),
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists mobile_request_events_request_created_idx on public.mobile_request_events(mobile_request_id, created_at asc);

alter table public.mobile_requests enable row level security;
alter table public.mobile_request_events enable row level security;

drop policy if exists "staff reads mobile requests" on public.mobile_requests;
drop policy if exists "staff manages mobile requests" on public.mobile_requests;
drop policy if exists "customer reads own mobile requests" on public.mobile_requests;
drop policy if exists "staff reads mobile request events" on public.mobile_request_events;
drop policy if exists "customer reads own mobile request events" on public.mobile_request_events;

create policy "staff reads mobile requests"
  on public.mobile_requests for select to authenticated
  using (public.is_chapman_staff());

create policy "staff manages mobile requests"
  on public.mobile_requests for all to authenticated
  using (public.is_chapman_staff())
  with check (public.is_chapman_staff());

create policy "customer reads own mobile requests"
  on public.mobile_requests for select to authenticated
  using (customer_account_id = auth.uid());

create policy "staff reads mobile request events"
  on public.mobile_request_events for select to authenticated
  using (public.is_chapman_staff());

create policy "customer reads own mobile request events"
  on public.mobile_request_events for select to authenticated
  using (
    exists (
      select 1
      from public.mobile_requests mr
      where mr.id = mobile_request_events.mobile_request_id
        and mr.customer_account_id = auth.uid()
    )
  );

create or replace function public.review_mobile_request(
  p_request_id uuid,
  p_status text,
  p_confirmed_for date default null,
  p_staff_note text default null
)
returns public.mobile_requests
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_request public.mobile_requests;
  v_staff_id uuid := auth.uid();
begin
  if not public.is_chapman_staff() then
    raise exception 'A Chapman staff session is required';
  end if;

  if p_status not in ('under_review', 'needs_customer_confirmation', 'confirmed', 'declined') then
    raise exception 'Invalid mobile request status';
  end if;

  if p_status in ('needs_customer_confirmation', 'confirmed') and p_confirmed_for is null then
    raise exception 'A confirmed service date is required';
  end if;

  update public.mobile_requests
  set request_status = p_status,
      confirmed_for = case when p_confirmed_for is not null then p_confirmed_for else confirmed_for end,
      staff_note = nullif(trim(p_staff_note), ''),
      reviewed_by = v_staff_id,
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id
  returning * into v_request;

  if v_request.id is null then
    raise exception 'Mobile request not found';
  end if;

  insert into public.mobile_request_events (mobile_request_id, actor_type, event_type, note)
  values (v_request.id, 'staff', p_status, nullif(trim(p_staff_note), ''));

  return v_request;
end;
$$;

revoke all on function public.review_mobile_request(uuid, text, date, text) from public;
grant execute on function public.review_mobile_request(uuid, text, date, text) to authenticated, service_role;

insert into public.role_permissions (role, page, can_view, can_edit)
values
  ('admin', 'mobile-requests', true, true),
  ('manager', 'mobile-requests', true, true)
on conflict (role, page) do update
set can_view = excluded.can_view,
    can_edit = excluded.can_edit;

commit;
