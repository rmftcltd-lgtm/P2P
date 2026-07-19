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

export type EmailProvider = "resend" | "sendgrid" | "mailgun" | "none";

export function isMailgunSandbox(domain = process.env.MAILGUN_DOMAIN ?? "") {
  return /sandbox/i.test(domain) || /\.mailgun\.org$/i.test(domain);
}

/** Prefer providers that can send to any recipient (no per-user opt-in). */
export function resolveEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    // Sandbox domains require authorized recipients — not suitable for users.
    if (isMailgunSandbox() && process.env.MAILGUN_ALLOW_SANDBOX !== "true") {
      return "none";
    }
    return "mailgun";
  }
  return "none";
}

export function emailEnabled() {
  return resolveEmailProvider() !== "none";
}

export function smsEnabled() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

function mailgunApiBase() {
  return (process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net").replace(
    /\/$/,
    "",
  );
}

function defaultFromEmail() {
  const provider = resolveEmailProvider();
  if (provider === "mailgun" && process.env.MAILGUN_DOMAIN) {
    return `Lonelyseat <mailgun@${process.env.MAILGUN_DOMAIN}>`;
  }
  if (provider === "resend") {
    return "Lonelyseat <onboarding@resend.dev>";
  }
  return "Lonelyseat <noreply@lonelyseat.local>";
}

export function notifyConfig() {
  const provider = resolveEmailProvider();
  return {
    email: emailEnabled(),
    provider,
    sms: smsEnabled(),
    payments: Boolean(process.env.STRIPE_SECRET_KEY),
    stripePublishable: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    fromEmail: process.env.EMAIL_FROM ?? defaultFromEmail(),
    mailgunDomain: process.env.MAILGUN_DOMAIN ?? "",
    mailgunSandbox: isMailgunSandbox(),
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

async function sendViaResend(
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string,
) {
  const apiKey = process.env.RESEND_API_KEY!;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };
  if (!res.ok) {
    console.error("[notify:email:resend:fail]", data);
    return {
      ok: false as const,
      error: data.message ?? data.name ?? `HTTP ${res.status}`,
    };
  }
  return { ok: true as const, id: data.id };
}

async function sendViaSendgrid(
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string,
) {
  const apiKey = process.env.SENDGRID_API_KEY!;
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from.includes("<") ? from.match(/<([^>]+)>/)?.[1] ?? from : from, name: "Lonelyseat" },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("[notify:email:sendgrid:fail]", data);
    const err =
      (data as { errors?: { message?: string }[] }).errors?.[0]?.message ??
      `HTTP ${res.status}`;
    return { ok: false as const, error: err };
  }
  return { ok: true as const, id: res.headers.get("x-message-id") ?? undefined };
}

async function sendViaMailgun(
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string,
) {
  const apiKey = process.env.MAILGUN_API_KEY!;
  const domain = process.env.MAILGUN_DOMAIN!;
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  const body = new URLSearchParams({ from, to, subject, text, html });
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
    console.error("[notify:email:mailgun:fail]", data);
    return { ok: false as const, error: data.message ?? `HTTP ${res.status}` };
  }
  return { ok: true as const, id: data.id };
}

async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const provider = resolveEmailProvider();
  const htmlBody = html ?? `<p>${text.replace(/\n/g, "<br/>")}</p>`;
  const from = process.env.EMAIL_FROM ?? defaultFromEmail();

  if (provider === "none") {
    if (isMailgunSandbox() && process.env.MAILGUN_API_KEY) {
      console.warn(
        "[notify:email:blocked-sandbox]",
        "Mailgun sandbox ignored — set RESEND_API_KEY, SENDGRID_API_KEY, or a verified custom MAILGUN_DOMAIN so users are not asked to opt in.",
        { to, subject },
      );
      return {
        ok: false as const,
        error:
          "Mailgun sandbox disabled (requires recipient opt-in). Configure Resend, SendGrid, or a verified Mailgun domain.",
      };
    }
    console.info("[notify:email:mock]", { to, subject, text });
    return { ok: true as const, skipped: true as const };
  }

  if (provider === "resend") return sendViaResend(to, subject, text, htmlBody, from);
  if (provider === "sendgrid") return sendViaSendgrid(to, subject, text, htmlBody, from);
  return sendViaMailgun(to, subject, text, htmlBody, from);
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
