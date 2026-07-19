import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { expireStaleOffers } from "@/lib/offer-sla";
import { expireStaleListings } from "@/lib/listing-expiry";

/**
 * Wireframe marketplace maintenance:
 * - Expire offers past 30-minute confirm SLA
 * - Expire journeys/stuff past last pickup datetime
 * - Send T-1 expiry reminder emails
 *
 * Secure with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.get("authorization");
      if (auth !== `Bearer ${secret}`) {
        return jsonError("Unauthorized", 401);
      }
    }

    const offers = await expireStaleOffers();
    const listings = await expireStaleListings();
    return jsonOk({ offers, listings });
  } catch (err) {
    return handleApiError(err);
  }
}
