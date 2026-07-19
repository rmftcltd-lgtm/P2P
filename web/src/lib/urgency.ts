/** Urgency windows for send listings and browse filters. */
export const URGENCY_OPTIONS = [
  { key: "flexible", label: "Flexible" },
  { key: "week", label: "This week" },
  { key: "today", label: "Today" },
] as const;

export type UrgencyKey = (typeof URGENCY_OPTIONS)[number]["key"];

export function urgencyLabel(key: string | null | undefined) {
  return URGENCY_OPTIONS.find((o) => o.key === key)?.label ?? "Flexible";
}

/** Preferred pickup date derived from urgency (start-of-day NZ local-ish). */
export function preferredDateFromUrgency(urgency: string): Date | null {
  if (urgency === "flexible" || !urgency) return null;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (urgency === "today") return start;
  // this week — end of current calendar week (Sunday)
  const end = new Date(start);
  end.setDate(end.getDate() + (7 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Whether a preferredDate / departAt falls in the browse urgency window. */
export function inUrgencyWindow(
  when: Date | null | undefined,
  window: string,
): boolean {
  if (window === "flexible") return true;
  if (!when) return window === "flexible";
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (window === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return when >= start && when < end;
  }
  if (window === "tomorrow") {
    const t0 = new Date(start);
    t0.setDate(t0.getDate() + 1);
    const t1 = new Date(t0);
    t1.setDate(t1.getDate() + 1);
    return when >= t0 && when < t1;
  }
  // week
  const end = new Date(start);
  end.setDate(end.getDate() + (7 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return when >= start && when <= end;
}

export function listingSharePath(requestCode: string) {
  return `/l/${requestCode}`;
}

export function listingShareUrl(requestCode: string, origin?: string) {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://lonelyseat.vercel.app");
  return `${base.replace(/\/$/, "")}${listingSharePath(requestCode)}`;
}
