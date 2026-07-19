"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { DeliveryMap } from "@/components/DeliveryMap";
import { DEMO_PLACES } from "@/lib/geo";
import { SPACE_OPTIONS, TRIP_TYPE_LABELS } from "@/lib/spaces";
import { usePolling } from "@/lib/use-polling";

type Trip = {
  id: string;
  tripType: keyof typeof TRIP_TYPE_LABELS;
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
  const [from, setFrom] = useState<PlaceValue | null>({
    address: DEMO_PLACES[0].address,
    lat: DEMO_PLACES[0].lat,
    lng: DEMO_PLACES[0].lng,
  });
  const [to, setTo] = useState<PlaceValue | null>({
    address: DEMO_PLACES[1].address,
    lat: DEMO_PLACES[1].lat,
    lng: DEMO_PLACES[1].lng,
  });
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
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">Browse empty space</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight md:text-5xl">Search drivers</h1>
        <p className="mt-2 text-slate">
          Find lonely seats already heading your way — then send a request.
        </p>

        <div className="panel mt-8 space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <PlacePicker
              id="item-location"
              label="Item location"
              value={from}
              onChange={setFrom}
              placeholder="Search pickup address…"
            />
            <PlacePicker
              id="item-destination"
              label="Item destination"
              value={to}
              onChange={setTo}
              placeholder="Search drop-off address…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="label">Stuff will fit in</span>
              <select className="field" value={space} onChange={(e) => setSpace(e.target.value)}>
                <option value="">Any space</option>
                {SPACE_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="label">Sort by</span>
              <select className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest">Listing (latest)</option>
                <option value="oldest">Listing (oldest)</option>
                <option value="depart">Departure date</option>
                <option value="price">Price</option>
                <option value="reviews">Reviews</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="label">Drop-off date</span>
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
          <p className="text-sm text-slate">{trips.length} lonely seats</p>
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
                  label: "Item location",
                  tone: "pickup",
                },
                {
                  id: "to",
                  position: { lat: to.lat, lng: to.lng },
                  label: "Item destination",
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
                  <p className="text-sm text-slate">
                    {t.fromAddress.split(",")[0]} → {t.toAddress.split(",")[0]}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    ★ {t.rating.toFixed(1)} ({t.reviewCount} trips) ·{" "}
                    {TRIP_TYPE_LABELS[t.tripType]} · {t.vehicleType}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Departs {new Date(t.departAt).toLocaleString()} · Spaces:{" "}
                    {t.spaces.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-ink">
                    {t.listedPrice != null ? `$${t.listedPrice}` : "Guide fare"}
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
            <p className="text-slate">No lonely seats match — try flexible dates or a wider corridor.</p>
          )}
        </div>

        {selected && (
          <div className="panel mt-6 space-y-3 border-2 border-leaf p-5">
            <h2 className="font-display text-xl font-semibold">
              Request {selected.driver.name}&apos;s lonely seat
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
            <p className="text-xs text-slate">
              Items are carried at the owner&apos;s risk unless you add Lonely Cover at payment.
            </p>
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
          Prefer to list first?{" "}
          <Link href="/customer" className="underline">
            Post your stuff
          </Link>
        </p>
      </div>
    </main>
  );
}
