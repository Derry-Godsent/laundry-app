# Customer Phone-OTP Authentication Rollout

This is the first additive integration step for Chapman Prestige. It does not change the current staff screens. It introduces customer accounts only after a customer verifies a phone number through Supabase Auth.

## What will change

The migration adds `customer_accounts` and a secure `complete_customer_onboarding` procedure. The new table connects one verified Supabase Auth user to one existing or newly-created Chapman client record. It does **not** alter historic orders, staff records, service prices, payment records, or report calculations.

The migration also replaces public-all policies on sensitive tables with two clear permissions: authenticated staff can continue using the existing system, while customers can read only their linked profile, their own orders, their own order items, and the public service catalogue. Customers cannot create direct orders, alter prices, alter payment state, or read staff details.

The rollout does **not** require a paid Supabase branch. The security migration remains a local Git change until it has been reviewed, structurally validated, and approved for a short production maintenance window.

## Rollout steps

| Step | Action | Success condition |
| --- | --- | --- |
| 1 | Export and review the live schema, policies, security advisories, staff-auth links, and phone-format readiness without reading customer records. | The migration is matched to actual table and policy names. |
| 2 | Run the local structural validation script and review the exact SQL change in the separate Git branch. | No production system, database setting, or staff screen is changed. |
| 3 | During a quiet operating period, take a fresh schema/policy backup and have one staff member ready to test their usual dashboard actions. | A rollback reference and staff verification are available before any production change. |
| 4 | Apply the reviewed migration once, then test the staff and customer access scenarios below immediately. | Staff access continues; customer accounts are restricted to their own data. |
| 5 | Enable Phone Auth and configure an SMS provider in Supabase Auth settings, then test a Ghana-format number. | The phone onboarding flow can receive and verify an OTP. |

## Required access tests

| Test actor | Must be allowed | Must be denied |
| --- | --- | --- |
| Existing admin | Existing dashboard, services, clients, orders, staff, security, payments, and reports actions | Nothing required for current admin work should be removed. |
| Existing worker | Current role-allowed views and work actions | Editing staff, security configuration, role permissions, and service prices unless explicitly authorised. |
| New phone-OTP customer | Completing profile, reading their own client record, their own orders, their own order items, and the service catalogue | Reading any other client, any staff record, all orders, service edits, price writes, payment writes, and role/security data. |
| Unauthenticated visitor | Nothing except the native app’s local guest experience | Every production Supabase table. |

## Readiness checks completed on 27 August 2026

| Check | Finding | Treatment in the local draft |
| --- | --- | --- |
| Staff to Auth connection | All three existing staff records are linked to an Auth user. | The scoped staff policies use the established staff-to-Auth relationship. |
| Client phone readiness | Existing client phone values are not consistently stored in the Ghana E.164 format required by Auth. | The migration safely normalises recognised Ghana formats only. Placeholder or malformed legacy values are not auto-linked. |
| Public table access | `clients` has RLS disabled, and several operational tables have permissive public policies. | The local migration uses the exact deployed policy names and replaces them with scoped staff/customer policies. |
| Legacy privileged functions | Two existing security-definer functions are publicly executable, and their search paths are mutable. | The local migration fixes their search paths and removes direct anon/authenticated execution while retaining service and trigger support. |

## Required Supabase configuration

The migration does not send SMS itself. In Supabase Dashboard, enable **Phone** in Auth Providers and configure an SMS provider. Use E.164 phone values, for example Ghana numbers beginning with `+233`. Keep automatic user creation enabled for the first-time OTP onboarding flow.

## Important operational note

The existing production policies currently permit public access to several operational tables. Do not deploy the mobile authentication UI as a live booking system until this migration has been tested and applied. The app can retain guest browsing while the safety work is completed.
