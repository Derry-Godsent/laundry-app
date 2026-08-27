# Customer Account Security Preparation Review

**Status: ready for review, not applied to production.** This work was completed in the separate `feature/customer-auth-foundation` Git branch. No production database table, policy, Auth setting, staff screen, customer record, or operational booking was changed.

## What was checked

| Area | Read-only finding | Local draft response |
| --- | --- | --- |
| Staff access continuity | All three existing staff records map to an Auth user. | Scoped staff policies use this established link, so the staff dashboard keeps its existing identity model. |
| Customer account link | Customer profile data has no safe Auth relationship yet. | Add `customer_accounts`, which links one verified phone-Auth user to one Chapman client record. |
| Client phone quality | Existing values are not consistently stored in the format needed for phone OTP. | Match only recognised Ghana formats at onboarding time. Historic client values are not changed, and invalid placeholder values are not linked. |
| Public table access | `clients` has RLS disabled; several operational tables have broad public policies. | Replace the exact known broad policies with staff-only administration and customer-own-data reading. |
| Privileged functions | Two legacy privileged functions can be directly executed by public callers and have mutable search paths. | Set safe search paths and remove direct anonymous and customer execution. Trigger/service support remains available. |

## Local migration safeguards

The reviewed migration creates a small customer-account table rather than altering existing order structures. A customer can complete their own profile only after a Supabase-verified phone session. The app cannot select a different client record, alter staff data, create direct orders, change prices, adjust payment values, view another customer, or read role and security data.

The migration preserves the current staff data model and keeps staff access based on the existing `staff.id = auth.uid()` relationship. It also creates a safe normalised-phone index, so matching a verified Ghana number does not require rewriting historic customer records.

## Validation completed

The local validation script confirms that the migration includes the customer account table, normalised Ghana phone matching, RLS activation for `clients`, the known broad-policy removals, restricted privileged-function execution, scoped customer reads, and preserved staff order access. The migration was not sent to Supabase.

## Before any production change

1. Choose a quiet period and have one existing staff member ready to test their normal dashboard tasks immediately after the change.
2. Export the fresh production schema and policies for rollback reference, then apply the reviewed migration once.
3. Test staff access first. Then enable Supabase Phone Auth and its SMS provider, and test one Ghana customer number before allowing live customer bookings.

> The current mobile app remains safe to browse in guest mode. Real customer accounts, live bookings, and live tracking stay disabled until the production access test is completed.
