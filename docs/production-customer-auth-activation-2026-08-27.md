# Production Customer-Record Security Activation

## Approved scope

The owner approved application of the prepared customer-record security migration on 27 August 2026. The scope is limited to customer-to-client linking, scoped database access rules, and the customer profile-completion procedure. It does not add bookings, alter existing order values, or change any staff screen.

## Read-only baseline captured before the change

| Table | Existing rows | Existing access rules |
| --- | ---: | --- |
| `clients` | 125 | Five permissive rules; row-level security disabled |
| `orders` | 210 | One permissive rule |
| `order_items` | 208 | One permissive rule |
| `services` | 82 | One permissive rule |
| `staff` | 3 | Four permissive staff rules |

The live schema matches the prepared migration: client, order, service, staff, and related administrative tables exist with the required columns. The migration is additive for customer accounts and does not modify existing client, order, or service content.

## Required checks after the change

1. Verify the customer profile procedure is available to a signed-in customer.
2. Verify a customer can read only their own account and linked client record.
3. Verify a customer cannot change orders, prices, staff, roles, settings, or audit records.
4. Verify each ordinary staff user can still open and manage the existing staff dashboard.

## Completed validation

The production migration completed successfully. A temporary anonymous context could read zero client, order, order-item, and staff records. A temporary ordinary-staff context was recognised as staff and could still read all 125 client records and 210 order records.

The existing staff administration page also opened successfully using the active staff session. No booking values or staff screens were changed.

## Customer-link completion

The customer profile procedure is now available in production. A customer who completed the temporary Auth-metadata profile before this activation does not need another SMS code: their next visit to the account area will create the protected customer-to-client link from their already-verified profile details. New customers use the same procedure at the end of their first verified setup.
