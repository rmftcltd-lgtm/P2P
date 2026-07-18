"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { DeliveryMap } from "@/components/DeliveryMap";
import { usePolling } from "@/lib/use-polling";
import type { DeliveryStatusValue } from "@/lib/delivery-status";

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
  packageNotes?: string | null;
  offerAmount: number;
  distanceKm: number;
  customer: { name: string; phone?: string | null };
  driver?: { name: string; phone?: string | null } | null;
  events: {
    id: string;
    status: DeliveryStatusValue;
    note?: string | null;
    createdAt: string;
  }[];
};

export default function CustomerDeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.replace("/login");
      return;
    }
    setUser((await me.json()).user);
    const res = await fetch(`/api/deliveries/${params.id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not found");
      return;
    }
    setDelivery(data.delivery);
  }, [params.id, router]);

  usePolling(load, 4000);

  async function cancel() {
    if (!delivery) return;
    const res = await fetch(`/api/deliveries/${delivery.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", note: "Cancelled by customer" }),
    });
    if (res.ok) await load();
  }

  if (error) {
    return (
      <main className="atmosphere min-h-screen px-5 py-10">
        <p>{error}</p>
        <Link href="/customer" className="btn btn-ghost mt-4">
          Back
        </Link>
      </main>
    );
  }

  if (!delivery) {
    return (
      <main className="atmosphere min-h-screen px-5 py-10 text-slate">
        Loading…
      </main>
    );
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-4xl px-5 py-8 md:px-10">
        <Link href="/customer" className="text-sm text-slate underline-offset-4 hover:underline">
          ← Back to requests
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Delivery tracking</h1>
            <p className="mt-2 text-slate">
              ${delivery.offerAmount.toFixed(2)} · {delivery.distanceKm} km ·{" "}
              {delivery.packageSize.toLowerCase()}
            </p>
          </div>
          <StatusBadge status={delivery.status} />
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[var(--line)]">
          <DeliveryMap
            className="h-80"
            center={[delivery.pickupLat, delivery.pickupLng]}
            markers={[
              {
                id: "p",
                position: [delivery.pickupLat, delivery.pickupLng],
                label: delivery.pickupAddress,
                tone: "pickup",
              },
              {
                id: "d",
                position: [delivery.dropoffLat, delivery.dropoffLng],
                label: delivery.dropoffAddress,
                tone: "dropoff",
              },
            ]}
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-semibold">Route</h2>
            <p className="mt-3 text-sm text-slate">Pickup</p>
            <p>{delivery.pickupAddress}</p>
            <p className="mt-3 text-sm text-slate">Dropoff</p>
            <p>{delivery.dropoffAddress}</p>
            {delivery.packageNotes && (
              <>
                <p className="mt-3 text-sm text-slate">Notes</p>
                <p>{delivery.packageNotes}</p>
              </>
            )}
            {delivery.driver && (
              <>
                <p className="mt-3 text-sm text-slate">Driver</p>
                <p>
                  {delivery.driver.name}
                  {delivery.driver.phone ? ` · ${delivery.driver.phone}` : ""}
                </p>
              </>
            )}
            {(delivery.status === "PENDING" || delivery.status === "ACCEPTED") && (
              <button type="button" onClick={cancel} className="btn btn-ghost mt-6">
                Cancel delivery
              </button>
            )}
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Timeline</h2>
            <ol className="mt-4 space-y-3">
              {delivery.events.map((ev) => (
                <li key={ev.id} className="border-l-2 border-leaf pl-4">
                  <p className="font-semibold">{ev.status.replaceAll("_", " ")}</p>
                  <p className="text-sm text-slate">
                    {format(new Date(ev.createdAt), "MMM d · h:mm a")}
                    {ev.note ? ` — ${ev.note}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
