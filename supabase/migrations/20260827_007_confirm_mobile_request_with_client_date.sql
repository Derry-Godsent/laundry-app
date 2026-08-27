-- A staff member may approve the client’s original requested date directly.
-- A different date remains a separate proposal that waits for client response.

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
  v_client_requested_for date;
begin
  if not public.is_chapman_staff() then
    raise exception 'A Chapman staff session is required';
  end if;

  if p_status not in ('under_review', 'needs_customer_confirmation', 'confirmed', 'declined') then
    raise exception 'Staff can review, propose a date, confirm the client date, or decline a mobile request';
  end if;

  select requested_for
  into v_client_requested_for
  from public.mobile_requests
  where id = p_request_id;

  if v_client_requested_for is null then
    raise exception 'Mobile request not found or does not include a client date';
  end if;

  if p_status = 'needs_customer_confirmation' and p_confirmed_for is null then
    raise exception 'A proposed service date is required';
  end if;

  update public.mobile_requests
  set request_status = p_status,
      confirmed_for = case
        when p_status = 'needs_customer_confirmation' then p_confirmed_for
        when p_status = 'confirmed' then v_client_requested_for
        else confirmed_for
      end,
      staff_note = nullif(trim(p_staff_note), ''),
      reviewed_by = v_staff_id,
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id
  returning * into v_request;

  insert into public.mobile_request_events (mobile_request_id, actor_type, event_type, note)
  values (
    v_request.id,
    'staff',
    p_status,
    case
      when p_status = 'confirmed' then coalesce(nullif(trim(p_staff_note), ''), 'Chapman approved the client’s requested service date')
      else nullif(trim(p_staff_note), '')
    end
  );

  return v_request;
end;
$$;

revoke all on function public.review_mobile_request(uuid, text, date, text) from public, anon;
grant execute on function public.review_mobile_request(uuid, text, date, text) to authenticated, service_role;

commit;
