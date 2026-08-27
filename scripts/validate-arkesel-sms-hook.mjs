import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../supabase/functions/send-sms-arkesel/index.ts", import.meta.url), "utf8");

const requiredFragments = [
  "https://sms.arkesel.com/api/v2/sms/send",
  '"api-key": requiredSecret("ARKESEL_API_KEY")',
  'requiredSecret("ARKESEL_SENDER_ID")',
  'requiredSecret("SEND_SMS_HOOK_SECRET")',
  "new Webhook",
  "webhook.verify",
  "recipients: [arkeselPhone(phone)]",
  "Your Chapman Prestige code is ${otp}",
];

for (const fragment of requiredFragments) {
  if (!source.includes(fragment)) throw new Error(`Missing required SMS-hook safeguard: ${fragment}`);
}

if (/ARKESEL_API_KEY\s*=\s*["'](?!\s*["'])/.test(source)) {
  throw new Error("Arkesel API key must not be embedded in source code.");
}

console.log("Arkesel Send SMS Hook structure validated.");
