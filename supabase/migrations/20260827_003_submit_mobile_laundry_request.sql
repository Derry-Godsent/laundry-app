-- Customer-created Laundry requests.
--
-- This procedure is intentionally the only customer write path for the
-- Mobile Requests queue. It derives ownership from auth.uid(), verifies the
-- linked customer account server-side, and calculates the fixed Laundry price
-- from the approved catalogue rather than trusting a value from the app.

begin;

create or replace function public.submit_mobile_laundry_request(
  p_requested_for date,
  p_pickup_area text,
  p_pickup_address text,
  p_pickup_window text,
  p_laundry_items jsonb,
  p_express boolean default false,
  p_customer_note text default null
)
returns public.mobile_requests
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_customer_account_id uuid := auth.uid();
  v_client_id uuid;
  v_item_count integer;
  v_laundry_items jsonb;
  v_garment_total numeric(12,2);
  v_estimated_total numeric(12,2);
  v_request public.mobile_requests;
begin
  if v_customer_account_id is null then
    raise exception 'Please sign in before sending a Laundry request';
  end if;

  select ca.client_id
  into v_client_id
  from public.customer_accounts ca
  where ca.auth_user_id = v_customer_account_id;

  if not found or v_client_id is null then
    raise exception 'Please complete your customer profile before sending a Laundry request';
  end if;

  if p_requested_for is null or p_requested_for < current_date then
    raise exception 'Choose today or a future pickup date';
  end if;

  if nullif(trim(p_pickup_area), '') is null or length(trim(p_pickup_area)) > 100 then
    raise exception 'Choose a valid pickup area';
  end if;

  if nullif(trim(p_pickup_address), '') is null or length(trim(p_pickup_address)) < 5 or length(trim(p_pickup_address)) > 300 then
    raise exception 'Enter a pickup address with at least 5 characters';
  end if;

  if p_pickup_window not in ('9:00–11:00', '11:00–13:00', '13:00–15:00', '15:00–17:00') then
    raise exception 'Choose a valid pickup window';
  end if;

  if p_laundry_items is null or jsonb_typeof(p_laundry_items) <> 'array' or jsonb_array_length(p_laundry_items) = 0 then
    raise exception 'Add at least one Laundry item';
  end if;

  if jsonb_array_length(p_laundry_items) > 30 then
    raise exception 'Too many Laundry item types were submitted';
  end if;

  with approved_prices(item_id, item_name, unit_price) as (
    values
      ('vest', 'Vest', 6::numeric),
      ('underwear', 'Underwear', 3::numeric),
      ('shorts', 'Shorts', 6::numeric),
      ('t-shirt', 'T-Shirt', 7::numeric),
      ('shirt', 'Shirt', 7::numeric),
      ('trousers', 'Trousers', 7::numeric),
      ('dress', 'Dress', 7::numeric),
      ('blouse-skirt', 'Blouse & Skirt', 11::numeric),
      ('suit-2', 'Suit 2-Piece', 17::numeric),
      ('national-costume', 'National Costume 2-Piece', 11::numeric),
      ('smock', 'Smock', 10::numeric),
      ('bedsheet', 'Bedsheet', 11::numeric),
      ('pillowcase', 'Pillowcase', 2::numeric),
      ('blanket', 'Blanket', 40::numeric),
      ('kente', 'Kente Cloth', 35::numeric)
  ), submitted_items as (
    select
      item->>'id' as item_id,
      case
        when coalesce(item->>'quantity', '') ~ '^[0-9]+$' then (item->>'quantity')::integer
        else null
      end as quantity
    from jsonb_array_elements(p_laundry_items) item
  ), priced_items as (
    select ap.item_id, ap.item_name, ap.unit_price, si.quantity
    from submitted_items si
    join approved_prices ap on ap.item_id = si.item_id
  )
  select
    coalesce(sum(quantity), 0),
    coalesce(sum(quantity * unit_price), 0),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', item_id,
          'name', item_name,
          'quantity', quantity,
          'unit_price', unit_price,
          'line_total', quantity * unit_price
        ) order by item_name
      ),
      '[]'::jsonb
    )
  into v_item_count, v_garment_total, v_laundry_items
  from priced_items;

  if v_item_count < 1 then
    raise exception 'Add a valid Laundry item from the catalogue';
  end if;

  if v_item_count > 150 then
    raise exception 'A Laundry request can include up to 150 items';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_laundry_items) item
    where not coalesce(item->>'quantity', '') ~ '^[0-9]+$'
       or (item->>'quantity')::integer < 1
       or (item->>'quantity')::integer > 150
       or not exists (
         select 1
         from (values
           ('vest'), ('underwear'), ('shorts'), ('t-shirt'), ('shirt'), ('trousers'),
           ('dress'), ('blouse-skirt'), ('suit-2'), ('national-costume'), ('smock'),
           ('bedsheet'), ('pillowcase'), ('blanket'), ('kente')
         ) as allowed(item_id)
         where allowed.item_id = item->>'id'
       )
  ) then
    raise exception 'One or more Laundry items are not valid';
  end if;

  v_estimated_total := v_garment_total + 20 + case when coalesce(p_express, false) then v_item_count * 10 else 0 end;

  if length(coalesce(trim(p_customer_note), '')) > 1000 then
    raise exception 'Your note is too long';
  end if;

  insert into public.mobile_requests (
    customer_account_id,
    client_id,
    service_code,
    request_status,
    requested_for,
    pickup_area,
    pickup_address,
    pickup_window,
    laundry_items,
    express,
    estimated_total,
    customer_note,
    updated_at
  )
  values (
    v_customer_account_id,
    v_client_id,
    'laundry',
    'pending',
    p_requested_for,
    trim(p_pickup_area),
    trim(p_pickup_address),
    p_pickup_window,
    v_laundry_items,
    coalesce(p_express, false),
    v_estimated_total,
    nullif(trim(p_customer_note), ''),
    now()
  )
  returning * into v_request;

  insert into public.mobile_request_events (mobile_request_id, actor_type, event_type, note)
  values (v_request.id, 'customer', 'submitted', 'Laundry pickup request received');

  return v_request;
end;
$$;

revoke all on function public.submit_mobile_laundry_request(date, text, text, text, jsonb, boolean, text) from public;
grant execute on function public.submit_mobile_laundry_request(date, text, text, text, jsonb, boolean, text) to authenticated, service_role;

commit;
