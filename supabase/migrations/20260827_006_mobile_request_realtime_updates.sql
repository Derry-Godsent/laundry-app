-- Enable real-time delivery for the customer-owned request and activity rows.
-- Existing row-level policies continue to determine which records each session
-- can receive; this migration adds no new table read or write permissions.

begin;

alter publication supabase_realtime add table public.mobile_requests;
alter publication supabase_realtime add table public.mobile_request_events;

commit;
