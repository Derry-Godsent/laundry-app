# Production Security Backup and Activation Checklist

**Purpose.** Complete this checklist before changing the live Chapman Supabase permissions. It creates a private copy of the database structure, policies, functions, user data, and customer records so a recovery reference exists if a production change must be undone. This is a free, manual logical backup; it does not create a paid Supabase branch.

> Keep the database connection string and every backup file private. Do not paste either into chat, commit the files to GitHub, or upload them to public storage.

## Part 1: Make the backup on your own computer

Supabase recommends regular logical exports for free-tier projects. Its CLI produces separate role, schema, and data exports. The schema export contains the tables, policies, functions, triggers, and other database structure; the data export contains operational and customer records.[1]

1. Install the Supabase CLI and Docker Desktop on your own computer. Docker is required because the CLI runs the matching database dump tool in a container.[2]
2. Sign in at [Supabase Dashboard](https://supabase.com/dashboard), open **Derry-Godsent's Project**, then click **Connect**. Select the **Session pooler** connection string. Keep that value private.
3. Open a terminal on your computer, then run the following commands. When prompted, paste the connection string privately. The command does not save the password to your terminal history.

```bash
mkdir -p "$HOME/chapman-private-backups/before-customer-security"
cd "$HOME/chapman-private-backups/before-customer-security"

read -s -p "Paste the Supabase connection string: " DB_URL
echo

supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$DB_URL" -f schema.sql
supabase db dump --db-url "$DB_URL" -f data.sql --use-copy --data-only \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

unset DB_URL
ls -lh roles.sql schema.sql data.sql
```

4. Confirm that all three files exist and are larger than zero bytes. Save the backup folder in a private encrypted location, such as an encrypted USB drive or private cloud folder that is not shared publicly. Never add these files to the `laundry-app` GitHub repository.
5. Do **not** change or reset the database password merely for this backup. Reset it only if you have genuinely lost it, because other services using the previous password will need to be updated.

## Part 2: Apply the security fix safely

After the backup is complete, reply only **“Backup complete”**. Do not send the backup file or database password. The next controlled production step is as follows.

| Step | Action | What success looks like |
| --- | --- | --- |
| 1 | Choose a quiet period and pause new staff order entry briefly. Keep one admin or worker signed in and ready to test. | There is no active data-entry rush while policies change. |
| 2 | Apply the reviewed migration from GitHub branch `feature/customer-auth-foundation` once. | Customer tables and scoped permissions are created with no migration error. |
| 3 | Test staff first: open the dashboard, read services and clients, create or update a normal test order, and confirm staff actions still work. | The staff dashboard remains usable for authorised staff. |
| 4 | Test protection: a signed-out visitor and a customer test account must not see staff, other customers, security settings, prices, or direct order-writing controls. | Customer data is isolated and operational controls are protected. |
| 5 | Only after the staff/customer access test passes, configure Phone Auth and an SMS provider in Supabase Auth settings. | A Ghana phone number can receive and verify a real OTP. |

## What is already ready

The GitHub branch contains the reviewed migration, a local validation script, and this checklist. The migration is designed to preserve the existing staff application while replacing unsafe public access with staff-only administration and customer-own-data access. It is **not applied** to the live database yet.

## What is not included in the database dump

Database dumps do not include objects stored in Supabase Storage. If the business later stores customer photos, invoices, or documents in Storage, those files need a separate private export.[1]

## References

[1] [Supabase, “Database Backups”](https://supabase.com/docs/guides/platform/backups)

[2] [Supabase, “Backup and Restore Using the CLI”](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
