"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { DeliveryMap, type MapMarker } from "@/components/DeliveryMap";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { usePolling } from "@/lib/use-polling";
import { URGENCY_OPTIONS } from "@/lib/urgency";

type TripHit = {
  id: string;
  fromAddress: string;
  toAddress: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  departAt: string;
  listedPrice?: number | null;
  driver: { name: string };
};

type StuffHit = {
  id: string;
  requestCode: string;
  itemTitle: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  offerAmount: number;
  urgency?: string;
  customerName: string;
};

export default function LiveSupplyMapPage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [near, setNear] = useState<PlaceValue | null>(null);
  const [urgency, setUrgency] = useState("flexible");
  const [trips, setTrips] = useState<TripHit[]>([]);
  const [stuff, setStuff] = useState<StuffHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [showTrips, setShowTrips] = useState(true);
  const [showStuff, setShowStuff] = useState(true);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (me.ok) {
      const data = await me.json();
      setUser(data.user);
    }
    setBusy(true);
    const center = near ?? {
      lat: -41.0,
      lng: 174.0,
      address: "New Zealand",
    };
    const base = new URLSearchParams({
      fromLat: String(center.lat),
      fromLng: String(center.lng),
      toLat: String(center.lat),
      toLng: String(center.lng),
      radiusKm: near ? "200" : "2000",
      urgency,
      date: urgency,
      sort: "latest",
    });
    try {
      const [driversRes, stuffRes] = await Promise.all([
        fetch(`/api/browse/drivers?${base}`),
        fetch(`/api/browse/stuff?${base}`),
      ]);
      const driversData = await driversRes.json();
      const stuffData = await stuffRes.json();
      setTrips(driversRes.ok ? (driversData.trips ?? []) : []);
      setStuff(stuffRes.ok ? (stuffData.stuff ?? []) : []);
    } finally {
      setBusy(false);
    }
  }, [near, urgency]);

  usePolling(load, 45000);

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    if (showTrips) {
      for (const t of trips) {
        list.push({
          id: `trip-${t.id}`,
          position: { lat: t.fromLat, lng: t.fromLng },
          label: `${t.driver.name}: ${t.fromAddress.split(",")[0]} → ${t.toAddress.split(",")[0]}`,
          tone: "trip",
        });
      }
    }
    if (showStuff) {
      for (const s of stuff) {
        list.push({
          id: `stuff-${s.id}`,
          position: { lat: s.pickupLat, lng: s.pickupLng },
          label: `${s.itemTitle}: ${s.pickupAddress.split(",")[0]} → ${s.dropoffAddress.split(",")[0]} ($${s.offerAmount.toFixed(0)})`,
          tone: "stuff",
        });
      }
    }
    return list;
  }, [trips, stuff, showTrips, showStuff]);

  const center = near
    ? { lat: near.lat, lng: near.lng }
    : markers[0]
      ? Array.isArray(markers[0].position)
        ? { lat: markers[0].position[0], lng: markers[0].position[1] }
        : markers[0].position
      : { lat: -41.0, lng: 174.0 };

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Live supply map
        </h1>
        <p className="mt-2 max-w-2xl text-slate">
          Open lonely seats and stuff needing a lift across Aotearoa — orange for journeys,
          teal for send listings.
        </p>

        <div className="panel mt-6 grid gap-3 p-5 sm:grid-cols-2">
          <PlacePicker
            id="map-near"
            label="Near (optional)"
            value={near}
            onChange={setNear}
            placeholder="Search a town or address…"
          />
          <div>
            <label className="label" htmlFor="map-urgency">
              Urgency
            </label>
            <select
              id="map-urgency"
              className="field"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              {URGENCY_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTrips}
              onChange={(e) => setShowTrips(e.target.checked)}
            />
            Show journeys ({trips.length})
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showStuff}
              onChange={(e) => setShowStuff(e.target.checked)}
            />
            Show stuff ({stuff.length})
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)]">
          <DeliveryMap className="h-[28rem] md:h-[36rem]" center={center} zoom={near ? 8 : 5} markers={markers} />
        </div>
        {busy ? <p className="mt-3 text-sm text-slate">Refreshing…</p> : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="font-display text-2xl font-semibold">Journeys</h2>
            <div className="mt-3 space-y-2">
              {trips.slice(0, 8).map((t) => (
                <article key={t.id} className="panel p-4 text-sm">
                  <p className="font-semibold">{t.driver.name}</p>
                  <p className="text-slate">
                    {t.fromAddress.split(",")[0]} → {t.toAddress.split(",")[0]}
                  </p>
                  <p className="text-slate">
                    {new Date(t.departAt).toLocaleString()}
                    {t.listedPrice != null ? ` · from $${t.listedPrice}` : ""}
                  </p>
                </article>
              ))}
              {trips.length === 0 ? <p className="text-sm text-slate">No open journeys yet.</p> : null}
            </div>
            <Link href="/browse/drivers" className="mt-3 inline-block text-sm font-medium text-sea underline underline-offset-4">
              Find your stuff a ride
            </Link>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold">Stuff needing a lift</h2>
            <div className="mt-3 space-y-2">
              {stuff.slice(0, 8).map((s) => (
                <article key={s.id} className="panel p-4 text-sm">
                  <p className="font-semibold">{s.itemTitle}</p>
                  <p className="text-slate">
                    {s.pickupAddress.split(",")[0]} → {s.dropoffAddress.split(",")[0]}
                  </p>
                  <p className="text-slate">
                    ${s.offerAmount.toFixed(0)} · {s.customerName}
                  </p>
                  <Link
                    href={`/l/${s.requestCode}`}
                    className="mt-1 inline-block font-medium text-sea underline underline-offset-4"
                  >
                    Open listing
                  </Link>
                </article>
              ))}
              {stuff.length === 0 ? <p className="text-sm text-slate">No open stuff yet.</p> : null}
            </div>
            <Link href="/browse/stuff" className="mt-3 inline-block text-sm font-medium text-sea underline underline-offset-4">
              Find stuff to take
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
