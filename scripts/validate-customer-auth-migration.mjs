import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  "supabase/migrations/20260827_001_customer_auth_foundation.sql",
);
const sql = readFileSync(migrationPath, "utf8");

const expected = [
  "create table if not exists public.customer_accounts",
  "create or replace function public.normalize_ghana_phone",
  "clients_normalized_ghana_phone_idx",
  "create or replace function public.complete_customer_onboarding",
  "alter table public.clients enable row level security",
  "drop policy if exists \"Allow all\" on public.clients",
  "drop policy if exists \"Allow all access to audit_logs\" on public.audit_logs",
  "revoke all on function public.handle_new_user_role() from public, anon, authenticated",
  "revoke all on function public.log_security_change() from public, anon, authenticated",
  "create policy \"customer reads linked client\"",
  "create policy \"customer reads own orders\"",
  "create policy \"staff manages orders\"",
  "commit;",
];

const missing = expected.filter((statement) => !sql.toLowerCase().includes(statement.toLowerCase()));
if (missing.length > 0) {
  throw new Error(`Migration validation failed. Missing: ${missing.join(", ")}`);
}

console.log("Customer authentication migration structure validated.");
