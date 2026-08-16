import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

type SendSmsHookPayload = {
  user: {
    phone: string;
  };
  sms: {
    otp: string;
  };
};

const jsonHeaders = { "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  const termiiApiKey = Deno.env.get("TERMII_API_KEY");
  const termiiSenderId = Deno.env.get("TERMII_SENDER_ID");

  if (!hookSecret || !termiiApiKey || !termiiSenderId) {
    console.error("Missing one or more required send-sms-hook environment variables");
    return jsonResponse({ error: "SMS service is not configured" }, 500);
  }

  const rawPayload = await request.text();
  const webhook = new Webhook(hookSecret.replace("v1,whsec_", ""));
  let payload: SendSmsHookPayload;

  try {
    payload = webhook.verify(
      rawPayload,
      Object.fromEntries(request.headers.entries()),
    ) as SendSmsHookPayload;
  } catch (error) {
    console.error("Invalid Send SMS hook signature", error);
    return jsonResponse({ error: "Invalid webhook signature" }, 401);
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;

  if (!phone || !otp) {
    console.error("Send SMS hook payload is missing user.phone or sms.otp");
    return jsonResponse({ error: "Invalid hook payload" }, 400);
  }

  let termiiResponse: Response;
  try {
    termiiResponse = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        to: phone.replace(/^\+/, ""),
        from: termiiSenderId,
        sms: `Your Everything Jos voting code is ${otp}. It expires in 10 minutes.`,
        type: "plain",
        channel: "dnd",
        api_key: termiiApiKey,
      }),
    });
  } catch (error) {
    console.error("Termii request failed", error);
    return jsonResponse({ error: "SMS provider request failed" }, 500);
  }

  const termiiBody = await termiiResponse.text();
  if (!termiiResponse.ok) {
    console.error("Termii SMS send failed", termiiBody);
    return jsonResponse({ error: "SMS provider rejected the request" }, 500);
  }

  return jsonResponse({}, 200);
});
