import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { notify, emailEnabled, notifyConfig, isMailgunSandbox } from "@/lib/notify";

function mailgunAuthHeader() {
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) return null;
  return `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`;
}

function mailgunApiBase() {
  return (process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net").replace(
    /\/$/,
    "",
  );
}

/** Admin: inspect email provider readiness (no recipient opt-in flow). */
export async function GET() {
  try {
    await requireSession(["ADMIN"]);
    const auth = mailgunAuthHeader();
    let domains: unknown = null;
    let domainsError: string | undefined;
    if (auth) {
      const res = await fetch(`${mailgunApiBase()}/v3/domains`, {
        headers: { Authorization: auth },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        domainsError =
          (data as { message?: string }).message ?? `HTTP ${res.status}`;
      } else {
        domains = (data as { items?: unknown }).items ?? data;
      }
    }

    return jsonOk({
      ...notifyConfig(),
      emailEnabled: emailEnabled(),
      mailgunSandbox: isMailgunSandbox(),
      domains,
      domainsError,
      guidance: isMailgunSandbox()
        ? "Mailgun sandbox cannot send to arbitrary users. Add a verified custom domain in Mailgun (or set RESEND_API_KEY / SENDGRID_API_KEY) and update MAILGUN_DOMAIN + EMAIL_FROM."
        : "Email provider looks unrestricted for arbitrary recipients.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Admin: send a test email (no sandbox recipient invites). */
export async function POST(req: Request) {
  try {
    await requireSession(["ADMIN"]);
    if (!emailEnabled()) {
      return jsonError(
        "No unrestricted email provider configured. Set RESEND_API_KEY, SENDGRID_API_KEY, or a non-sandbox MAILGUN_DOMAIN.",
        503,
      );
    }
    const body = (await req.json().catch(() => ({}))) as { to?: string };
    const to = body.to?.trim();
    if (!to) return jsonError("to required", 400);

    const result = await notify({
      toEmail: to,
      subject: "Lonelyseat test email",
      text: "Lonelyseat email is working without sandbox recipient confirmation.",
      html: "<p>Lonelyseat email is working without sandbox recipient confirmation.</p>",
    });

    return jsonOk({
      to,
      provider: notifyConfig().provider,
      result,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
