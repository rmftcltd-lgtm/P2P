export const STATUS_FLOW = [
  "PENDING",
  "ACCEPTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
] as const;

export type DeliveryStatusValue =
  | "PENDING"
  | "ACCEPTED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export const STATUS_LABELS: Record<DeliveryStatusValue, string> = {
  PENDING: "Looking for driver",
  ACCEPTED: "Driver assigned",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function canTransition(
  from: DeliveryStatusValue,
  to: DeliveryStatusValue,
): boolean {
  if (to === "CANCELLED") {
    return from === "PENDING" || from === "ACCEPTED";
  }
  const fromIdx = STATUS_FLOW.indexOf(from as (typeof STATUS_FLOW)[number]);
  const toIdx = STATUS_FLOW.indexOf(to as (typeof STATUS_FLOW)[number]);
  return fromIdx >= 0 && toIdx === fromIdx + 1;
}
