"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { DeliveryMap } from "@/components/DeliveryMap";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { DEMO_PLACES, distanceKm, estimateFare, SPACE_LABELS, traditionalCompareFare } from "@/lib/geo";
import { usePolling } from "@/lib/use-polling";
import { useRelayStream } from "@/lib/use-relay-stream";
import type { DeliveryStatusValue } from "@/lib/delivery-status";

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
  driver?: { name: string } | null;
};

export default function CustomerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pickup, setPickup] = useState<PlaceValue | null>({
    address: DEMO_PLACES[0].address,
    lat: DEMO_PLACES[0].lat,
    lng: DEMO_PLACES[0].lng,
  });
  const [dropoff, setDropoff] = useState<PlaceValue | null>({
    address: DEMO_PLACES[1].address,
    lat: DEMO_PLACES[1].lat,
    lng: DEMO_PLACES[1].lng,
  });
  const [packageSize, setPackageSize] = useState<"SMALL" | "MEDIUM" | "LARGE">(
    "SMALL",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liveNote, setLiveNote] = useState("");

  const estimate = useMemo(() => {
    if (!pickup || !dropoff) return null;
    const d = distanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    return { distance: d, fare: estimateFare(d, packageSize) };
  }, [pickup, dropoff, packageSize]);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.replace("/login");
      return;
    }
    const meData = await me.json();
    if (meData.user.role !== "CUSTOMER") {
      router.replace("/driver");
      return;
    }
    setUser(meData.user);
    const list = await fetch("/api/deliveries");
    const listData = await list.json();
    setDeliveries(listData.deliveries ?? []);
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
        packageSize,
        packageNotes: notes || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create delivery");
      return;
    }
    setNotes("");
    await load();
    router.push(`/customer/deliveries/${data.delivery.id}`);
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-10">
        <section>
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Send your stuff
          </h1>
          <p className="mt-2 max-w-lg text-slate">
            List pickup and dropoff across Aotearoa. Drivers already heading that way
            see your lonely seat request within ~50 km of the corridor.
          </p>
          {liveNote && <p className="mt-3 text-sm font-semibold text-moss">{liveNote}</p>}

          <form onSubmit={createDelivery} className="mt-8 space-y-4">
            <PlacePicker id="pickup" label="Pickup" value={pickup} onChange={setPickup} />
            <PlacePicker id="dropoff" label="Dropoff" value={dropoff} onChange={setDropoff} />
            <div>
              <label className="label" htmlFor="size">
                Package size
              </label>
              <select
                id="size"
                className="field"
                value={packageSize}
                onChange={(e) =>
                  setPackageSize(e.target.value as "SMALL" | "MEDIUM" | "LARGE")
                }
              >
                <option value="SMALL">{SPACE_LABELS.SMALL}</option>
                <option value="MEDIUM">{SPACE_LABELS.MEDIUM}</option>
                <option value="LARGE">{SPACE_LABELS.LARGE}</option>
              </select>
            </div>
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
                <p className="text-sm text-slate">Lonelyseat guide (NZD)</p>
                <p className="font-display text-3xl font-bold">
                  {estimate ? `$${estimate.fare.toFixed(2)}` : "—"}
                </p>
                <p className="text-sm text-slate">
                  {estimate
                    ? `~${estimate.distance.toFixed(0)} km · typical courier ~$${traditionalCompareFare(estimate.fare).toFixed(0)}`
                    : "Pick two points"}
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
                    label: `Pickup: ${pickup.address}`,
                    tone: "pickup",
                  },
                  {
                    id: "dropoff",
                    position: [dropoff.lat, dropoff.lng],
                    label: `Dropoff: ${dropoff.address}`,
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
