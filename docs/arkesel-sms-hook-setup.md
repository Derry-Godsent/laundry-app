# Arkesel SMS Login Setup

This setup keeps the current mobile app login flow. The app asks Supabase for a code; Supabase creates the code and verifies it; the Send SMS Hook sends that exact code through Arkesel. The Arkesel API key stays in Supabase, not in the app or GitHub.

## What is ready in Git

The local branch now includes `supabase/functions/send-sms-arkesel`. It is an Edge Function that checks that Supabase really sent the request before sending the code through Arkesel.

The function is not deployed and no live setting has been changed.

## The three private values to add in Supabase

In Supabase **Edge Functions → Secrets**, add these values directly. Do not send them in chat and do not place them in GitHub.

| Secret name | What to put there |
| --- | --- |
| `ARKESEL_API_KEY` | The Arkesel API key approved for transactional SMS. |
| `ARKESEL_SENDER_ID` | Your approved sender name, up to 11 characters, for example `Chapman`. |
| `SEND_SMS_HOOK_SECRET` | The signing secret Supabase creates when you set up the Send SMS Hook. |

## The live setup order

1. Deploy the `send-sms-arkesel` Edge Function from this branch.
2. Add the first two Arkesel secrets in Supabase.
3. Go to **Authentication → Auth Hooks → Send SMS**.
4. Select the Edge Function endpoint and let Supabase generate the hook signing secret.
5. Copy that generated secret into the `SEND_SMS_HOOK_SECRET` Edge Function secret.
6. Go to **Authentication → Sign In / Providers → Phone** and enable Phone. Leave the native Twilio fields empty because the hook sends through Arkesel.
7. Use a single Ghana test number in the mobile app. A valid sign-in request should send the SMS and the same six-digit code should verify through Supabase.

## Important testing rule

Do the first test only with a Chapman-controlled Ghana number. Do not open phone login to all customers until the customer-account security migration has been applied and staff login has been checked. This prevents a newly verified customer from reaching broad development-era database permissions.

## References

[1]: https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook "Supabase Send SMS Hook"
[2]: https://developers.arkesel.com "Arkesel Developer Documentation"
