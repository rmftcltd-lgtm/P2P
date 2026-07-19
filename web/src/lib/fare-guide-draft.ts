import type { PlaceValue } from "@/components/PlacePicker";

export type FareGuideMode = "driver" | "sender";

export type FareGuideDraft = {
  mode: FareGuideMode;
  from: PlaceValue;
  to: PlaceValue;
  space: string;
  spaces?: string[];
  lonelyCover?: boolean;
  donateBrake?: boolean;
  donateTrees?: boolean;
  listedPrice?: number;
  offerAmount?: number;
  driverTake?: number;
  savedAt: number;
};

const KEY = "lonelyseat_fare_draft";

export function saveFareGuideDraft(draft: Omit<FareGuideDraft, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: FareGuideDraft = { ...draft, savedAt: Date.now() };
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function readFareGuideDraft(): FareGuideDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FareGuideDraft;
    if (!data?.from?.address || !data?.to?.address) return null;
    // Drafts older than 7 days expire
    if (Date.now() - (data.savedAt ?? 0) > 7 * 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearFareGuideDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function fareGuideContinuePath(mode: FareGuideMode) {
  return mode === "driver" ? "/driver/trips?fromEstimate=1" : "/customer?fromEstimate=1";
}

export function fareGuideRegisterPath(mode: FareGuideMode) {
  const role = mode === "driver" ? "DRIVER" : "CUSTOMER";
  const next = encodeURIComponent(fareGuideContinuePath(mode));
  return `/register?role=${role}&next=${next}`;
}
