"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { DeliveryMap } from "@/components/DeliveryMap";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { distanceKm, estimateFare, estimateSenderFare } from "@/lib/geo";
import { spaceToPackageSize, LONELY_COVER_FEE } from "@/lib/spaces";
import { useLabels } from "@/lib/use-labels";
import { SpacePicker } from "@/components/SpacePicker";
import { usePolling } from "@/lib/use-polling";
import { useRelayStream } from "@/lib/use-relay-stream";
import type { DeliveryStatusValue } from "@/lib/delivery-status";
import { clearFareGuideDraft, readFareGuideDraft } from "@/lib/fare-guide-draft";

type User = { name: string; role: string };
type Delivery = {
  id: string;
  status: DeliveryStatusValue;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  packageSize: string;
  offerAmount: number;
  distanceKm: number;
  paymentStatus?: string;
  lonelyCover?: boolean;
  driver?: { name: string } | null;
};
type Trip = {
  id: string;
  fromAddress: string;
  toAddress: string;
  departAt: string;
  tripType: string;
  driver: { name: string };
};

export default function CustomerPage() {
  return (
    <Suspense fallback={<main className="atmosphere min-h-screen p-8 text-slate">Loading…</main>}>
      <CustomerPageInner />
    </Suspense>
  );
}

function CustomerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pickup, setPickup] = useState<PlaceValue | null>(null);
  const [dropoff, setDropoff] = useState<PlaceValue | null>(null);
  const [spaceNeeded, setSpaceNeeded] = useState("shoebox");
  const [timePreference, setTimePreference] = useState("flexible");
  const [lonelyCover, setLonelyCover] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [fullyPackaged, setFullyPackaged] = useState(false);
  const [greetAtPickup, setGreetAtPickup] = useState(false);
  const [greetAtDropoff, setGreetAtDropoff] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liveNote, setLiveNote] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const spaceLabels = useLabels("SPACE");
  const timeLabels = useLabels("TIME");

  useEffect(() => {
    const draft = readFareGuideDraft();
    if (!draft || draft.mode !== "sender") return;
    if (searchParams.get("fromEstimate") !== "1" && !draft.from) return;
    setPickup(draft.from);
    setDropoff(draft.to);
    setSpaceNeeded(draft.space);
    setLonelyCover(Boolean(draft.lonelyCover));
    setDraftNote(
      draft.offerAmount != null
        ? `Pre-filled from fare guide (~$${draft.offerAmount.toFixed(2)} to send).`
        : "Pre-filled from fare guide.",
    );
  }, [searchParams]);

  const packageSize = spaceToPackageSize(spaceNeeded);
  const estimate = useMemo(() => {
    if (!pickup || !dropoff) return null;
    const d = distanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const fare = estimateFare(d, packageSize);
    const seat = estimateSenderFare(fare);
    return {
      distance: d,
      fare: seat + (lonelyCover ? LONELY_COVER_FEE : 0),
      base: fare,
    };
  }, [pickup, dropoff, packageSize, lonelyCover]);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.replace("/login");
      return;
    }
    const meData = await me.json();
    if (meData.user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }
    if (meData.user.role !== "CUSTOMER") {
      router.replace("/driver");
      return;
    }
    setUser(meData.user);
    const list = await fetch("/api/deliveries");
    const listData = await list.json();
    setDeliveries(listData.deliveries ?? []);
    const tripRes = await fetch("/api/trips");
    const tripData = await tripRes.json();
    setTrips(tripData.trips ?? []);
  }, [router]);

  usePolling(load, 12000);
  useRelayStream({
    topics: "user",
    enabled: Boolean(user),
    onEvent: (event) => {
      if (event.type === "delivery.updated") {
        setLiveNote(`Live update: ${event.status.replaceAll("_", " ").toLowerCase()}`);
        void load();
      }
    },
  });

  async function createDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff) {
      setError("Choose pickup and dropoff");
      return;
    }
    if (pickup.lat === dropoff.lat && pickup.lng === dropoff.lng) {
      setError("Pickup and dropoff must be different");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffAddress: dropoff.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        spaceNeeded,
        timePreference,
        itemTitle: itemTitle || undefined,
        lonelyCover,
        fullyPackaged,
        greetAtPickup,
        greetAtDropoff,
        tripId: tripId || undefined,
        packageNotes: notes || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create delivery");
      return;
    }
    clearFareGuideDraft();
    setDraftNote("");
    setNotes("");
    await load();
    router.push(`/customer/deliveries/${data.delivery.id}`);
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-10">
        <section>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Send your stuff
          </h1>
          <p className="mt-2 max-w-lg text-slate">
            List pick-up and drop-off — Kiwis heading that way can claim your seat.
          </p>
          {liveNote && <p className="mt-3 text-sm font-semibold text-moss">{liveNote}</p>}
          {draftNote && (
            <p className="mt-3 rounded-xl bg-sea-soft/60 px-3 py-2 text-sm text-sea">{draftNote}</p>
          )}

          <form onSubmit={createDelivery} className="mt-8 space-y-4">
            <PlacePicker id="pickup" label="Pick-up" value={pickup} onChange={setPickup} />
            <PlacePicker id="dropoff" label="Drop-off" value={dropoff} onChange={setDropoff} />
            <div>
              <label className="label" htmlFor="itemTitle">
                My item is a…
              </label>
              <input
                id="itemTitle"
                className="field"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="e.g. Chair, toy box, bike"
              />
            </div>
            <SpacePicker
              id="space"
              label="Stuff will fit in"
              value={spaceNeeded}
              onChange={setSpaceNeeded}
              options={spaceLabels}
            />
            <div>
              <label className="label" htmlFor="timePref">
                Time preference
              </label>
              <select
                id="timePref"
                className="field"
                value={timePreference}
                onChange={(e) => setTimePreference(e.target.value)}
              >
                {timeLabels.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 rounded-2xl bg-white/55 p-4 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={fullyPackaged}
                  onChange={(e) => setFullyPackaged(e.target.checked)}
                  className="mt-1"
                />
                <span>Stuff will be fully packaged (unchecked = I take the risk)</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={greetAtPickup}
                  onChange={(e) => setGreetAtPickup(e.target.checked)}
                  className="mt-1"
                />
                <span>Someone will greet the driver at pickup</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={greetAtDropoff}
                  onChange={(e) => setGreetAtDropoff(e.target.checked)}
                  className="mt-1"
                />
                <span>Someone will greet the driver at drop-off</span>
              </label>
            </div>
            {trips.length > 0 && (
              <div>
                <label className="label" htmlFor="trip">
                  Match a driver journey (optional)
                </label>
                <select
                  id="trip"
                  className="field"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                >
                  <option value="">Open listing — any matching driver</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.driver.name}: {t.fromAddress.split(",")[0]} →{" "}
                      {t.toAddress.split(",")[0]} ·{" "}
                      {new Date(t.departAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-start gap-3 rounded-2xl bg-white/55 p-4 text-sm">
              <input
                type="checkbox"
                checked={lonelyCover}
                onChange={(e) => setLonelyCover(e.target.checked)}
                className="mt-1"
              />
              <span>
                <strong>Lonely Cover</strong> — add ${LONELY_COVER_FEE} to protect your
                stuff up to $2,000.{" "}
                <Link href="/lonely-cover" className="text-sea underline underline-offset-4">
                  Policy
                </Link>
              </span>
            </label>
            <div>
              <label className="label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className="field min-h-24"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, fragile, leave with receptionist…"
              />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-white/60 px-5 py-4">
              <div>
                <p className="text-sm text-slate">Guide fare</p>
                <p className="font-display text-3xl font-bold">
                  {estimate ? `$${estimate.fare.toFixed(2)}` : "—"}
                </p>
                <p className="text-sm text-slate">
                  {estimate ? `~${estimate.distance.toFixed(0)} km` : "Choose pick-up and drop-off"}
                </p>
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "Listing…" : "List my stuff"}
              </button>
            </div>
            {error && <p className="text-sm text-[#8a2f2f]">{error}</p>}
          </form>

          {pickup && dropoff && (
            <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[var(--line)]">
              <DeliveryMap
                center={[pickup.lat, pickup.lng]}
                markers={[
                  {
                    id: "pickup",
                    position: [pickup.lat, pickup.lng],
                    label: `Pick-up: ${pickup.address}`,
                    tone: "pickup",
                  },
                  {
                    id: "dropoff",
                    position: [dropoff.lat, dropoff.lng],
                    label: `Drop-off: ${dropoff.address}`,
                    tone: "dropoff",
                  },
                ]}
              />
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Your deliveries</h2>
          <div className="mt-4 space-y-3">
            {deliveries.length === 0 && (
              <p className="text-slate">No deliveries yet.</p>
            )}
            {deliveries.map((d) => (
              <Link
                key={d.id}
                href={`/customer/deliveries/${d.id}`}
                className="block rounded-2xl border border-[var(--line)] bg-white/55 p-4 transition hover:bg-white/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {d.pickupAddress.split(",")[0]} →{" "}
                      {d.dropoffAddress.split(",")[0]}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      ${d.offerAmount.toFixed(2)} · {d.distanceKm} km ·{" "}
                      {d.packageSize.toLowerCase()}
                      {d.paymentStatus ? ` · ${d.paymentStatus.toLowerCase()}` : ""}
                      {d.driver ? ` · ${d.driver.name}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
