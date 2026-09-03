import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "npm:standardwebhooks@1.0.0";

type SmsHookPayload = {
  user: { phone?: string };
  sms: { otp?: string };
};

function requiredSecret(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function arkeselPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("233") || digits.length !== 12) {
    throw new Error("Only valid Ghana phone numbers can receive this login code.");
  }
  return digits;
}

function hookSecretValue(value: string): string {
  return value.replace(/^v1,whsec_/, "");
}

function failure(message: string, status = 500) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function deliverArkeselSms(phone: string, otp: string) {
  try {
    const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": requiredSecret("ARKESEL_API_KEY"),
      },
      body: JSON.stringify({
        sender: requiredSecret("ARKESEL_SENDER_ID"),
        recipients: [arkeselPhone(phone)],
        message: `Your Chapman Prestige code is ${otp}. It expires in 5 minutes.`,
      }),
    });

    const result = (await response.json().catch(() => null)) as { status?: string; message?: string } | null;
    if (!response.ok || result?.status !== "success") {
      console.error("Arkesel SMS delivery was rejected", { status: response.status, message: result?.message });
    }
  } catch (error) {
    console.error("Arkesel SMS delivery failed", error instanceof Error ? error.message : "unknown error");
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return failure("Method not allowed.", 405);

  try {
    const rawPayload = await request.text();
    const signedHeaders = Object.fromEntries(request.headers);
    const webhook = new Webhook(hookSecretValue(requiredSecret("SEND_SMS_HOOK_SECRETS")));
    const event = webhook.verify(rawPayload, signedHeaders) as SmsHookPayload;

    const phone = event.user.phone;
    const otp = event.sms.otp;
    if (!phone || !otp || !/^\d{6}$/.test(otp)) {
      return failure("Invalid phone login message.", 400);
    }

    // Supabase Auth gives this hook five seconds. The SMS provider can take longer,
    // so acknowledge the verified hook first and keep the provider request alive safely.
    EdgeRuntime.waitUntil(deliverArkeselSms(phone, otp));

    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Arkesel Send SMS Hook failed", error instanceof Error ? error.message : "unknown error");
    return failure("Could not send the login code. Please try again.", 500);
  }
});
