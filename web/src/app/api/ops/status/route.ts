import { notifyConfig, emailEnabled, smsEnabled } from "@/lib/notify";
import { stripeEnabled, stripePublishableKey } from "@/lib/payments";
import { googleMapsEnabled } from "@/lib/google-maps";
import { jsonOk } from "@/lib/api";

/** Public ops status — which integrations are live (no secrets). */
export async function GET() {
  return jsonOk({
    ...notifyConfig(),
    stripe: stripeEnabled(),
    stripePublishable: Boolean(stripePublishableKey()),
    email: emailEnabled(),
    sms: smsEnabled(),
    googleMaps: googleMapsEnabled(),
  });
}
