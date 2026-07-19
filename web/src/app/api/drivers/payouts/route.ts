import { requireSession } from "@/lib/auth";
import {
  createDriverConnectOnboarding,
  getDriverConnectStatus,
  stripeEnabled,
} from "@/lib/payments";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession(["DRIVER"]);
    const status = await getDriverConnectStatus(session.id);
    return jsonOk({ ...status, stripeEnabled: stripeEnabled() });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Start Stripe Connect Express onboarding (or enable mock payouts). */
export async function POST() {
  try {
    const session = await requireSession(["DRIVER"]);
    const result = await createDriverConnectOnboarding(session.id);
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
