import { STATUS_LABELS, type DeliveryStatusValue } from "@/lib/delivery-status";

const COLORS: Record<DeliveryStatusValue, string> = {
  PENDING: "bg-[#fff4cc] text-[#6b5400]",
  ACCEPTED: "bg-[#e3f0ff] text-[#184a8c]",
  PICKED_UP: "bg-[#e8f7e0] text-[#2a5a1a]",
  IN_TRANSIT: "bg-[var(--leaf)] text-[var(--ink)]",
  DELIVERED: "bg-[var(--moss)] text-[#f4f8ef]",
  CANCELLED: "bg-[#f0e4e4] text-[#7a3030]",
};

export function StatusBadge({ status }: { status: DeliveryStatusValue }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
