import { STATUS_LABELS, type DeliveryStatusValue } from "@/lib/delivery-status";

const COLORS: Record<DeliveryStatusValue, string> = {
  PENDING: "bg-[#fff6d6] text-[#6b5400]",
  ACCEPTED: "bg-sea-soft text-sea",
  PICKED_UP: "bg-[#e5f3ea] text-[#1f5a38]",
  IN_TRANSIT: "bg-leaf text-ink",
  DELIVERED: "bg-moss text-paper",
  CANCELLED: "bg-[#f3e4e4] text-[#7a3030]",
};

export function StatusBadge({ status }: { status: DeliveryStatusValue }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
