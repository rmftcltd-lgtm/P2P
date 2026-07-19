"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { SpaceMultiPicker } from "@/components/SpacePicker";
import { TRIP_TYPE_LABELS } from "@/lib/spaces";
import { useLabels } from "@/lib/use-labels";
import { usePolling } from "@/lib/use-polling";

type Trip = {
  id: string;
  tripType: "ONE_WAY" | "DAY_TRIP" | "MULTI";
  fromAddress: string;
  toAddress: string;
  departAt: string;
  returnAt?: string | null;
  spaces: string;
  vehicleType: string;
  status: string;
  notes?: string | null;
};

export default function DriverTripsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripType, setTripType] = useState<"ONE_WAY" | "DAY_TRIP" | "MULTI">(
    "ONE_WAY",
  );
  const [from, setFrom] = useState<PlaceValue | null>(null);
  const [to, setTo] = useState<PlaceValue | null>(null);
  const [departAt, setDepartAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [spaces, setSpaces] = useState<string[]>(["shoebox", "backseat"]);
  const [vehicleType, setVehicleType] = useState("hatch");
  const [listedPrice, setListedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [multiTo, setMultiTo] = useState<PlaceValue | null>(null);
  const [multiDepartAt, setMultiDepartAt] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const spaceLabels = useLabels("SPACE");
  const rideLabels = useLabels("RIDE");

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.replace("/login");
      return;
    }
    const meData = await me.json();
    if (meData.user.role !== "DRIVER") {
      router.replace("/customer");
      return;
    }
    setUser(meData.user);
    const res = await fetch("/api/trips");
    const data = await res.json();
    setTrips(data.trips ?? []);
  }, [router]);

  usePolling(load, 15000);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!from || !to) {
      setError("Choose from and to places");
      return;
    }
    if (
      from.lat === to.lat &&
      from.lng === to.lng
    ) {
      setError("From and to must differ");
      return;
    }
    if (!departAt) {
      setError("Choose a departure date/time");
      return;
    }
    if (spaces.length === 0) {
      setError("Select at least one lonely seat / space");
      return;
    }
    setBusy(true);
    setError("");
    const payload: Record<string, unknown> = {
      tripType,
      fromAddress: from.address,
      fromLat: from.lat,
      fromLng: from.lng,
      toAddress: to.address,
      toLat: to.lat,
      toLng: to.lng,
      departAt: new Date(departAt).toISOString(),
      returnAt:
        tripType === "DAY_TRIP" && returnAt
          ? new Date(returnAt).toISOString()
          : undefined,
      spaces,
      vehicleType,
      listedPrice: listedPrice ? Number(listedPrice) : undefined,
      notes: notes || undefined,
    };

    if (tripType === "MULTI") {
      if (!multiTo) {
        setBusy(false);
        setError("Choose the next stop for the extra leg");
        return;
      }
      payload.extraLegs = [
        {
          fromAddress: to.address,
          fromLat: to.lat,
          fromLng: to.lng,
          toAddress: multiTo.address,
          toLat: multiTo.lat,
          toLng: multiTo.lng,
          departAt: new Date(multiDepartAt || departAt).toISOString(),
        },
      ];
    }

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create listing");
      return;
    }
    setMessage(data.message ?? "Listing created");
    setNotes("");
    await load();
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[1.05fr_0.95fr] md:px-10">
        <section>
          <Link href="/driver" className="text-sm text-slate hover:underline">
            ← Back to radio
          </Link>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
            List a lonely seat
          </h1>
          <p className="mt-2 text-slate">
            Share a trip you&apos;re already making across Aotearoa.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Trip type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["ONE_WAY", "DAY_TRIP", "MULTI"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      tripType === t ? "bg-leaf text-ink" : "bg-mist text-slate"
                    }`}
                  >
                    {TRIP_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <PlacePicker
              id="trip-from"
              label="From"
              value={from}
              onChange={setFrom}
              placeholder="Search departure address…"
            />
            <PlacePicker
              id="trip-to"
              label="To"
              value={to}
              onChange={setTo}
              placeholder="Search destination address…"
            />

            <div>
              <label className="label" htmlFor="depart">
                Departs
              </label>
              <input
                id="depart"
                type="datetime-local"
                className="field"
                value={departAt}
                onChange={(e) => setDepartAt(e.target.value)}
                required
              />
            </div>

            {tripType === "DAY_TRIP" && (
              <div>
                <label className="label" htmlFor="return">
                  Return (same day)
                </label>
                <input
                  id="return"
                  type="datetime-local"
                  className="field"
                  value={returnAt}
                  onChange={(e) => setReturnAt(e.target.value)}
                />
              </div>
            )}

            {tripType === "MULTI" && (
              <div className="space-y-3 rounded-xl bg-white/50 p-4">
                <p className="font-semibold">Extra leg (multiple listings)</p>
                <PlacePicker
                  id="trip-multi-to"
                  label="Next stop"
                  value={multiTo}
                  onChange={setMultiTo}
                  placeholder="Search next stop…"
                />
                <input
                  type="datetime-local"
                  className="field"
                  value={multiDepartAt}
                  onChange={(e) => setMultiDepartAt(e.target.value)}
                  placeholder="Second leg departs"
                />
              </div>
            )}

            <SpaceMultiPicker
              label="Stuff will fit in"
              values={spaces}
              onChange={setSpaces}
              options={spaceLabels}
            />

            <div>
              <label className="label" htmlFor="vehicle">
                My ride is a…
              </label>
              <select
                id="vehicle"
                className="field"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                {rideLabels.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="price">
                Asking price (NZD, optional)
              </label>
              <input
                id="price"
                type="number"
                min={1}
                step={1}
                className="field"
                value={listedPrice}
                onChange={(e) => setListedPrice(e.target.value)}
                placeholder="e.g. 110"
              />
            </div>

            <div>
              <label className="label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className="field min-h-20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Flexible on timing, boot only, etc."
              />
            </div>

            {error && <p className="text-sm text-[#8a2f2f]">{error}</p>}
            {message && <p className="text-sm text-moss">{message}</p>}

            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Publishing…" : "Publish journey"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Your listings</h2>
          <div className="mt-4 space-y-3">
            {trips.length === 0 && (
              <p className="text-slate">No journeys listed yet.</p>
            )}
            {trips.map((t) => (
              <article
                key={t.id}
                className="rounded-2xl border border-[var(--line)] bg-white/55 p-4"
              >
                <p className="font-semibold">
                  {t.fromAddress.split(",")[0]} → {t.toAddress.split(",")[0]}
                </p>
                <p className="mt-1 text-sm text-slate">
                  {TRIP_TYPE_LABELS[t.tripType]} · {t.status.toLowerCase()} ·{" "}
                  {new Date(t.departAt).toLocaleString()} · {t.vehicleType}
                </p>
                <p className="mt-1 text-sm text-slate">
                  Spaces: {JSON.parse(t.spaces || "[]").join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
