import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { notify, emailEnabled } from "@/lib/notify";

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

/** List / manage Mailgun sandbox authorized recipients (admin only). */
export async function GET() {
  try {
    await requireSession(["ADMIN"]);
    const auth = mailgunAuthHeader();
    if (!auth) return jsonError("Mailgun not configured", 503);

    const res = await fetch(`${mailgunApiBase()}/v5/sandbox/auth_recipients`, {
      headers: { Authorization: auth },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return jsonError(
        (data as { message?: string }).message ?? `Mailgun HTTP ${res.status}`,
        502,
      );
    }
    return jsonOk({
      emailEnabled: emailEnabled(),
      domain: process.env.MAILGUN_DOMAIN ?? null,
      recipients: (data as { recipients?: unknown }).recipients ?? data,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Invite sandbox recipients (sends Mailgun verification email) and/or
 * send a Lonelyseat test message once they are activated.
 *
 * Body: { emails: string[], sendTest?: boolean }
 */
export async function POST(req: Request) {
  try {
    await requireSession(["ADMIN"]);
    const auth = mailgunAuthHeader();
    if (!auth) return jsonError("Mailgun not configured", 503);

    const body = (await req.json().catch(() => ({}))) as {
      emails?: string[];
      sendTest?: boolean;
    };
    const emails = (body.emails ?? [])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!emails.length) return jsonError("emails required", 400);

    const base = mailgunApiBase();
    const invited: Array<{
      email: string;
      ok: boolean;
      activated?: boolean;
      error?: string;
      raw?: unknown;
    }> = [];

    for (const email of emails) {
      const res = await fetch(
        `${base}/v5/sandbox/auth_recipients?email=${encodeURIComponent(email)}`,
        { method: "POST", headers: { Authorization: auth } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        invited.push({
          email,
          ok: false,
          error:
            (data as { message?: string }).message ?? `HTTP ${res.status}`,
          raw: data,
        });
        continue;
      }
      const recipient = (data as { recipient?: { email?: string; activated?: boolean } })
        .recipient;
      invited.push({
        email,
        ok: true,
        activated: recipient?.activated,
        raw: data,
      });
    }

    const tests: Array<{ email: string; ok: boolean; id?: string; error?: string; skipped?: boolean }> =
      [];
    if (body.sendTest) {
      for (const email of emails) {
        const result = await notify({
          toEmail: email,
          subject: "Lonelyseat test — sandbox mail check",
          text: "If you received this, your address is authorised on the Mailgun sandbox and Lonelyseat can deliver lifecycle emails.",
          html: `<p>If you received this, your address is authorised on the Mailgun sandbox and Lonelyseat can deliver lifecycle emails.</p>`,
        });
        tests.push({
          email,
          ok: Boolean(result.email?.ok),
          id: result.email?.id,
          error: result.email?.error,
          skipped: result.email?.skipped,
        });
      }
    }

    return jsonOk({
      domain: process.env.MAILGUN_DOMAIN ?? null,
      invited,
      tests: body.sendTest ? tests : undefined,
      nextStep:
        "Open each inbox, accept the Mailgun sandbox authorisation email, then POST again with sendTest:true (or re-run the E2E journey).",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
