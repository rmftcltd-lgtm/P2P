import {
  estimateFare,
  estimateSenderFare,
  estimateDriverTake,
  traditionalCompareFare,
  estimateCourierFreightFare,
  distanceKm,
} from "@/lib/geo";
import { spaceToPackageSize, LONELY_COVER_FEE, SPACE_KEYS } from "@/lib/spaces";
import { platformFeeFromOffer } from "@/lib/payments";
import { fareRange, formatFareRange } from "@/lib/fees";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const estimateSchema = z.object({
  pickupLat: z.coerce.number(),
  pickupLng: z.coerce.number(),
  dropoffLat: z.coerce.number(),
  dropoffLng: z.coerce.number(),
  space: z.enum(SPACE_KEYS).default("shoebox"),
  lonelyCover: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});

/** Wireframe: Get An Estimate */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = estimateSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return jsonError("Provide pickup/dropoff coordinates and optional space", 400);
    }
    const q = parsed.data;
    const distance = distanceKm(
      q.pickupLat,
      q.pickupLng,
      q.dropoffLat,
      q.dropoffLng,
    );
    const size = spaceToPackageSize(q.space);
    const courierFreightGuide = estimateCourierFreightFare(distance, size);
    const base = estimateFare(distance, size);
    const amount = estimateSenderFare(base);
    const driverTake = estimateDriverTake(base);
    const cover =
      q.lonelyCover === true || q.lonelyCover === "true" ? LONELY_COVER_FEE : 0;
    const fees = platformFeeFromOffer(base);
    const total = amount + cover;

    return jsonOk({
      distanceKm: Math.round(distance * 100) / 100,
      space: q.space,
      packageSize: size,
      base,
      amount,
      amountRange: fareRange(amount),
      amountDisplay: formatFareRange(amount),
      driverTake,
      driverTakeRange: fareRange(driverTake),
      driverTakeDisplay: formatFareRange(driverTake),
      fees,
      insurance: cover,
      lonelyCoverFee: cover,
      total,
      totalRange: fareRange(total),
      totalDisplay: formatFareRange(total),
      courierFreightGuide,
      courierFreightGuideDisplay: formatFareRange(courierFreightGuide),
      traditionalCompare: traditionalCompareFare(base),
      currency: "NZD",
      disclaimer:
        "Items are carried at the owner's risk unless Lonely Cover applies or the driver intentionally causes loss/damage. Guide compares to typical NZ courier and domestic freight (e.g. Mainfreight-style) quotes.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
