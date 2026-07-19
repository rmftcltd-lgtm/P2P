import { appBaseUrl } from "@/lib/payments";

export type NotifyChannel = "email" | "sms";

export type NotifyPayload = {
  toEmail?: string | null;
  toPhone?: string | null;
  subject: string;
  text: string;
  html?: string;
};

export type NotifyResult = {
  email?: { ok: boolean; id?: string; skipped?: boolean; error?: string };
  sms?: { ok: boolean; sid?: string; skipped?: boolean; error?: string };
};

export function emailEnabled() {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}

export function smsEnabled() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

function mailgunApiBase() {
  const base = (process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net").replace(
    /\/$/,
    "",
  );
  return base;
}

function defaultFromEmail() {
  const domain = process.env.MAILGUN_DOMAIN;
  if (domain) return `Lonelyseat <mailgun@${domain}>`;
  return "Lonelyseat <noreply@lonelyseat.local>";
}

export function notifyConfig() {
  return {
    email: emailEnabled(),
    sms: smsEnabled(),
    payments: Boolean(process.env.STRIPE_SECRET_KEY),
    stripePublishable: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    fromEmail: process.env.EMAIL_FROM ?? defaultFromEmail(),
    mailgunDomain: process.env.MAILGUN_DOMAIN ?? "",
    appUrl: appBaseUrl(),
  };
}

/** Normalize NZ / international phones toward E.164 for Twilio. */
export function toE164(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) return trimmed.replace(/[^\d+]/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("64")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 9) return `+64${digits.slice(1)}`;
  if (digits.length >= 8) return `+64${digits}`;
  return null;
}

async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) {
    console.info("[notify:email:mock]", { to, subject, text });
    return { ok: true, skipped: true as const };
  }
  const from = process.env.EMAIL_FROM ?? defaultFromEmail();
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const body = new URLSearchParams({
    from,
    to,
    subject,
    text,
    html: html ?? `<p>${text.replace(/\n/g, "<br/>")}</p>`,
  });
  const res = await fetch(`${mailgunApiBase()}/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (!res.ok) {
    console.error("[notify:email:fail]", data);
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  }
  return { ok: true, id: data.id };
}

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    console.info("[notify:sms:mock]", { to, body });
    return { ok: true, skipped: true as const };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    sid?: string;
    message?: string;
    error_message?: string;
  };
  if (!res.ok) {
    console.error("[notify:sms:fail]", data);
    return {
      ok: false,
      error: data.error_message ?? data.message ?? `HTTP ${res.status}`,
    };
  }
  return { ok: true, sid: data.sid };
}

/** Fire-and-forget safe: never throws to callers. */
export async function notify(payload: NotifyPayload): Promise<NotifyResult> {
  const result: NotifyResult = {};
  try {
    if (payload.toEmail) {
      result.email = await sendEmail(
        payload.toEmail,
        payload.subject,
        payload.text,
        payload.html,
      );
    }
    const e164 = toE164(payload.toPhone);
    if (e164) {
      // SMS body kept short
      const smsBody = `${payload.subject}: ${payload.text}`.slice(0, 320);
      result.sms = await sendSms(e164, smsBody);
    }
  } catch (err) {
    console.error("[notify:error]", err);
  }
  return result;
}

export function linkTo(path: string) {
  return `${appBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
