-- Supabase projects can retain a direct anon execute grant from earlier
-- defaults. Remove it explicitly so only an authenticated customer or the
-- service role can call the Laundry submission procedure.

begin;

revoke all on function public.submit_mobile_laundry_request(date, text, text, text, jsonb, boolean, text) from public, anon;
grant execute on function public.submit_mobile_laundry_request(date, text, text, text, jsonb, boolean, text) to authenticated, service_role;

commit;
