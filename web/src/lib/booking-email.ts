import type { BookingEmailDetails } from "@/lib/email-templates";

type DeliveryLike = {
  requestCode: string;
  itemTitle?: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  spaceNeeded?: string | null;
  offerAmount?: number | null;
  preferredDate?: Date | string | null;
  preferredDropoffDate?: Date | string | null;
  packageNotes?: string | null;
};

export function toBookingDetails(
  d: DeliveryLike,
  other?: { name?: string | null; phone?: string | null } | null,
): BookingEmailDetails {
  return {
    requestCode: d.requestCode,
    itemTitle: d.itemTitle,
    pickupAddress: d.pickupAddress,
    dropoffAddress: d.dropoffAddress,
    spaceNeeded: d.spaceNeeded,
    offerAmount: d.offerAmount,
    preferredDate: d.preferredDate,
    preferredDropoffDate: d.preferredDropoffDate,
    packageNotes: d.packageNotes,
    otherPartyName: other?.name,
    otherPartyPhone: other?.phone,
  };
}
