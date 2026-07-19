"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { DeliveryMap } from "@/components/DeliveryMap";
import { useLabels } from "@/lib/use-labels";
import { usePolling } from "@/lib/use-polling";
import { SpacePicker } from "@/components/SpacePicker";

type Trip = {
  id: string;
  tripType: string;
  fromAddress: string;
  toAddress: string;
  departAt: string;
  listedPrice?: number | null;
  spaces: string[];
  vehicleType: string;
  notes?: string | null;
  rating: number;
  reviewCount: number;
  driver: { id: string; name: string };
};

type User = { name: string; role: string };

export default function BrowseDriversPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [from, setFrom] = useState<PlaceValue | null>(null);
  const [to, setTo] = useState<PlaceValue | null>(null);
  const [space, setSpace] = useState("");
  const [sort, setSort] = useState("latest");
  const [date, setDate] = useState("flexible");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const spaceLabels = useLabels("SPACE");

  const search = useCallback(async () => {
    if (!from || !to) return;
    const me = await fetch("/api/auth/me");
    if (me.ok) {
      const meData = await me.json();
      setUser(meData.user);
    }
    setBusy(true);
    setError("");
    const params = new URLSearchParams({
      fromLat: String(from.lat),
      fromLng: String(from.lng),
      toLat: String(to.lat),
      toLng: String(to.lng),
      sort,
      date,
      radiusKm: "120",
    });
    if (space) params.set("space", space);
    const res = await fetch(`/api/browse/drivers?${params}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Search failed");
      return;
    }
    setTrips(data.trips ?? []);
  }, [from, to, space, sort, date]);

  usePolling(search, 60000);

  async function sendRequest(trip: Trip) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "CUSTOMER") {
      setError("Switch to a sender account to request a lonely seat");
      return;
    }
    if (!from || !to) {
      setError("Choose item location and destination");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupAddress: from.address,
        pickupLat: from.lat,
        pickupLng: from.lng,
        dropoffAddress: to.address,
        dropoffLat: to.lat,
        dropoffLng: to.lng,
        spaceNeeded: space || trip.spaces[0] || "shoebox",
        itemTitle: itemTitle || "Item for lonely seat",
        tripId: trip.id,
        requestDriverId: trip.driver.id,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send request");
      return;
    }
    setMessage(
      `Request #${data.delivery.requestCode} sent to ${trip.driver.name}. Pay from your Stuff dashboard, then chat in Inbox.`,
    );
    setSelected(null);
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Find a ride</h1>
        <p className="mt-2 text-slate">Lonely seats already heading your way.</p>

        <div className="panel mt-8 space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <PlacePicker
              id="item-location"
              label="From"
              value={from}
              onChange={setFrom}
              placeholder="Pick-up address…"
            />
            <PlacePicker
              id="item-destination"
              label="To"
              value={to}
              onChange={setTo}
              placeholder="Drop-off address…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SpacePicker
              label="Space"
              value={space}
              onChange={setSpace}
              options={spaceLabels}
              allowAny
              anyLabel="Any space"
            />
            <label className="block text-sm">
              <span className="label">Sort</span>
              <select className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="depart">Departure</option>
                <option value="price">Price</option>
                <option value="reviews">Reviews</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="label">When</span>
              <select className="field" value={date} onChange={(e) => setDate(e.target.value)}>
                <option value="flexible">Flexible</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This week</option>
              </select>
            </label>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => void search()} disabled={busy || !from || !to}>
            {busy ? "Searching…" : "Search"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 text-sm text-moss">{message}</p>}

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate">{trips.length} results</p>
          <button type="button" className="btn btn-ghost" onClick={() => setShowMap((v) => !v)}>
            {showMap ? "List" : "Map"}
          </button>
        </div>

        {showMap && from && to && (
          <div className="panel mt-4 overflow-hidden p-0">
            <DeliveryMap
              className="h-64 w-full"
              center={{
                lat: (from.lat + to.lat) / 2,
                lng: (from.lng + to.lng) / 2,
              }}
              zoom={7}
              markers={[
                {
                  id: "from",
                  position: { lat: from.lat, lng: from.lng },
                  label: "From",
                  tone: "pickup",
                },
                {
                  id: "to",
                  position: { lat: to.lat, lng: to.lng },
                  label: "To",
                  tone: "dropoff",
                },
              ]}
            />
          </div>
        )}

        <div className="mt-4 space-y-3">
          {trips.map((t) => (
            <article key={t.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.driver.name}</p>
                  <p className="mt-1 text-sm text-slate">
                    {t.fromAddress.split(",")[0]} → {t.toAddress.split(",")[0]}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    {new Date(t.departAt).toLocaleDateString()} · {t.vehicleType}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-ink">
                    {t.listedPrice != null ? `$${t.listedPrice}` : "—"}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary mt-2"
                    onClick={() => setSelected(t)}
                  >
                    Send request
                  </button>
                </div>
              </div>
            </article>
          ))}
          {trips.length === 0 && !busy && (
            <p className="text-slate">No lonely seats match yet — try different dates or a wider search.</p>
          )}
        </div>

        {selected && (
          <div className="panel mt-6 space-y-3 p-5">
            <h2 className="font-display text-xl font-semibold">
              Request {selected.driver.name}&apos;s seat
            </h2>
            <label className="block text-sm">
              <span className="label">My item is a…</span>
              <input
                className="field"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="e.g. Chair"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void sendRequest(selected)}
              >
                Send request
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-slate">
          <Link href="/customer" className="underline underline-offset-4">
            List your stuff instead
          </Link>
        </p>
      </div>
    </main>
  );
}
