import {
  notifyConfig,
  emailEnabled,
  smsEnabled,
  isMailgunSandbox,
  resolveEmailProvider,
} from "@/lib/notify";
import { stripeEnabled, stripePublishableKey } from "@/lib/payments";
import { googleMapsEnabled } from "@/lib/google-maps";
import { jsonOk } from "@/lib/api";

/** Public ops status — which integrations are live (no secrets). */
export async function GET() {
  const provider = resolveEmailProvider();
  return jsonOk({
    ...notifyConfig(),
    stripe: stripeEnabled(),
    stripePublishable: Boolean(stripePublishableKey()),
    email: emailEnabled(),
    emailProvider: provider,
    emailUnrestricted: provider !== "none",
    mailgunSandbox: isMailgunSandbox(),
    sms: smsEnabled(),
    googleMaps: googleMapsEnabled(),
  });
}
