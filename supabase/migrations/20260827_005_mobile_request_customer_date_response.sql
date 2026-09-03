-- Customer confirmation for a staff-proposed Laundry date.
--
-- The customer can respond only to their own request while it is waiting for a
-- response. A staff member must propose a date first; staff cannot directly
-- move a mobile request to confirmed status.

begin;

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

  if p_status not in ('under_review', 'needs_customer_confirmation', 'declined') then
    raise exception 'Staff can review, propose a date, or decline a mobile request';
  end if;

  if p_status = 'needs_customer_confirmation' and p_confirmed_for is null then
    raise exception 'A proposed service date is required';
  end if;

  update public.mobile_requests
  set request_status = p_status,
      confirmed_for = case when p_status = 'needs_customer_confirmation' then p_confirmed_for else confirmed_for end,
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

create or replace function public.respond_to_mobile_request_date(
  p_request_id uuid,
  p_response text
)
returns public.mobile_requests
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_customer_account_id uuid := auth.uid();
  v_request public.mobile_requests;
begin
  if v_customer_account_id is null then
    raise exception 'Please sign in before responding to this request';
  end if;

  if p_response not in ('accepted', 'rejected') then
    raise exception 'Choose whether to accept or reject the proposed date';
  end if;

  select *
  into v_request
  from public.mobile_requests
  where id = p_request_id
    and customer_account_id = v_customer_account_id
  for update;

  if not found then
    raise exception 'This request does not belong to your account';
  end if;

  if v_request.request_status <> 'needs_customer_confirmation' or v_request.confirmed_for is null then
    raise exception 'There is no proposed date waiting for your response';
  end if;

  update public.mobile_requests
  set request_status = case when p_response = 'accepted' then 'confirmed' else 'under_review' end,
      customer_response = p_response,
      customer_response_at = now(),
      confirmed_for = case when p_response = 'accepted' then confirmed_for else null end,
      updated_at = now()
  where id = v_request.id
  returning * into v_request;

  insert into public.mobile_request_events (mobile_request_id, actor_type, event_type, note)
  values (
    v_request.id,
    'customer',
    case when p_response = 'accepted' then 'date_accepted' else 'date_rejected' end,
    case when p_response = 'accepted' then 'Customer accepted the proposed service date' else 'Customer requested another service date' end
  );

  return v_request;
end;
$$;

revoke all on function public.review_mobile_request(uuid, text, date, text) from public, anon;
revoke all on function public.respond_to_mobile_request_date(uuid, text) from public, anon;
grant execute on function public.review_mobile_request(uuid, text, date, text) to authenticated, service_role;
grant execute on function public.respond_to_mobile_request_date(uuid, text) to authenticated, service_role;

commit;
